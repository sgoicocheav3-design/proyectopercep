// Cliente de la API REST Flask (ver src/api/app.py en la raiz del proyecto).
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Envia una imagen a POST /predict y devuelve la respuesta cruda del modelo:
 * { predicted_class, confidence, all_probabilities }.
 */
export async function identifyPlant(file) {
  const formData = new FormData();
  formData.append('file', file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(
      `No se pudo conectar con la API (${API_BASE_URL}). Verifica que este corriendo: python -m src.api.app`,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `El servidor respondio con un error (${response.status}).`);
  }

  return response.json();
}

/** Ping a GET /health. Devuelve true/false, nunca lanza. */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Traduce el nombre crudo de clase del modelo (ej. "Tomato_Early_blight" o
 * "Pepper__bell___Bacterial_spot") a algo presentable en la UI.
 */
export function formatPrediction(raw) {
  const clean = raw.predicted_class.replace(/_+/g, ' ').trim();
  const isHealthy = /healthy/i.test(clean);
  const [cropRaw, ...rest] = clean.split(' ');
  const crop = cropRaw.charAt(0).toUpperCase() + cropRaw.slice(1).toLowerCase();
  const condition = isHealthy
    ? 'Healthy'
    : rest.filter((word) => word.toLowerCase() !== 'bell').join(' ') || 'Unknown';

  return {
    crop,
    condition,
    isHealthy,
    confidencePct: Math.round(raw.confidence * 100),
  };
}
