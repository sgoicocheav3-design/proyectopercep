#!/usr/bin/env bash
# Lanza el entrenamiento distribuido con Horovod (Ring-AllReduce) sobre el
# cluster de 3 nodos descrito en la seccion 4.3 del documento.
#
# Uso local (1 GPU/CPU, para probar que el pipeline corre sin errores):
#   ./scripts/run_training.sh
#
# Uso en el cluster de 3 nodos (1 + 2 GPUs, IPs del documento):
#   ./scripts/run_training.sh cluster

set -euo pipefail

MODE="${1:-local}"

if [ "${MODE}" = "cluster" ]; then
    horovodrun -np 3 \
        -H 192.168.0.111:1,192.168.0.109:1,192.168.0.110:1 \
        python -m src.training.train
else
    horovodrun -np 1 python -m src.training.train
fi
