"""Carga del modelo entrenado y logica de prediccion para la API REST."""

import io

import numpy as np
from PIL import Image
import tensorflow as tf

from src.common import config

_model = None  # cache del modelo cargado (lazy load)


def load_model() -> tf.keras.Model:
    global _model
    if _model is None:
        _model = tf.keras.models.load_model(config.SAVED_MODEL_DIR)
    return _model


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Aplica el mismo preprocesamiento usado en entrenamiento: resize a
    256x256 y normalizacion a [0,1]."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((config.IMG_WIDTH, config.IMG_HEIGHT))
    array = np.asarray(image, dtype=np.float32) / 255.0
    return np.expand_dims(array, axis=0)  # batch de 1


def predict(image_bytes: bytes) -> dict:
    model = load_model()
    batch = preprocess_image(image_bytes)
    probabilities = model.predict(batch, verbose=0)[0]

    top_index = int(np.argmax(probabilities))
    return {
        "predicted_class": config.CLASS_NAMES[top_index],
        "confidence": float(probabilities[top_index]),
        "all_probabilities": {
            class_name: float(prob) for class_name, prob in zip(config.CLASS_NAMES, probabilities)
        },
    }
