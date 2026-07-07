#!/usr/bin/env bash
# Lanza la ingesta/preprocesamiento distribuido en Spark (seccion 3.3).
# Ejecutar desde la raiz del proyecto.
#
# Uso local (pruebas):        ./scripts/run_preprocess.sh
# Uso en cluster YARN/HDFS:   ./scripts/run_preprocess.sh yarn

set -euo pipefail

MASTER="${1:-local[*]}"

spark-submit \
    --master "${MASTER}" \
    --conf spark.executor.memory=6g \
    --conf spark.driver.memory=4g \
    src/data/spark_ingest.py
