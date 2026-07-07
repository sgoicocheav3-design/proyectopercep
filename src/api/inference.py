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


def predict(image_bytes: bytes) -> dict:
    interpreter = load_model()
    batch = preprocess_image(image_bytes)

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    interpreter.set_tensor(input_details[0]["index"], batch)
    interpreter.invoke()
    probabilities = interpreter.get_tensor(output_details[0]["index"])[0]

    top_index = int(np.argmax(probabilities))
    return {
        "predicted_class": config.CLASS_NAMES[top_index],
        "confidence": float(probabilities[top_index]),
        "all_probabilities": {
            class_name: float(prob) for class_name, prob in zip(config.CLASS_NAMES, probabilities)
        },
    }
