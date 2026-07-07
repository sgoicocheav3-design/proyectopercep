"""Ingesta y preprocesamiento distribuido con Apache Spark.

Lee las imagenes crudas de PlantVillage desde `data/raw/<clase>/*.jpg`,
las redimensiona, filtra ruido y normaliza, y escribe el resultado en
formato Parquet particionado por split (train/val/test), tal como
describe la seccion 3.2 del documento del proyecto.

Uso:
    spark-submit src/data/spark_ingest.py

El job es puramente Spark + Python (PIL/OpenCV via UDF), sin dependencias
de TensorFlow, para poder correr en los nodos del cluster HDFS/YARN sin
necesitar GPU.
"""

import argparse
import io
import sys
import os

import numpy as np
from PIL import Image
import cv2

from pyspark.sql import SparkSession, Window
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType,
    StructField,
    BinaryType,
    IntegerType,
    StringType,
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from src.common import config


def build_spark_session(app_name: str = "PlantVillage-Ingest") -> SparkSession:
    """Crea la SparkSession. En el cluster real se apunta a YARN; en local
    basta con dejar el master por defecto (local[*]) para pruebas.

    En modo local[*] no existen executors separados: el propio proceso
    driver hace todo el trabajo, por lo que `spark.executor.memory` no tiene
    efecto real ahi. `spark.driver.memory` es la que evita OutOfMemoryError
    al procesar/barajar miles de imagenes (default de Spark es solo 1g).
    """
    return (
        SparkSession.builder.appName(app_name)
        .config("spark.sql.shuffle.partitions", "64")
        .config("spark.driver.memory", "6g")
        .config("spark.executor.memory", "6g")  # ver seccion 4.3: 6GB RAM por executor (cluster real)
        .getOrCreate()
    )


def _extract_label(path_col: str) -> str:
    """Extrae el nombre de la clase a partir de la carpeta contenedora.
    Espera rutas del tipo: .../data/raw/<clase>/imagen.jpg
    """
    normalized = path_col.replace("\\", "/")
    return normalized.split("/")[-2]


def _preprocess_image_bytes(raw_bytes: bytes) -> bytes:
    """Decodifica, elimina ruido, redimensiona y normaliza una imagen.

    Se guarda como uint8 (no float32) para mantener el Parquet compacto;
    la normalizacion a [0,1] se aplica en la etapa de carga (src/data/dataset.py),
    ya que hacerlo aqui cuadriplicaria el tamano en disco sin beneficio real.
    """
    image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    image_np = np.array(image)

    # Filtrado de ruido (Gaussian Blur) antes de redimensionar, para no
    # amplificar artefactos al hacer resize. Se prefiere sobre Non-Local
    # Means: mismo objetivo de reduccion de ruido, pero ordenes de magnitud
    # mas rapido (NLM es prohibitivamente lento sobre ~20k imagenes en CPU).
    denoised = cv2.GaussianBlur(image_np, (3, 3), 0)

    resized = cv2.resize(
        denoised, (config.IMG_WIDTH, config.IMG_HEIGHT), interpolation=cv2.INTER_AREA
    )

    return resized.astype(np.uint8).tobytes()


def _assign_splits(df):
    """Asigna train/val/test de forma estratificada por clase, para que
    cada subconjunto conserve la proporcion de clases del dataset original.
    """
    window = Window.partitionBy("label").orderBy("rand_order")

    df = df.withColumn("rand_order", F.rand(seed=config.RANDOM_SEED))
    df = df.withColumn("row_number", F.row_number().over(window))
    df = df.withColumn("class_count", F.count("*").over(Window.partitionBy("label")))
    df = df.withColumn("pct", F.col("row_number") / F.col("class_count"))

    df = df.withColumn(
        "split",
        F.when(F.col("pct") <= config.TRAIN_SPLIT, F.lit("train"))
        .when(F.col("pct") <= config.TRAIN_SPLIT + config.VAL_SPLIT, F.lit("val"))
        .otherwise(F.lit("test")),
    )

    return df.drop("rand_order", "row_number", "class_count", "pct")


def run(raw_dir: str = None, output_dir: str = None) -> None:
    raw_dir = raw_dir or config.RAW_DATA_DIR
    output_dir = output_dir or config.PARQUET_DIR

    spark = build_spark_session()
    sc = spark.sparkContext

    extract_label_udf = F.udf(_extract_label, StringType())

    preprocess_schema = BinaryType()
    preprocess_udf = F.udf(_preprocess_image_bytes, preprocess_schema)

    # binaryFile: cada fila = 1 imagen con su path y contenido crudo.
    # recursiveFileLookup es necesario para que Spark descienda a cada
    # subcarpeta de clase (data/raw/<clase>/*.jpg); sin esta opcion el
    # dataframe queda vacio.
    raw_df = (
        spark.read.format("binaryFile")
        .option("recursiveFileLookup", "true")
        # pathGlobFilter usa sintaxis de glob de Hadoop (no admite listas
        # separadas por ";"); las alternativas van con llaves "{...,...}".
        .option("pathGlobFilter", "*.{jpg,JPG,jpeg,JPEG,png,PNG}")
        .load(raw_dir)
    )

    labeled_df = raw_df.withColumn("label_name", extract_label_udf(F.col("path")))

    # Solo conservamos las 15 clases definidas en config.CLASS_NAMES.
    labeled_df = labeled_df.filter(F.col("label_name").isin(config.CLASS_NAMES))

    label_to_index_map = F.create_map(
        [F.lit(x) for pair in config.CLASS_TO_INDEX.items() for x in pair]
    )

    processed_df = labeled_df.select(
        preprocess_udf(F.col("content")).alias("image"),
        label_to_index_map[F.col("label_name")].cast(IntegerType()).alias("label"),
        F.col("label_name"),
    )

    split_df = _assign_splits(processed_df)

    for split_name in ("train", "val", "test"):
        (
            split_df.filter(F.col("split") == split_name)
            .drop("split")
            .repartition(16)
            .write.mode("overwrite")
            .parquet(os.path.join(output_dir, split_name))
        )
        print(f"[spark_ingest] Split '{split_name}' escrito en {output_dir}/{split_name}")

    spark.stop()


def parse_args():
    parser = argparse.ArgumentParser(description="Ingesta PlantVillage -> Parquet")
    parser.add_argument("--raw-dir", type=str, default=config.RAW_DATA_DIR)
    parser.add_argument("--output-dir", type=str, default=config.PARQUET_DIR)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(raw_dir=args.raw_dir, output_dir=args.output_dir)
