FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

COPY src/ src/
COPY models/tflite/ models/tflite/

ENV PYTHONPATH=/app
EXPOSE 5000

# Render (y servicios similares) inyectan $PORT en runtime; se usa 5000 como
# fallback para correr el contenedor localmente sin definir esa variable.
# 1 solo worker: cada worker de gunicorn carga su propia copia del modelo en
# memoria. Con tflite-runtime el costo por worker es de pocos MB (antes,
# con tensorflow completo, cada worker sumaba ~270MB solo por el import y
# 2+ workers superaban la RAM del plan free de Render de 512MB). Se deja en
# 1 de todas formas porque no hay evidencia de que el trafico actual lo
# necesite; --threads da concurrencia sin duplicar el modelo.
CMD gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 4 --timeout 120 src.api.app:app
