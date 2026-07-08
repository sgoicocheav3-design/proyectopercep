"""Carga del modelo entrenado y logica de prediccion para la API REST.

Sirve el modelo en formato TFLite (models/tflite/model.tflite, generado por
scripts/convert_to_tflite.py) en vez del SavedModel de Keras. Importar
`tensorflow` completo consume ~270MB de RAM solo por el import, antes de
cargar ningun modelo; `tflite-runtime` (el interprete standalone) pesa unos
pocos MB, lo que es la diferencia entre entrar holgado o al limite en el
plan gratuito de 512MB de Render.

`tflite_runtime` no tiene wheel para Windows, asi que en desarrollo local
se cae al interprete embebido en `tensorflow` (misma API) si el paquete
liviano no esta instalado; en el contenedor de deploy (Linux) se usa
siempre tflite_runtime, ver requirements-api.txt / docker/Dockerfile.
"""

import io

import numpy as np
from PIL import Image

try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:
    from tensorflow.lite.python.interpreter import Interpreter

from src.common import config

_interpreter = None  # cache del interprete cargado (lazy load)


def load_model() -> Interpreter:
    global _interpreter
    if _interpreter is None:
        interpreter = Interpreter(model_path=config.TFLITE_MODEL_PATH)
        interpreter.allocate_tensors()
        _interpreter = interpreter
    return _interpreter


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Aplica el mismo preprocesamiento usado en entrenamiento: resize a
    256x256 y normalizacion a [0,1]."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((config.IMG_WIDTH, config.IMG_HEIGHT))
    array = np.asarray(image, dtype=np.float32) / 255.0
    return np.expand_dims(array, axis=0)  # batch de 1


def _is_plant_or_leaf(image_bytes: bytes) -> bool:
    """Filtro ligero basado en analisis de color HSV para detectar si la imagen
    contiene una planta o hoja (tonos verdes/marrones predominantes).
    Funciona sin TensorFlow completo, solo necesita Pillow y numpy."""
    import colorsys

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Reducimos a 64x64 para analisis rapido
    image = image.resize((64, 64))
    pixels = np.asarray(image, dtype=np.float32) / 255.0

    green_count = 0
    total = 0

    for row in pixels:
        for r, g, b in row:
            h, s, v = colorsys.rgb_to_hsv(float(r), float(g), float(b))
            total += 1
            # Verde: hue entre 0.20 y 0.50 (60° a 180°), saturation > 0.12, no muy oscuro
            # Tambien aceptamos marrones/amarillos (hojas enfermas): hue 0.05-0.20
            h_deg = h * 360
            if s > 0.12 and v > 0.10:
                if 55 <= h_deg <= 185:   # verdes, amarillo-verdes, verde-azulados
                    green_count += 1
                elif 20 <= h_deg < 55 and s < 0.75:  # amarillos/marrones de hojas enfermas
                    green_count += 1

    green_ratio = green_count / total if total > 0 else 0

    # Necesitamos al menos 18% de pixeles con tonos de planta para considerar que es una planta.
    # El ceviche, casas, perros, etc. quedan muy por debajo de este umbral.
    return green_ratio >= 0.18


def predict(image_bytes: bytes) -> dict:
    # 1. Filtro estricto (MobileNetV3Small) para rechazar casas, pelotas, etc.
    if not _is_plant_or_leaf(image_bytes):
        return {
            "error": "La imagen no parece ser una planta o una hoja válida. Por favor intenta con otra foto."
        }

    # 2. Prediccion de la enfermedad con nuestro modelo principal
    interpreter = load_model()
    batch = preprocess_image(image_bytes)

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    interpreter.set_tensor(input_details[0]["index"], batch)
    interpreter.invoke()
    probabilities = interpreter.get_tensor(output_details[0]["index"])[0]

    top_index = int(np.argmax(probabilities))
    confidence = float(probabilities[top_index])

    # 3. Umbral de Confianza adicional (Opción 1 integrada como respaldo)
    if confidence < 0.60:
        return {
            "error": "El modelo no esta lo suficientemente seguro de reconocer la enfermedad. Asegurate de que la foto este enfocada."
        }

    return {
        "predicted_class": config.CLASS_NAMES[top_index],
        "confidence": confidence,
        "all_probabilities": {
            class_name: float(prob) for class_name, prob in zip(config.CLASS_NAMES, probabilities)
        },
    }
