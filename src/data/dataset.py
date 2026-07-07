"""Pipeline tf.data que alimenta el entrenamiento a partir del Parquet
generado por src/data/spark_ingest.py.

Cada fila del Parquet contiene:
    image      : binary  -> bytes crudos uint8, shape (256, 256, 3)
    label      : int     -> indice de clase (0..14)
    label_name : string  -> nombre legible de la clase

La normalizacion a [0,1] se aplica aqui (no en Spark) para mantener el
Parquet compacto en disco.
"""

import os

import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import tensorflow as tf

from src.common import config


def load_split_arrays(split: str, parquet_dir: str = None):
    """Lee un split completo de Parquet a memoria como arrays numpy.

    Para datasets del tamano descrito en el documento (~20k imagenes,
    256x256x3 uint8 ~ un par de GB en total) esto es viable en un solo
    nodo/worker; si el dataset creciera mucho mas convendria reemplazar
    esta funcion por lectura perezosa via `tf.data.Dataset.from_generator`
    sobre un `pyarrow.dataset` con batches, sin cambiar la interfaz publica
    `get_dataset`.
    """
    parquet_dir = parquet_dir or config.PARQUET_DIR
    split_path = os.path.join(parquet_dir, split)

    table = pq.ParquetDataset(split_path).read()
    df: pd.DataFrame = table.to_pandas()

    num_samples = len(df)
    images = np.empty(
        (num_samples, config.IMG_HEIGHT, config.IMG_WIDTH, config.IMG_CHANNELS),
        dtype=np.uint8,
    )
    for i, raw_bytes in enumerate(df["image"].values):
        images[i] = np.frombuffer(raw_bytes, dtype=np.uint8).reshape(
            config.IMG_HEIGHT, config.IMG_WIDTH, config.IMG_CHANNELS
        )

    labels = df["label"].to_numpy(dtype=np.int64)
    return images, labels


def get_dataset(
    split: str,
    batch_size: int = None,
    shuffle: bool = None,
    shard_index: int = 0,
    num_shards: int = 1,
    parquet_dir: str = None,
) -> tf.data.Dataset:
    """Construye un tf.data.Dataset listo para `model.fit`.

    Args:
        split: "train", "val" o "test".
        batch_size: tamano de batch; por defecto config.BATCH_SIZE_PER_REPLICA.
        shuffle: si se baraja el dataset; por defecto True solo para "train".
        shard_index / num_shards: usados por Horovod para que cada worker
            entrene sobre una particion distinta del dataset (ver src/training/train.py).
    """
    batch_size = batch_size or config.BATCH_SIZE_PER_REPLICA
    shuffle = shuffle if shuffle is not None else (split == "train")

    images, labels = load_split_arrays(split, parquet_dir)

    ds = tf.data.Dataset.from_tensor_slices((images, labels))

    if num_shards > 1:
        ds = ds.shard(num_shards=num_shards, index=shard_index)

    if shuffle:
        ds = ds.shuffle(buffer_size=min(config.SHUFFLE_BUFFER, len(images)), seed=config.RANDOM_SEED)

    def _prepare(image, label):
        image = tf.cast(image, tf.float32) / 255.0  # normalizacion a [0,1]
        label = tf.one_hot(label, depth=config.NUM_CLASSES)
        return image, label

    ds = ds.map(_prepare, num_parallel_calls=tf.data.AUTOTUNE)
    ds = ds.batch(batch_size, drop_remainder=(split == "train"))
    ds = ds.prefetch(tf.data.AUTOTUNE)

    return ds


def steps_per_epoch(split: str, batch_size: int = None, num_shards: int = 1, parquet_dir: str = None) -> int:
    """Numero de batches por epoca para un split y una configuracion de sharding dados."""
    batch_size = batch_size or config.BATCH_SIZE_PER_REPLICA
    parquet_dir = parquet_dir or config.PARQUET_DIR
    split_path = os.path.join(parquet_dir, split)

    num_samples = pq.ParquetDataset(split_path).read().num_rows
    num_samples_per_shard = num_samples // num_shards
    return max(1, num_samples_per_shard // batch_size)
