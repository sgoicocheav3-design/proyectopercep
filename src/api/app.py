"""API REST Flask para diagnostico de enfermedades en plantas.

Endpoints:
    GET  /health   -> chequeo de disponibilidad
    POST /predict  -> recibe una imagen (multipart/form-data, campo "file")
                      y devuelve la clase predicha entre las 15 enfermedades.
"""

import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from src.api.inference import predict

# Origenes permitidos para las peticiones CORS del frontend (Vite corre en
# 5173 por defecto). Configurable via env var para otros entornos/puertos.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=ALLOWED_ORIGINS)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.post("/predict")
    def predict_endpoint():
        if "file" not in request.files:
            return jsonify({"error": "Falta el campo 'file' con la imagen."}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "Archivo vacio."}), 400

        image_bytes = file.read()
        result = predict(image_bytes)
        
        if "error" in result:
            return jsonify(result), 400
            
        return jsonify(result)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
