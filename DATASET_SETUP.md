# Configuracion del dataset PlantVillage

Pasos exactos para poblar `data/raw/` y poder ejecutar el pipeline
(Spark -> Parquet -> entrenamiento) sin errores.

## 1. Origen del dataset

Dataset de Kaggle: **`emmarex/plantdisease`** (PlantVillage, version color,
fondos uniformes). Contiene 38 clases en total; este proyecto usa un
subconjunto de **15 clases** (Tomate: 10, Papa: 3, Pimiento: 2), segun la
seccion 3.1 del documento.

## 2. Credenciales de Kaggle

1. Crea una cuenta en https://www.kaggle.com si no tienes una.
2. Ve a `Account -> Settings -> API -> Create New Token`. Se descarga `kaggle.json`.
3. Coloca el archivo en:
   - Windows: `C:\Users\<tu_usuario>\.kaggle\kaggle.json`
   - Linux/Mac: `~/.kaggle/kaggle.json`

## 3. Descarga automatica (recomendada)

Desde la raiz del proyecto, con el entorno virtual activado y
`requirements.txt` instalado:

```
python scripts/download_plantvillage.py
```

Este script descarga el zip completo desde Kaggle, lo descomprime en
`data/_kaggle_download/`, y copia **unicamente** las 15 clases necesarias a
`data/raw/<clase>/`, descartando el resto del dataset (otras 23 clases de
otros cultivos que el documento no contempla).

## 4. Descarga manual (alternativa)

Si prefieres no usar la API de Kaggle:

1. Descarga el dataset desde: https://www.kaggle.com/datasets/emmarex/plantdisease
2. Descomprime el zip.
3. Localiza la carpeta `PlantVillage/` dentro del zip descomprimido.
4. Copia manualmente **solo** estas 15 subcarpetas hacia `data/raw/` del
   proyecto (deben quedar exactamente con este nombre, sin renombrar):

```
data/raw/Pepper__bell___Bacterial_spot/
data/raw/Pepper__bell___healthy/
data/raw/Potato___Early_blight/
data/raw/Potato___Late_blight/
data/raw/Potato___healthy/
data/raw/Tomato_Bacterial_spot/
data/raw/Tomato_Early_blight/
data/raw/Tomato_Late_blight/
data/raw/Tomato_Leaf_Mold/
data/raw/Tomato_Septoria_leaf_spot/
data/raw/Tomato_Spider_mites_Two_spotted_spider_mite/
data/raw/Tomato__Target_Spot/
data/raw/Tomato__Tomato_YellowLeaf__Curl_Virus/
data/raw/Tomato__Tomato_mosaic_virus/
data/raw/Tomato_healthy/
```

Cada una de esas 15 carpetas debe contener directamente los archivos
`.jpg`/`.JPG`/`.png` de esa clase (sin subcarpetas intermedias adicionales).

## 5. Verificacion antes de correr el pipeline

Estructura esperada final:

```
ProyectoPercep/
└── data/
    └── raw/
        ├── Pepper__bell___Bacterial_spot/
        │   ├── image001.jpg
        │   └── ...
        ├── Pepper__bell___healthy/
        ├── Potato___Early_blight/
        ├── Potato___Late_blight/
        ├── Potato___healthy/
        ├── Tomato_Bacterial_spot/
        ├── Tomato_Early_blight/
        ├── Tomato_Late_blight/
        ├── Tomato_Leaf_Mold/
        ├── Tomato_Septoria_leaf_spot/
        ├── Tomato_Spider_mites_Two_spotted_spider_mite/
        ├── Tomato__Target_Spot/
        ├── Tomato__Tomato_YellowLeaf__Curl_Virus/
        ├── Tomato__Tomato_mosaic_virus/
        └── Tomato_healthy/
```

Los nombres de carpeta deben coincidir **exactamente** con
`src/common/config.py -> CLASS_NAMES`, ya que `spark_ingest.py` usa el
nombre de la carpeta padre como etiqueta y descarta cualquier clase que no
este en esa lista.

## 6. Ejecutar el pipeline completo

```
# 1) Preprocesar imagenes crudas -> Parquet (train/val/test)
./scripts/run_preprocess.sh

# 2) Entrenar (modo local, 1 GPU/CPU, para validar que todo corre)
./scripts/run_training.sh

# 2b) Entrenar en el cluster de 3 nodos (Horovod + Ring-AllReduce)
./scripts/run_training.sh cluster

# 3) Levantar la API de inferencia
python -m src.api.app
```

Tras el paso 1, deberias tener:

```
data/processed/parquet/train/
data/processed/parquet/val/
data/processed/parquet/test/
```

Tras el paso 2, el modelo final queda en `models/saved_model/` y los
checkpoints intermedios en `models/checkpoints/`.
