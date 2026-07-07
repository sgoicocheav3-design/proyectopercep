"""Arquitectura del modelo avanzado: MobileNetV2 + Transfer Learning.

Implementa el diseno descrito en la seccion 4.2 del documento:
    Input(256,256,3) -> MobileNetV2 preentrenada (ImageNet) como extractor
    -> GlobalAveragePooling2D -> Dropout(0.5) -> Dense(512, ReLU)
    -> BatchNormalization -> Dropout(0.3) -> Dense(15, Softmax)
"""

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2

from src.common import config


def build_model(
    input_shape=(config.IMG_HEIGHT, config.IMG_WIDTH, config.IMG_CHANNELS),
    num_classes: int = config.NUM_CLASSES,
    freeze_base: bool = True,
) -> tf.keras.Model:
    """Construye el modelo MobileNetV2 con cabeza de clasificacion personalizada.

    Args:
        input_shape: dimensiones de entrada RGB.
        num_classes: numero de clases de salida (15 enfermedades).
        freeze_base: si True, congela los pesos preentrenados de MobileNetV2
            (Transfer Learning "feature extraction"). Ponerlo en False permite
            fine-tuning de la red completa en una segunda fase de entrenamiento.
    """
    base_model = MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = not freeze_base

    inputs = layers.Input(shape=input_shape, name="input_image")
    x = base_model(inputs, training=False if freeze_base else None)

    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.Dropout(config.DROPOUT_1, name="dropout_1")(x)
    x = layers.Dense(config.DENSE_UNITS, activation="relu", name="dense_512")(x)
    x = layers.BatchNormalization(name="batch_norm")(x)
    x = layers.Dropout(config.DROPOUT_2, name="dropout_2")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="plant_disease_mobilenetv2")
    return model


def compile_model(model: tf.keras.Model, optimizer: tf.keras.optimizers.Optimizer = None) -> tf.keras.Model:
    """Compila el modelo con la funcion de perdida e hiperparametros de la seccion 4.3.

    El optimizer se recibe como parametro (en vez de crearlo aqui) porque en
    entrenamiento distribuido con Horovod debe envolverse primero con
    `hvd.DistributedOptimizer` antes de compilar (ver src/training/train.py).
    """
    optimizer = optimizer or tf.keras.optimizers.Adam(learning_rate=config.LEARNING_RATE)

    model.compile(
        optimizer=optimizer,
        loss="categorical_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ],
    )
    return model


if __name__ == "__main__":
    m = build_model()
    m = compile_model(m)
    m.summary()
