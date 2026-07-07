# Estado actual del proyecto

Resumen simple de lo que ya existe en este repo y cómo encaja con el
documento (`proyectopercep.md.txt`).

## Qué cubre el código ahora mismo

Cubre las secciones **3 (adquisición y preprocesamiento)**, **4 (metodología:
modelo avanzado y entrenamiento distribuido)** y el código necesario para
producir la **sección 5 (resultados)**: evaluación, matriz de confusión,
curvas de aprendizaje y grids de detecciones correctas/fallidas.

El pipeline completo (ingesta Spark → entrenamiento → evaluación) **ya se
corrió de punta a punta en esta máquina** como sanity check con un
subconjunto pequeño de imágenes reales (`scripts/run_local_test.sh`), y
funciona sin errores. Ver la sección "Sanity check verificado" abajo.

## Dataset

- `data/raw/` contiene las 15 clases de PlantVillage (Tomate 10, Papa 3,
  Pimiento 2), ~20,600 imágenes en total. Verificado y sin duplicados.
- `src/common/config.py` centraliza los 15 nombres de clase, tamaño de
  imagen (256x256) e hiperparámetros.

## Pipeline de datos (Spark → Parquet)

- `src/data/spark_ingest.py`: lee las imágenes crudas, aplica filtrado de
  ruido + resize 256x256, y separa train/val/test (80/10/10) de forma
  estratificada por clase.
- `src/data/dataset.py`: lee ese Parquet y arma un `tf.data.Dataset` listo
  para entrenar.

**Verificado corriendo de verdad** (no solo compilación) sobre un
subconjunto de 150 imágenes reales.

## Modelo

- `src/model/architecture.py`: MobileNetV2 preentrenada (ImageNet) +
  GlobalAveragePooling2D → Dropout(0.5) → Dense(512) → BatchNorm →
  Dropout(0.3) → Dense(15, Softmax).

## Entrenamiento distribuido

- `src/training/train.py`: entrenamiento con Horovod (Ring-AllReduce) para
  el cluster real de 3 nodos. En Windows (sin MPI/CMake, donde Horovod no
  se puede instalar) cae automáticamente a un modo single-process mediante
  un shim interno, para poder validar el pipeline localmente sin cambiar el
  codigo del entrenamiento distribuido real.

## Evaluación (sección 5)

- `src/evaluation/evaluate.py`: genera `confusion_matrix.png`,
  `learning_curves.png`, `correct_detections.png` y `failed_detections.png`
  a partir del modelo entrenado y el split de test.

## Sanity check verificado (`scripts/run_local_test.sh`)

Se corrió el pipeline completo en esta máquina (Windows, Python 3.11, CPU)
con 10 imágenes por clase (150 imágenes reales de `data/raw/`). Resultado:
ingesta Spark real → 1 época de entrenamiento real → evaluación real sobre
15 imágenes de test, con **26.67% de accuracy** (esperable: 1 época, ~120
imágenes de entrenamiento, 15 clases). El script ahora se auto-configura
(Java, Hadoop, Python del venv) y corre con un solo comando:

```
./scripts/run_local_test.sh
```

### Bugs reales encontrados y corregidos durante esta prueba

1. **`config.py`**: 3 nombres de clase mal escritos (guion simple en vez de
   doble) que habrían hecho que Spark descartara ~5,000 imágenes en
   silencio en la corrida real a escala completa.
2. **`spark_ingest.py` — `recursiveFileLookup`**: faltaba esta opción, por
   lo que Spark nunca bajaba a las subcarpetas de clase y el Parquet
   quedaba siempre vacío (0 filas). Bug que habría afectado también la
   corrida completa, no solo la de prueba.
3. **`spark_ingest.py` — sintaxis de `pathGlobFilter`**: usaba una lista
   separada por `;` (`*.jpg;*.JPG;...`), que Hadoop no soporta; la sintaxis
   correcta es con llaves (`*.{jpg,JPG,jpeg,JPEG,png,PNG}`).
4. **`run_local_test.sh`**: el patrón `find | head` con `pipefail` activo
   abortaba el script por `SIGPIPE` (exit 141); se reemplazó por un array.
5. **`evaluate.py` — curvas de aprendizaje**: con una sola época no se veía
   ningún punto en el gráfico (línea sin marcador); se agregó `marker="o"`.

### Limitaciones específicas de Windows (documentadas, no bugs de código)

- **Horovod no se puede instalar nativamente en Windows** (requiere MPI +
  CMake/compilador C++). El entrenamiento distribuido real solo puede
  correr en el cluster Linux de 3 nodos; en Windows se usa el fallback
  single-process mencionado arriba.
- **PySpark 3.3.4 (la versión que pide el documento) es incompatible con
  Python 3.11** — falla al serializar funciones con cloudpickle. Se usó
  `pyspark==3.5.1` en esta máquina (único Python disponible es 3.11); el
  cluster real con Python 3.9 puede seguir usando 3.3.4 tal cual dice el
  documento.
- **Spark en Windows necesita `winutils.exe`/`hadoop.dll`** (Hadoop no
  distribuye binarios oficiales para Windows). Se descargaron desde
  `cdarlint/winutils` (mirror comunitario estándar) a `.hadoop/` con
  aprobación explícita del usuario, ya que implica ejecutar un binario de
  terceros.

## Qué falta para el entrenamiento real completo

1. Correr `./scripts/run_preprocess.sh` sobre las ~20,600 imágenes
   completas (no solo la muestra de 150 del sanity check).
2. Correr el entrenamiento real en el cluster de 3 nodos con Horovod
   (`./scripts/run_training.sh cluster`), o localmente con más épocas si
   no se dispone del cluster.
3. Correr `python -m src.evaluation.evaluate` sobre ese modelo real para
   obtener las métricas y gráficas finales de la sección 5 (el documento
   reporta ~95% de accuracy en 4 épocas con el dataset completo; el 26.67%
   de esta prueba es solo del sanity check con 1 época y un subconjunto
   mínimo).

## Cómo verificar

```
python -m py_compile src/common/config.py src/data/spark_ingest.py \
    src/data/dataset.py src/model/architecture.py src/training/train.py \
    src/evaluation/evaluate.py src/api/inference.py src/api/app.py \
    scripts/download_plantvillage.py

./scripts/run_local_test.sh
```

Ambos verificados en esta máquina: compilación limpia y ejecución real de
punta a punta sin errores.
