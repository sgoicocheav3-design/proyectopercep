"""Descarga el dataset PlantVillage desde Kaggle y organiza en data/raw/
solo las 15 clases usadas por el proyecto (Tomate, Papa, Pimiento).

Requisitos previos:
    pip install kaggle
    Credenciales de Kaggle en ~/.kaggle/kaggle.json (ver DATASET_SETUP.md)

Uso:
    python scripts/download_plantvillage.py
"""

import os
import shutil
import sys
import zipfile

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.common import config

KAGGLE_DATASET = "emmarex/plantdisease"
DOWNLOAD_DIR = os.path.join(config.DATA_DIR, "_kaggle_download")


def download_dataset():
    from kaggle.api.kaggle_api_extended import KaggleApi

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    api = KaggleApi()
    api.authenticate()
    print(f"[download] Descargando dataset '{KAGGLE_DATASET}' desde Kaggle...")
    api.dataset_download_files(KAGGLE_DATASET, path=DOWNLOAD_DIR, unzip=False)

    zip_path = os.path.join(DOWNLOAD_DIR, "plantdisease.zip")
    print(f"[download] Descomprimiendo {zip_path}...")
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(DOWNLOAD_DIR)


def find_class_dir(root: str, class_name: str):
    """El zip de Kaggle anida las imagenes bajo carpetas como PlantVillage/<clase>.
    Buscamos recursivamente la carpeta que coincide con cada clase."""
    for dirpath, dirnames, _ in os.walk(root):
        if class_name in dirnames:
            return os.path.join(dirpath, class_name)
    return None


def organize_classes():
    os.makedirs(config.RAW_DATA_DIR, exist_ok=True)

    for class_name in config.CLASS_NAMES:
        source_dir = find_class_dir(DOWNLOAD_DIR, class_name)
        dest_dir = os.path.join(config.RAW_DATA_DIR, class_name)

        if source_dir is None:
            print(f"[WARN] No se encontro la clase '{class_name}' en el dataset descargado.")
            continue

        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        shutil.copytree(source_dir, dest_dir)
        num_images = len(os.listdir(dest_dir))
        print(f"[download] {class_name}: {num_images} imagenes copiadas a data/raw/")


def main():
    download_dataset()
    organize_classes()
    print("[download] Listo. Las 15 clases quedaron organizadas en data/raw/<clase>/")


if __name__ == "__main__":
    main()
