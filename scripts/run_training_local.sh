#!/usr/bin/env bash
# Entrenamiento LOCAL REAL (no sanity check): usa el dataset completo de
# data/raw/ (~20,600 imagenes) para acercarse a los resultados de la
# seccion 5 del documento (>95% accuracy, convergencia ~4 epocas).
#
# Corre igual en Windows nativo (CPU, via venv de .venv/Scripts) que dentro
# de WSL2/Linux (CPU o GPU si TensorFlow ve una GPU con soporte CUDA). El
# script detecta el entorno y solo aplica la configuracion de Spark/Windows
# (winutils, JAVA_HOME) cuando hace falta.
#
# Uso:
#   ./scripts/run_training_local.sh                # 10 epocas, batch 32 (default)
#   ./scripts/run_training_local.sh 15 64          # 15 epocas, batch 64
#   ./scripts/run_training_local.sh 10 32 --fine-tune

set -euo pipefail

EPOCHS="${1:-10}"
BATCH_SIZE="${2:-32}"
shift 2 2>/dev/null || shift $# || true
EXTRA_ARGS=("$@")

PARQUET_DIR="data/processed/parquet"
CHECKPOINTS_DIR="models/checkpoints"
SAVED_MODEL_DIR="models/saved_model"
EVAL_DIR="models/evaluation"

# --- Configuracion automatica de entorno (solo aplica si existe, no falla si no) ---
# IMPORTANTE: el proyecto vive en /mnt/c (compartido Windows/WSL), asi que
# ".venv/Scripts" (creado en Windows) es visible tambien desde WSL. Por eso
# se detecta primero si estamos corriendo bajo Linux (WSL) via `uname`, antes
# de mirar rutas de Windows, para no activar el venv equivocado.
if [ "$(uname -s 2>/dev/null)" = "Linux" ] && [ -f "scripts/wsl_env.sh" ] && [ -d ".venv-wsl" ]; then
    # WSL2 / Linux: activa el venv y arma LD_LIBRARY_PATH con las librerias
    # CUDA/cuDNN instaladas via pip (ver scripts/setup_wsl.sh). Spark no
    # necesita winutils ni JAVA_HOME especial en Linux.
    source scripts/wsl_env.sh
    export PYSPARK_PYTHON="$(pwd)/.venv-wsl/bin/python"
    export PYSPARK_DRIVER_PYTHON="$(pwd)/.venv-wsl/bin/python"
elif [ -d ".venv/Scripts" ]; then
    # Windows nativo (venv creado con python -m venv en cmd/PowerShell/Git Bash)
    export PATH="$(pwd)/.venv/Scripts:${PATH}"
    export PYSPARK_PYTHON="$(pwd)/.venv/Scripts/python.exe"
    export PYSPARK_DRIVER_PYTHON="$(pwd)/.venv/Scripts/python.exe"
    if [ -z "${JAVA_HOME:-}" ] && [ -d "/c/Program Files/Java/jre-1.8" ]; then
        export JAVA_HOME="C:\Program Files\Java\jre-1.8"
    fi
    if [ -z "${HADOOP_HOME:-}" ] && [ -f ".hadoop/bin/winutils.exe" ]; then
        export HADOOP_HOME="$(pwd)/.hadoop"
        export PATH="${HADOOP_HOME}/bin:${PATH}"
    fi
elif [ -d ".venv/bin" ]; then
    export PATH="$(pwd)/.venv/bin:${PATH}"
    export PYSPARK_PYTHON="$(pwd)/.venv/bin/python"
    export PYSPARK_DRIVER_PYTHON="$(pwd)/.venv/bin/python"
fi

if [ ! -d "data/raw" ] || [ -z "$(ls -A data/raw 2>/dev/null)" ]; then
    echo "[train-local] ERROR: data/raw/ esta vacio. Sigue DATASET_SETUP.md primero."
    exit 1
fi

echo "[train-local] Config: epochs=${EPOCHS} batch-size=${BATCH_SIZE} extra_args='${EXTRA_ARGS[*]:-}'"

if [ ! -f "${PARQUET_DIR}/train/_SUCCESS" ]; then
    echo ""
    echo "[train-local] ===== Paso 1/3: preprocesamiento COMPLETO con Spark (~20,600 imagenes) ====="
    echo "[train-local] Esto puede tardar varios minutos (denoising por imagen)."
    python -m src.data.spark_ingest --raw-dir "data/raw" --output-dir "${PARQUET_DIR}"
else
    echo "[train-local] Parquet ya existe en ${PARQUET_DIR}, se omite el preprocesamiento."
    echo "[train-local] (Borra esa carpeta si quieres regenerarlo desde cero.)"
fi

echo ""
echo "[train-local] ===== Paso 2/3: entrenamiento real (${EPOCHS} epocas, batch ${BATCH_SIZE}) ====="
mkdir -p "${CHECKPOINTS_DIR}" "${SAVED_MODEL_DIR}" "${EVAL_DIR}"
if command -v horovodrun >/dev/null 2>&1; then
    horovodrun -np 1 python -m src.training.train \
        --parquet-dir "${PARQUET_DIR}" \
        --checkpoints-dir "${CHECKPOINTS_DIR}" \
        --saved-model-dir "${SAVED_MODEL_DIR}" \
        --epochs "${EPOCHS}" \
        --batch-size "${BATCH_SIZE}" \
        ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}
else
    echo "[train-local] AVISO: horovodrun no disponible; corriendo train.py en un solo proceso"
    echo "[train-local] (shim automatico en src/training/train.py, ver PROJECT_STATUS.md)."
    python -m src.training.train \
        --parquet-dir "${PARQUET_DIR}" \
        --checkpoints-dir "${CHECKPOINTS_DIR}" \
        --saved-model-dir "${SAVED_MODEL_DIR}" \
        --epochs "${EPOCHS}" \
        --batch-size "${BATCH_SIZE}" \
        ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}
fi

echo ""
echo "[train-local] ===== Paso 3/3: evaluacion sobre el split de prueba real ====="
python -m src.evaluation.evaluate \
    --parquet-dir "${PARQUET_DIR}" \
    --model-dir "${SAVED_MODEL_DIR}" \
    --checkpoints-dir "${CHECKPOINTS_DIR}" \
    --output-dir "${EVAL_DIR}"

echo ""
echo "[train-local] OK: entrenamiento y evaluacion reales completados."
echo "[train-local] Graficas actualizadas (sobrescritas) en ${EVAL_DIR}/"
