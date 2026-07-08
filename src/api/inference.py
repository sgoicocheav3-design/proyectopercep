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
_mobilenet_model = None


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
    """Filtro ultra-ligero (MobileNetV2) para rechazar objetos que no sean hojas."""
    global _mobilenet_model
    try:
        from tensorflow.keras.applications import mobilenet_v2
        from tensorflow.keras.preprocessing import image as keras_image
    except ImportError:
        # En produccion puro tflite (sin tf completo), saltamos el filtro por falta de RAM
        return True

    if _mobilenet_model is None:
        # Pesa solo ~14MB, ideal para limites estrictos de RAM
        _mobilenet_model = mobilenet_v2.MobileNetV2(weights='imagenet')

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224))
    x = keras_image.img_to_array(image)
    x = np.expand_dims(x, axis=0)
    x = mobilenet_v2.preprocess_input(x)
    
    preds = _mobilenet_model.predict(x, verbose=0)
    results = mobilenet_v2.decode_predictions(preds, top=5)[0]
    
    # Palabras clave de RECHAZO INMEDIATO (comida preparada, platos, animales, personas, arquitectura, objetos comunes)
    reject_keywords = [
        'bowl', 'plate', 'cup', 'dish', 'restaurant', 'menu', 'guacamole', 'consomme', 
        'soup', 'pizza', 'burger', 'meat', 'fish', 'dog', 'cat', 'person', 'car', 'vehicle',
        'house', 'building', 'toys', 'ball', 'racket', 'furniture', 'table', 'chair',
        'potpie', 'trifle', 'hot_pot', 'wok', 'frying_pan', 'spatula', 'television', 'laptop',
        'cell_phone', 'clothing', 'shoe', 'bottle'
    ]
    
    # 1. Si detecta que es comida, platos, animales o cosas obvias, lo rechaza de inmediato.
    for _, name, _ in results:
        # Dividimos el nombre (ej. "hot_dog" -> ["hot", "dog"]) para evitar falsos positivos 
        # como "greenhouse" bloqueado por culpa de la palabra "house".
        words = name.lower().replace('_', ' ').split()
        if any(keyword in words for keyword in reject_keywords):
            return False
            
    # 2. Si NO es nada de lo anterior, la dejamos pasar. 
    # (Los modelos genericos no conocen la palabra "hoja", asi que pueden clasificar
    # una planta real como algo raro. Es mas seguro dejarla pasar si no es comida).
    return True


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
