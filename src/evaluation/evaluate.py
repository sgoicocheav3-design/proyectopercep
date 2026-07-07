"""Evaluacion del modelo entrenado sobre el split de prueba (test) y
generacion de las visualizaciones descritas en la seccion 5 del documento:

    - Curvas de aprendizaje por epoca (Accuracy, Loss, Precision, Recall).
    - Matriz de confusion para las 15 clases.
    - Grid 3x3 de "Detecciones Correctas" y "Detecciones Fallidas", con una
      franja oscura sobre cada imagen indicando Pred/Real.

Uso:
    python -m src.evaluation.evaluate
    python -m src.evaluation.evaluate --parquet-dir data/_local_test/parquet \
        --model-dir models/_local_test/saved_model \
        --checkpoints-dir models/_local_test/checkpoints \
        --output-dir models/_local_test/evaluation
"""

import argparse
import os

import matplotlib

matplotlib.use("Agg")  # sin display: guarda directamente a archivo
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import accuracy_score, confusion_matrix

from src.common import config
from src.data.dataset import load_split_arrays

GRID_ROWS = 3
GRID_COLS = 3
GRID_SIZE = GRID_ROWS * GRID_COLS


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluacion del modelo sobre el split de prueba")
    parser.add_argument("--parquet-dir", type=str, default=config.PARQUET_DIR)
    parser.add_argument("--model-dir", type=str, default=config.SAVED_MODEL_DIR)
    parser.add_argument("--checkpoints-dir", type=str, default=config.CHECKPOINTS_DIR)
    parser.add_argument("--output-dir", type=str, default=config.EVALUATION_DIR)
    return parser.parse_args()


def plot_learning_curves(training_log_csv: str, output_dir: str) -> None:
    """Grafica Accuracy, Loss, Precision y Recall (train vs val) por epoca,
    leyendo el CSV generado por `tf.keras.callbacks.CSVLogger` en train.py."""
    if not os.path.exists(training_log_csv):
        print(f"[evaluate] AVISO: no se encontro {training_log_csv}; se omiten las curvas de aprendizaje.")
        return

    log_df = pd.read_csv(training_log_csv)

    metrics = [
        ("accuracy", "val_accuracy", "Model Accuracy", "Accuracy"),
        ("loss", "val_loss", "Model Loss", "Loss"),
        ("precision", "val_precision", "Model Precision", "Precision"),
        ("recall", "val_recall", "Model Recall", "Recall"),
    ]

    fig, axes = plt.subplots(2, 2, figsize=(12, 9))
    for ax, (train_col, val_col, title, ylabel) in zip(axes.flat, metrics):
        if train_col in log_df.columns:
            ax.plot(log_df["epoch"], log_df[train_col], marker="o", label=f"Train {ylabel}")
        if val_col in log_df.columns:
            ax.plot(log_df["epoch"], log_df[val_col], marker="o", label=f"Val {ylabel}")
        ax.set_title(title)
        ax.set_xlabel("Epoca")
        ax.set_ylabel(ylabel)
        ax.legend()
        ax.grid(alpha=0.3)

    fig.tight_layout()
    save_path = os.path.join(output_dir, "learning_curves.png")
    fig.savefig(save_path, dpi=150)
    plt.close(fig)
    print(f"[evaluate] Curvas de aprendizaje guardadas en {save_path}")


def plot_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, class_names: list, output_path: str) -> None:
    """Genera y guarda la matriz de confusion para las 15 clases."""
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names))))

    fig, ax = plt.subplots(figsize=(11, 10))
    im = ax.imshow(cm, cmap="Blues")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=90, fontsize=7)
    ax.set_yticklabels(class_names, fontsize=7)
    ax.set_xlabel("Prediccion")
    ax.set_ylabel("Clase real")
    ax.set_title("Matriz de Confusion - 15 clases")

    thresh = cm.max() / 2.0 if cm.max() > 0 else 0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            if cm[i, j] > 0:
                ax.text(
                    j, i, str(cm[i, j]),
                    ha="center", va="center", fontsize=6,
                    color="white" if cm[i, j] > thresh else "black",
                )

    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)
    print(f"[evaluate] Matriz de confusion guardada en {output_path}")


def _add_prediction_strip(ax, image: np.ndarray, pred_name: str, true_name: str) -> None:
    """Dibuja la franja oscura con texto blanco 'Pred:'/'Real:' sobre la imagen,
    tal como se describe en las visualizaciones de detecciones del documento."""
    height, width = image.shape[0], image.shape[1]
    strip_height = height * 0.24

    ax.imshow(image)
    rect = plt.Rectangle((0, height - strip_height), width, strip_height, color="black", alpha=0.65)
    ax.add_patch(rect)
    ax.text(
        width / 2, height - strip_height / 2,
        f"Pred: {pred_name}\nReal: {true_name}",
        color="white", fontsize=6.5, ha="center", va="center",
    )
    ax.axis("off")


def save_detection_grid(
    images: np.ndarray,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: list,
    indices: np.ndarray,
    save_path: str,
    title: str,
    total_count: int,
    overall_accuracy: float,
) -> None:
    """Genera un grid 3x3 de ejemplos (correctos o fallidos) con la franja
    Pred/Real sobre cada imagen, replicando las visualizaciones de la seccion 5."""
    fig, axes = plt.subplots(GRID_ROWS, GRID_COLS, figsize=(12, 12))

    for i, ax in enumerate(axes.flat):
        if i < len(indices):
            idx = indices[i]
            pred_name = class_names[y_pred[idx]]
            true_name = class_names[y_true[idx]]
            _add_prediction_strip(ax, images[idx], pred_name, true_name)
        else:
            ax.axis("off")

    fig.suptitle(
        f"{title}\nTotal de ejemplos en esta categoria: {total_count}   |   "
        f"Precision General del Modelo: {overall_accuracy * 100:.2f}%",
        fontsize=12,
    )
    fig.tight_layout(rect=[0, 0, 1, 0.94])
    fig.savefig(save_path, dpi=150)
    plt.close(fig)
    print(f"[evaluate] Grid guardado en {save_path}")


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    print(f"[evaluate] Cargando modelo desde {args.model_dir}...")
    model = tf.keras.models.load_model(args.model_dir)

    print(f"[evaluate] Cargando split 'test' desde {args.parquet_dir}...")
    images, labels = load_split_arrays("test", args.parquet_dir)

    normalized_images = images.astype(np.float32) / 255.0
    probabilities = model.predict(normalized_images, batch_size=32, verbose=0)
    predictions = np.argmax(probabilities, axis=1)

    overall_accuracy = accuracy_score(labels, predictions)
    print(f"[evaluate] Precision general en test: {overall_accuracy * 100:.2f}% ({len(labels)} ejemplos)")

    plot_confusion_matrix(labels, predictions, config.CLASS_NAMES, os.path.join(args.output_dir, "confusion_matrix.png"))
    plot_learning_curves(os.path.join(args.checkpoints_dir, "training_log.csv"), args.output_dir)

    rng = np.random.default_rng(config.RANDOM_SEED)

    correct_indices = np.where(predictions == labels)[0]
    incorrect_indices = np.where(predictions != labels)[0]

    correct_sample = rng.choice(correct_indices, size=min(GRID_SIZE, len(correct_indices)), replace=False)
    incorrect_sample = rng.choice(incorrect_indices, size=min(GRID_SIZE, len(incorrect_indices)), replace=False)

    if len(correct_sample) > 0:
        save_detection_grid(
            images, labels, predictions, config.CLASS_NAMES, correct_sample,
            os.path.join(args.output_dir, "correct_detections.png"),
            "Detecciones Correctas", len(correct_indices), overall_accuracy,
        )
    else:
        print("[evaluate] AVISO: no hay detecciones correctas para graficar.")

    if len(incorrect_sample) > 0:
        save_detection_grid(
            images, labels, predictions, config.CLASS_NAMES, incorrect_sample,
            os.path.join(args.output_dir, "failed_detections.png"),
            "Detecciones Fallidas", len(incorrect_indices), overall_accuracy,
        )
    else:
        print("[evaluate] AVISO: no hay detecciones fallidas para graficar (0 errores en test).")


if __name__ == "__main__":
    main()
