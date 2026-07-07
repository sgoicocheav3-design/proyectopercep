"""Pruebas unitarias de src/api/inference.py.

test_predict_con_modelo_real carga el modelo entrenado que se versiona en
models/saved_model/ (el mismo artefacto que se copia al contenedor de
deploy) para confirmar que carga y predice sin errores.
"""

import io

import numpy as np
from PIL import Image

from src.api.inference import predict, preprocess_image
from src.common import config


def _fake_image_bytes(width=64, height=64, color=(120, 200, 50)):
    image = Image.new("RGB", (width, height), color)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_preprocess_image_forma_y_rango():
    batch = preprocess_image(_fake_image_bytes())

    assert batch.shape == (1, config.IMG_HEIGHT, config.IMG_WIDTH, config.IMG_CHANNELS)
    assert batch.dtype == np.float32
    assert batch.min() >= 0.0
    assert batch.max() <= 1.0


def test_predict_con_modelo_real():
    result = predict(_fake_image_bytes())

    assert result["predicted_class"] in config.CLASS_NAMES
    assert 0.0 <= result["confidence"] <= 1.0
    assert set(result["all_probabilities"]) == set(config.CLASS_NAMES)
    assert np.isclose(sum(result["all_probabilities"].values()), 1.0, atol=1e-3)
