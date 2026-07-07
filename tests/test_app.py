"""Pruebas unitarias de las rutas Flask (src/api/app.py).

predict() se mockea para no depender del modelo real: eso se cubre aparte
en tests/test_inference.py.
"""

import io
from unittest.mock import patch

import pytest

from src.api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_predict_sin_archivo(client):
    response = client.post("/predict", data={}, content_type="multipart/form-data")

    assert response.status_code == 400
    assert "file" in response.get_json()["error"].lower()


def test_predict_archivo_vacio(client):
    data = {"file": (io.BytesIO(b""), "")}

    response = client.post("/predict", data=data, content_type="multipart/form-data")

    assert response.status_code == 400


def test_cors_header_para_origen_permitido(client):
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})

    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


@patch("src.api.app.predict")
def test_predict_exitoso(mock_predict, client):
    mock_predict.return_value = {
        "predicted_class": "Tomato_healthy",
        "confidence": 0.97,
        "all_probabilities": {"Tomato_healthy": 0.97},
    }
    data = {"file": (io.BytesIO(b"fake-image-bytes"), "hoja.jpg")}

    response = client.post("/predict", data=data, content_type="multipart/form-data")

    assert response.status_code == 200
    body = response.get_json()
    assert body["predicted_class"] == "Tomato_healthy"
    mock_predict.assert_called_once()
