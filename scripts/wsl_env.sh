# Se importa (source) desde otros scripts de WSL: activa el venv y arma
# LD_LIBRARY_PATH con las librerias CUDA/cuDNN instaladas via pip
# (nvidia-cudnn-cu11, nvidia-cublas-cu11, etc.), necesarias porque
# tensorflow[and-cuda] no las instala automaticamente en la version 2.13.0.
source .venv-wsl/bin/activate
NVIDIA_LIB_DIRS="$(find "$(python -c 'import site; print(site.getsitepackages()[0])')/nvidia" -maxdepth 2 -type d -name lib | paste -sd ':' -)"
export LD_LIBRARY_PATH="${NVIDIA_LIB_DIRS}${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"
