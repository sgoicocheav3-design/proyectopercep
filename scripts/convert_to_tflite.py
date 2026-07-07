"""Convierte el SavedModel entrenado (models/saved_model/) a TFLite.

Se ejecuta una sola vez en el entorno de desarrollo (requiere el paquete
`tensorflow` completo, ya presente en requirements.txt para entrenamiento).
El .tflite resultante es el artefacto que se versiona y se copia al
contenedor de deploy; ese contenedor solo necesita `tflite-runtime`
(unos pocos MB, ver requirements-api.txt) en vez de `tensorflow` completo
(~250MB+ de RAM solo para importar la libreria).
"""

import os

import tensorflow as tf

from src.common import config


def convert() -> None:
    # Sin converter.optimizations: probado con quantization DEFAULT (dynamic
    # range) y la precision se degrado de forma notoria (~33% de predicciones
    # top-1 distintas al modelo original en una muestra chica, incluso con
    # alta confianza invertida). El ahorro de RAM que buscamos viene de no
    # importar tensorflow completo en el contenedor de deploy, no de
    # comprimir los pesos, asi que no vale la pena el riesgo de precision.
    converter = tf.lite.TFLiteConverter.from_saved_model(config.SAVED_MODEL_DIR)
    tflite_model = converter.convert()

    os.makedirs(config.TFLITE_MODEL_DIR, exist_ok=True)
    with open(config.TFLITE_MODEL_PATH, "wb") as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(config.TFLITE_MODEL_PATH) / (1024 * 1024)
    print(f"Modelo TFLite escrito en: {config.TFLITE_MODEL_PATH}")
    print(f"Tamano: {size_mb:.2f} MB")


if __name__ == "__main__":
    convert()
