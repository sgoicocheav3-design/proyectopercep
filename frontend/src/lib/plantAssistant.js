// Motor de respuestas por reglas/keywords para el AI Coach. No hay ningun
// LLM detras (el backend Flask solo expone /health y /predict): esto le da
// al chat respuestas utiles sobre las 15 clases que el modelo reconoce sin
// necesitar una API externa.
import { CROPS, CONDITIONS, RAW_CLASS_TO_CONDITION } from '../data/plantKnowledge.js';

// Orden = prioridad: las frases de "list" son mas especificas (varias
// palabras) y deben ganarle a keywords sueltas como "identificar" que
// tambien aparecen en preguntas sobre sintomas de una enfermedad puntual.
const INTENT_KEYWORDS = {
  list: ['que enfermedades', 'cuales enfermedades', 'que puedes', 'que analizas', 'que identificas', 'que cultivos', 'que reconoces'],
  prevention: ['prevenir', 'prevencion', 'prevención', 'evitar', 'evito', 'cuidar', 'cuidado', 'cuido', 'prevengo', 'previene'],
  treatment: ['tratar', 'tratamiento', 'trato', 'trata', 'tratando', 'curar', 'cura', 'curo', 'fungicida', 'combatir', 'combato', 'eliminar', 'elimino', 'quitar', 'quito'],
  symptoms: ['sintoma', 'síntoma', 'se ve', 'reconozco', 'reconocer', 'señal', 'senal', 'identificar', 'identifico'],
  causes: ['causa', 'causas', 'por que sale', 'porque sale', 'origen', 'de donde sale'],
  when: ['cuando', 'fumigar', 'epoca', 'época', 'momento'],
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function detectCrop(normalized) {
  for (const [id, crop] of Object.entries(CROPS)) {
    if (crop.aliases.some((alias) => normalized.includes(normalize(alias)))) return id;
  }
  return null;
}

function detectConditionId(normalized) {
  for (const [id, condition] of Object.entries(CONDITIONS)) {
    if (condition.aliases.some((alias) => normalized.includes(normalize(alias)))) return id;
  }
  return null;
}

function detectIntent(normalized) {
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((k) => normalized.includes(normalize(k)))) return intent;
  }
  return null;
}

function cropsAffectedBy(conditionId) {
  return Object.values(RAW_CLASS_TO_CONDITION)
    .filter((entry) => entry.condition === conditionId)
    .map((entry) => CROPS[entry.crop].label);
}

function conditionsFor(cropId) {
  const ids = new Set(
    Object.values(RAW_CLASS_TO_CONDITION)
      .filter((entry) => entry.crop === cropId && entry.condition !== 'healthy')
      .map((entry) => entry.condition),
  );
  return [...ids].map((id) => CONDITIONS[id].label);
}

function bulletList(items) {
  return items.map((item) => `• ${item}`).join('\n');
}

function buildConditionAnswer(conditionId, intent) {
  const condition = CONDITIONS[conditionId];
  const crops = cropsAffectedBy(conditionId);
  const cropsLabel = crops.length ? ` (afecta: ${crops.join(', ')})` : '';

  if (intent === 'prevention') {
    return `Para prevenir *${condition.label}*${cropsLabel}:\n${bulletList(condition.prevention)}`;
  }
  if (intent === 'treatment') {
    return `Tratamiento para *${condition.label}*${cropsLabel}:\n${bulletList(condition.treatment)}`;
  }
  if (intent === 'causes') {
    return `Causa de *${condition.label}*: ${condition.causes}`;
  }
  if (intent === 'symptoms') {
    return `Síntomas de *${condition.label}*: ${condition.symptoms}`;
  }
  if (intent === 'when') {
    return `El mejor momento para actuar contra *${condition.label}*${cropsLabel}:\n${bulletList(condition.prevention.slice(0, 2))}\nSi ya ves síntomas, no esperes: ${condition.treatment[0]}`;
  }

  // Sin intencion especifica: resumen completo
  return [
    `**${condition.label}**${cropsLabel}`,
    `Síntomas: ${condition.symptoms}`,
    `Causa: ${condition.causes}`,
    'Prevención:',
    bulletList(condition.prevention),
    'Tratamiento:',
    bulletList(condition.treatment),
  ].join('\n');
}

function buildCropOverview(cropId) {
  const crop = CROPS[cropId];
  const diseases = conditionsFor(cropId);
  return [
    `En *${crop.label}* reconozco estas condiciones:`,
    bulletList([...diseases, 'Planta sana']),
    'Pregúntame por alguna en específico (síntomas, causas, prevención o tratamiento), o adjunta una foto para un diagnóstico directo.',
  ].join('\n');
}

function buildCapabilitiesList() {
  const cropLines = Object.values(CROPS).map((c) => c.label).join(', ');
  return [
    `Puedo identificar 15 condiciones distintas en 3 cultivos: ${cropLines}.`,
    'Pregúntame por una enfermedad puntual (ej. "¿cómo trato el tizón tardío?") o adjunta una foto con el ícono de cámara para un diagnóstico directo.',
  ].join('\n');
}

/**
 * Intenta responder una pregunta de texto usando la base de conocimiento.
 * Devuelve null si no encontro nada relevante (el caller debe usar un
 * mensaje de respaldo).
 */
export function answerQuestion(text) {
  const normalized = normalize(text);
  const intent = detectIntent(normalized);

  if (intent === 'list') {
    const crop = detectCrop(normalized);
    return crop ? buildCropOverview(crop) : buildCapabilitiesList();
  }

  const conditionId = detectConditionId(normalized);
  if (conditionId) {
    return buildConditionAnswer(conditionId, intent);
  }

  const crop = detectCrop(normalized);
  if (crop) {
    return buildCropOverview(crop);
  }

  if (intent === 'when') {
    return [
      'Depende de la enfermedad y el clima. Como regla general:',
      bulletList([
        'Aplica tratamientos preventivos cuando el pronóstico anuncie varios días húmedos y templados.',
        'Actúa de inmediato ante los primeros síntomas visibles; no esperes a que se extiendan.',
      ]),
      'Pregúntame por una enfermedad específica (ej. "¿cuándo tratar el tizón tardío?") para el momento óptimo exacto.',
    ].join('\n');
  }

  return null;
}

/** Mensaje de respaldo cuando no se detecta cultivo, condicion ni intencion conocida. */
export function fallbackAnswer() {
  return [
    'No estoy seguro de haber entendido tu pregunta 🤔. Puedo ayudarte con:',
    bulletList([
      'Síntomas, causas, prevención y tratamiento de las enfermedades que reconozco.',
      'Diagnóstico directo a partir de una foto (ícono de cámara).',
    ]),
    'Prueba con algo como "¿cómo prevengo el tizón tardío en papa?".',
  ].join('\n');
}

/** Enriquece el resultado de un diagnostico por foto con datos de la base de conocimiento. */
export function buildDiagnosisReply(rawClass, parsedResult) {
  const match = RAW_CLASS_TO_CONDITION[rawClass];
  const { crop, confidencePct } = parsedResult;

  if (!match) {
    return parsedResult.isHealthy
      ? `¡Buenas noticias! La hoja de **${crop}** se ve sana (confianza ${confidencePct}%).`
      : `He analizado la imagen. Parece una hoja de **${crop}** con *${parsedResult.condition}* (confianza ${confidencePct}%).`;
  }

  const condition = CONDITIONS[match.condition];
  if (match.condition === 'healthy') {
    return `¡Buenas noticias! La hoja de **${crop}** se ve sana (confianza ${confidencePct}%).\n${condition.prevention[0]}`;
  }

  return [
    `He analizado la imagen: hoja de **${crop}** con *${condition.label}* (confianza ${confidencePct}%).`,
    `Síntomas típicos: ${condition.symptoms}`,
    'Recomendación inmediata:',
    bulletList(condition.treatment.slice(0, 2)),
    '¿Quieres que te dé también la prevención para el próximo ciclo?',
  ].join('\n');
}
