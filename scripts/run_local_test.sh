#!/usr/bin/env bash
# Sanity check end-to-end: ingesta -> entrenamiento -> evaluacion, usando un
# subconjunto minimo de imagenes, Spark en modo local y Horovod con 1 sola
# GPU/CPU y 1 epoca. El objetivo NO es obtener un modelo bueno, sino
# verificar que el codigo completo corre sin errores antes de gastar tiempo
# y recursos en el cluster real de 3 nodos.
#
# Requisito: haber corrido antes scripts/download_plantvillage.py (o el paso
# manual de DATASET_SETUP.md), de forma que data/raw/<clase>/ ya tenga imagenes.
#
# Uso:
#   ./scripts/run_local_test.sh            # 10 imagenes por clase (default)
#   ./scripts/run_local_test.sh 20         # 20 imagenes por clase

set -euo pipefail

# Configuracion automatica para Windows: Spark necesita JAVA_HOME y, para
# escribir Parquet en el filesystem local, HADOOP_HOME apuntando a una
# carpeta con winutils.exe/hadoop.dll (ver DATASET_SETUP.md). Tambien se fija
# PYSPARK_PYTHON al interprete del venv para que los workers de Spark usen
# el mismo Python que tiene pyspark/tensorflow instalados.
if [ -d ".venv/Scripts" ]; then
    export PATH="$(pwd)/.venv/Scripts:${PATH}"
    export PYSPARK_PYTHON="$(pwd)/.venv/Scripts/python.exe"
    export PYSPARK_DRIVER_PYTHON="$(pwd)/.venv/Scripts/python.exe"
fi
if [ -z "${JAVA_HOME:-}" ] && [ -d "/c/Program Files/Java/jre-1.8" ]; then
    export JAVA_HOME="C:\Program Files\Java\jre-1.8"
fi
if [ -z "${HADOOP_HOME:-}" ] && [ -f ".hadoop/bin/winutils.exe" ]; then
    export HADOOP_HOME="$(pwd)/.hadoop"
    export PATH="${HADOOP_HOME}/bin:${PATH}"
fi

N_PER_CLASS="${1:-10}"

RAW_DIR="data/_local_test/raw"
PARQUET_DIR="data/_local_test/parquet"
SAVED_MODEL_DIR="models/_local_test/saved_model"
CHECKPOINTS_DIR="models/_local_test/checkpoints"
EVAL_DIR="models/_local_test/evaluation"

if [ ! -d "data/raw" ] || [ -z "$(ls -A data/raw 2>/dev/null)" ]; then
    echo "[local-test] ERROR: data/raw/ esta vacio. Sigue DATASET_SETUP.md antes de correr esta prueba."
    exit 1
fi

echo "[local-test] Limpiando corridas de prueba previas..."
rm -rf "${RAW_DIR}" "${PARQUET_DIR}" "${SAVED_MODEL_DIR}" "${CHECKPOINTS_DIR}" "${EVAL_DIR}"
mkdir -p "${RAW_DIR}" "${CHECKPOINTS_DIR}" "${SAVED_MODEL_DIR}" "${EVAL_DIR}"

echo "[local-test] Copiando ${N_PER_CLASS} imagenes por clase desde data/raw/ ..."
for class_dir in data/raw/*/; do
    class_name="$(basename "${class_dir}")"
    mkdir -p "${RAW_DIR}/${class_name}"
    # Se evita el patron `find | head` porque con `pipefail` activo, `head`
    # cierra la tuberia antes de tiempo y `find` recibe SIGPIPE (exit 141),
    # abortando el script por `set -e`. Se listan los archivos a un array primero.
    mapfile -t class_images < <(
        find "${class_dir}" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | sort
    )
    copied=0
    for img in "${class_images[@]}"; do
        [ "${copied}" -ge "${N_PER_CLASS}" ] && break
        cp "${img}" "${RAW_DIR}/${class_name}/"
        copied=$((copied + 1))
    done
done

echo ""
echo "[local-test] ===== Paso 1/3: preprocesamiento con Spark (modo local) ====="
python -m src.data.spark_ingest --raw-dir "${RAW_DIR}" --output-dir "${PARQUET_DIR}"

echo ""
echo "[local-test] ===== Paso 2/3: entrenamiento (1 epoca, batch minimo) ====="
if command -v horovodrun >/dev/null 2>&1; then
    horovodrun -np 1 python -m src.training.train \
        --parquet-dir "${PARQUET_DIR}" \
        --checkpoints-dir "${CHECKPOINTS_DIR}" \
        --saved-model-dir "${SAVED_MODEL_DIR}" \
        --epochs 1 \
        --batch-size 2
else
    echo "[local-test] AVISO: horovodrun no disponible (comun en Windows nativo, sin MPI)."
    echo "[local-test] Se corre train.py directamente en un solo proceso (ver shim en src/training/train.py)."
    python -m src.training.train \
        --parquet-dir "${PARQUET_DIR}" \
        --checkpoints-dir "${CHECKPOINTS_DIR}" \
        --saved-model-dir "${SAVED_MODEL_DIR}" \
        --epochs 1 \
        --batch-size 2
fi

echo ""
echo "[local-test] ===== Paso 3/3: evaluacion sobre el split de prueba ====="
python -m src.evaluation.evaluate \
    --parquet-dir "${PARQUET_DIR}" \
    --model-dir "${SAVED_MODEL_DIR}" \
    --checkpoints-dir "${CHECKPOINTS_DIR}" \
    --output-dir "${EVAL_DIR}"

echo ""
echo "[local-test] OK: el pipeline completo corrio sin errores."
echo "[local-test] Revisa las graficas generadas en ${EVAL_DIR}/"
