#!/usr/bin/env bash
# Bootstrap del entorno DENTRO de WSL2 (Ubuntu), una sola vez.
# Instala: JDK (para Spark), toolchain de compilacion (para Horovod), un venv
# con TensorFlow + las librerias CUDA/cuDNN via pip (sin instalar el CUDA
# Toolkit del sistema), y Horovod compilado con MPI real.
#
# Requisito previo: WSL2 + Ubuntu instalados y el driver NVIDIA de Windows
# actualizado (WSL2 pasa la GPU automaticamente, no se instala driver
# dentro de WSL).
#
# Uso (desde la carpeta del proyecto DENTRO de WSL, ej. /mnt/c/Users/.../ProyectoPercep):
#   bash scripts/setup_wsl.sh

set -euo pipefail

echo "[setup-wsl] Instalando dependencias del sistema (requiere sudo, pide contrasena)..."
sudo apt-get update
sudo apt-get install -y \
    python3-venv python3-pip \
    openjdk-11-jdk-headless \
    build-essential cmake \
    openmpi-bin libopenmpi-dev

echo "[setup-wsl] Creando entorno virtual .venv-wsl (separado del .venv de Windows)..."
python3 -m venv .venv-wsl
source .venv-wsl/bin/activate
pip install --upgrade pip

echo "[setup-wsl] Instalando requirements.txt (sin tensorflow ni horovod, se instalan aparte)..."
grep -vE "^tensorflow|^horovod" requirements.txt > /tmp/requirements_base.txt
pip install -r /tmp/requirements_base.txt

echo "[setup-wsl] Instalando TensorFlow 2.13.0..."
pip install tensorflow==2.13.0

# El extra "tensorflow[and-cuda]" no trae las librerias NVIDIA para la
# version 2.13.0 (se verifico que no instala nada); se instalan manualmente
# las versiones que TF 2.13 espera.
echo "[setup-wsl] Instalando librerias CUDA/cuDNN via pip (versiones pineadas para TF 2.13)..."
pip install \
    nvidia-cublas-cu11==11.11.3.6 \
    nvidia-cuda-cupti-cu11==11.8.87 \
    nvidia-cuda-nvcc-cu11==11.8.89 \
    nvidia-cuda-runtime-cu11==11.8.89 \
    nvidia-cudnn-cu11==8.6.0.163 \
    nvidia-cufft-cu11==10.9.0.58 \
    nvidia-curand-cu11==10.3.0.86 \
    nvidia-cusolver-cu11==11.4.1.48 \
    nvidia-cusparse-cu11==11.7.5.86 \
    nvidia-nccl-cu11==2.16.5

echo "[setup-wsl] Verificando que TensorFlow ve la GPU (usa scripts/wsl_env.sh para el LD_LIBRARY_PATH)..."
deactivate
source scripts/wsl_env.sh
python -c "import tensorflow as tf; print('GPUs:', tf.config.list_physical_devices('GPU'))"

echo "[setup-wsl] Instalando Horovod (compilacion real con MPI, puede tardar varios minutos)..."
HOROVOD_WITH_TENSORFLOW=1 pip install horovod==0.28.1

echo "[setup-wsl] Verificando horovodrun..."
horovodrun --check-build

echo ""
echo "[setup-wsl] Listo. A partir de ahora, dentro de WSL, en la carpeta del proyecto:"
echo "    source scripts/wsl_env.sh"
echo "y corre el entrenamiento real con:"
echo "    ./scripts/run_training_local.sh 10 32"
