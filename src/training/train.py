"""Entrenamiento distribuido con Horovod (Ring-AllReduce) sobre el
cluster de 3 nodos descrito en la seccion 4.3 del documento:
    - Nodo maestro: 192.168.0.111 (1 GPU)
    - Workers:      192.168.0.109, 192.168.0.110 (2 GPUs)

Cada proceso Horovod es una GPU. Se ejecuta con horovodrun, por ejemplo:

    horovodrun -np 3 -H 192.168.0.111:1,192.168.0.109:1,192.168.0.110:1 \
        python -m src.training.train

Para pruebas en una sola maquina (1 GPU o CPU):

    horovodrun -np 1 python -m src.training.train
"""

import argparse
import os

import tensorflow as tf

from src.common import config
from src.data.dataset import get_dataset, steps_per_epoch
from src.model.architecture import build_model, compile_model

try:
    import horovod.tensorflow.keras as hvd
except ImportError:
    # Horovod requiere MPI + un compilador C++ (CMake) para instalarse, algo
    # que no esta disponible de forma nativa en Windows. Este shim deja correr
    # el mismo script en un solo proceso (equivalente a `horovodrun -np 1`)
    # para validar el pipeline localmente; el entrenamiento distribuido real
    # sobre el cluster de 3 nodos requiere Horovod instalado (Linux).
    class _NoOpCallback(tf.keras.callbacks.Callback):
        pass

    class _HorovodShim:
        @staticmethod
        def init():
            pass

        @staticmethod
        def size():
            return 1

        @staticmethod
        def rank():
            return 0

        @staticmethod
        def local_rank():
            return 0

        @staticmethod
        def DistributedOptimizer(optimizer):
            return optimizer

        class callbacks:
            @staticmethod
            def BroadcastGlobalVariablesCallback(root_rank):
                return _NoOpCallback()

            @staticmethod
            def MetricAverageCallback():
                return _NoOpCallback()

            @staticmethod
            def LearningRateWarmupCallback(**kwargs):
                return _NoOpCallback()

    hvd = _HorovodShim()
    print("[train] AVISO: Horovod no esta instalado; corriendo en modo single-process (sanity check).")


def parse_args():
    parser = argparse.ArgumentParser(description="Entrenamiento distribuido MobileNetV2")
    parser.add_argument("--epochs", type=int, default=config.EPOCHS)
    parser.add_argument("--batch-size", type=int, default=config.BATCH_SIZE_PER_REPLICA)
    parser.add_argument("--parquet-dir", type=str, default=config.PARQUET_DIR)
    parser.add_argument("--checkpoints-dir", type=str, default=config.CHECKPOINTS_DIR)
    parser.add_argument("--saved-model-dir", type=str, default=config.SAVED_MODEL_DIR)
    parser.add_argument("--fine-tune", action="store_true", help="Descongela MobileNetV2 (fase 2)")
    return parser.parse_args()


def setup_horovod_gpu():
    """Inicializa Horovod y fija cada proceso a una unica GPU visible."""
    hvd.init()

    gpus = tf.config.experimental.list_physical_devices("GPU")
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
    if gpus:
        tf.config.experimental.set_visible_devices(gpus[hvd.local_rank()], "GPU")


def main():
    args = parse_args()
    setup_horovod_gpu()

    is_root = hvd.rank() == 0

    if is_root:
        os.makedirs(args.checkpoints_dir, exist_ok=True)
        os.makedirs(args.saved_model_dir, exist_ok=True)
        print(f"[train] Horovod size={hvd.size()} rank={hvd.rank()} local_rank={hvd.local_rank()}")

    # --- Datos: cada worker recibe un shard distinto del dataset ---
    train_ds = get_dataset(
        "train",
        batch_size=args.batch_size,
        shard_index=hvd.rank(),
        num_shards=hvd.size(),
        parquet_dir=args.parquet_dir,
    )
    val_ds = get_dataset(
        "val",
        batch_size=args.batch_size,
        shuffle=False,
        parquet_dir=args.parquet_dir,
    )

    train_steps = steps_per_epoch(
        "train", batch_size=args.batch_size, num_shards=hvd.size(), parquet_dir=args.parquet_dir
    )

    # --- Modelo ---
    model = build_model(freeze_base=not args.fine_tune)

    # La tasa de aprendizaje se escala por el numero de workers (Ring-AllReduce
    # promedia gradientes de `hvd.size()` replicas, batch efectivo = batch * size).
    base_optimizer = tf.keras.optimizers.Adam(learning_rate=config.LEARNING_RATE * hvd.size())
    optimizer = hvd.DistributedOptimizer(base_optimizer)

    compile_model(model, optimizer=optimizer)

    callbacks = [
        # Sincroniza el estado inicial de variables desde el rank 0 a todos los workers.
        hvd.callbacks.BroadcastGlobalVariablesCallback(0),
        # Promedia metricas entre workers al final de cada epoca para logging consistente.
        hvd.callbacks.MetricAverageCallback(),
        # Warmup de LR en las primeras epocas para estabilizar el entrenamiento distribuido.
        hvd.callbacks.LearningRateWarmupCallback(initial_lr=config.LEARNING_RATE * hvd.size(), warmup_epochs=1, verbose=1 if is_root else 0),
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True),
    ]

    # Checkpoints y logs solo desde el proceso principal, para no pisar archivos
    # entre workers ni desperdiciar I/O en HDFS.
    if is_root:
        callbacks.append(
            tf.keras.callbacks.ModelCheckpoint(
                filepath=os.path.join(args.checkpoints_dir, "epoch_{epoch:02d}_valacc_{val_accuracy:.4f}.h5"),
                monitor="val_accuracy",
                save_best_only=True,
            )
        )
        callbacks.append(tf.keras.callbacks.CSVLogger(os.path.join(args.checkpoints_dir, "training_log.csv")))

    history = model.fit(
        train_ds,
        steps_per_epoch=train_steps,
        validation_data=val_ds if is_root else None,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=1 if is_root else 0,
    )

    if is_root:
        model.save(args.saved_model_dir)
        print(f"[train] Modelo final guardado en {args.saved_model_dir}")
        best_val_acc = max(history.history.get("val_accuracy", [0]))
        print(f"[train] Mejor val_accuracy: {best_val_acc:.4f}")


if __name__ == "__main__":
    main()
