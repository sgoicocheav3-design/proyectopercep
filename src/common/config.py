"""Configuracion global del proyecto: rutas, clases e hiperparametros.

Todos los modulos (ingesta Spark, dataset tf.data, arquitectura y
entrenamiento) importan sus constantes desde aqui para evitar valores
hardcodeados repetidos en distintos scripts.
"""

import os

# ---------------------------------------------------------------------------
# Rutas del proyecto
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")               # imagenes originales por clase
INTERIM_DATA_DIR = os.path.join(DATA_DIR, "interim")        # imagenes intermedias (debug)
PARQUET_DIR = os.path.join(DATA_DIR, "processed", "parquet")  # salida de Spark

MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
CHECKPOINTS_DIR = os.path.join(MODELS_DIR, "checkpoints")
SAVED_MODEL_DIR = os.path.join(MODELS_DIR, "saved_model")
EVALUATION_DIR = os.path.join(MODELS_DIR, "evaluation")

# ---------------------------------------------------------------------------
# Clases del dataset (PlantVillage - subconjunto de 15 clases)
# Tomate: 10 | Papa: 3 | Pimiento: 2  -> ver seccion 3.1 del documento fuente
# El orden de esta lista define el indice usado por las capas Softmax/One-Hot.
# ---------------------------------------------------------------------------
CLASS_NAMES = [
    "Pepper__bell___Bacterial_spot",
    "Pepper__bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato__Target_Spot",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato__Tomato_mosaic_virus",
    "Tomato_healthy",
]
NUM_CLASSES = len(CLASS_NAMES)  # 15
CLASS_TO_INDEX = {name: idx for idx, name in enumerate(CLASS_NAMES)}

# ---------------------------------------------------------------------------
# Preprocesamiento (seccion 3.2)
# ---------------------------------------------------------------------------
IMG_HEIGHT = 256
IMG_WIDTH = 256
IMG_CHANNELS = 3
IMG_SIZE = (IMG_HEIGHT, IMG_WIDTH)

TRAIN_SPLIT = 0.8
VAL_SPLIT = 0.10
TEST_SPLIT = 0.10

# ---------------------------------------------------------------------------
# Hiperparametros de entrenamiento (seccion 4.3)
# ---------------------------------------------------------------------------
BATCH_SIZE_PER_REPLICA = 32   # batch por GPU -> efectivo = 32 * num_workers (96 con 3 GPUs)
LEARNING_RATE = 0.001
EPOCHS = 20
DROPOUT_1 = 0.5
DROPOUT_2 = 0.3
DENSE_UNITS = 512
SHUFFLE_BUFFER = 2048
RANDOM_SEED = 42
