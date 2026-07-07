// Persistencia en localStorage para historial, diario y chat. No hay backend
// para estos datos (src/api/app.py solo expone /health y /predict), asi que
// viven enteramente en el cliente.
const KEYS = {
  history: 'plantai:history',
  diary: 'plantai:diary',
  chat: 'plantai:chat',
};

const HISTORY_LIMIT = 60; // cada entrada incluye una imagen en base64
const CHAT_LIMIT = 100;

function readList(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (error) {
    console.warn(`No se pudo guardar en localStorage (${key}):`, error);
    return false;
  }
}

// ---- Historial de identificaciones ----
export function getHistory() {
  return readList(KEYS.history);
}

export function addHistoryEntry(entry) {
  const list = [entry, ...readList(KEYS.history)].slice(0, HISTORY_LIMIT);
  writeList(KEYS.history, list);
  return list;
}

export function removeHistoryEntry(id) {
  const list = readList(KEYS.history).filter((item) => item.id !== id);
  writeList(KEYS.history, list);
  return list;
}

// ---- Diario de campo ----
export function getDiaryEntries() {
  return readList(KEYS.diary);
}

export function addDiaryEntry(entry) {
  const list = [entry, ...readList(KEYS.diary)];
  writeList(KEYS.diary, list);
  return list;
}

export function removeDiaryEntry(id) {
  const list = readList(KEYS.diary).filter((item) => item.id !== id);
  writeList(KEYS.diary, list);
  return list;
}

// ---- Chat del asistente ----
export function getChatMessages() {
  return readList(KEYS.chat);
}

export function saveChatMessages(messages) {
  writeList(KEYS.chat, messages.slice(-CHAT_LIMIT));
}

export function clearChatMessages() {
  writeList(KEYS.chat, []);
}

/**
 * Convierte un File de imagen a un data URL JPEG comprimido, para poder
 * guardarlo en localStorage (los blob: URLs de URL.createObjectURL no
 * sobreviven a un refresh de pagina).
 */
export function fileToCompressedDataUrl(file, maxDim = 480, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
