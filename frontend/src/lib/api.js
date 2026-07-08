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
  const translations = {
    "Pepper__bell___Bacterial_spot": { crop: "Pimiento", condition: "Mancha bacteriana" },
    "Pepper__bell___healthy": { crop: "Pimiento", condition: "Saludable" },
    "Potato___Early_blight": { crop: "Papa", condition: "Tizón temprano" },
    "Potato___Late_blight": { crop: "Papa", condition: "Tizón tardío" },
    "Potato___healthy": { crop: "Papa", condition: "Saludable" },
    "Tomato_Bacterial_spot": { crop: "Tomate", condition: "Mancha bacteriana" },
    "Tomato_Early_blight": { crop: "Tomate", condition: "Tizón temprano" },
    "Tomato_Late_blight": { crop: "Tomate", condition: "Tizón tardío" },
    "Tomato_Leaf_Mold": { crop: "Tomate", condition: "Moho de la hoja" },
    "Tomato_Septoria_leaf_spot": { crop: "Tomate", condition: "Mancha foliar por Septoria" },
    "Tomato_Spider_mites_Two_spotted_spider_mite": { crop: "Tomate", condition: "Ácaros (Araña roja)" },
    "Tomato__Target_Spot": { crop: "Tomate", condition: "Mancha objetivo" },
    "Tomato__Tomato_YellowLeaf__Curl_Virus": { crop: "Tomate", condition: "Virus de hoja amarilla" },
    "Tomato__Tomato_mosaic_virus": { crop: "Tomate", condition: "Virus del mosaico" },
    "Tomato_healthy": { crop: "Tomate", condition: "Saludable" },
  };

  const translated = translations[raw.predicted_class] || { crop: "Desconocido", condition: "Desconocido" };
  const isHealthy = raw.predicted_class.toLowerCase().includes('healthy');

  return {
    crop: translated.crop,
    condition: translated.condition,
    isHealthy,
    rawClass: raw.predicted_class,
    confidencePct: Math.round(raw.confidence * 100),
  };
}
