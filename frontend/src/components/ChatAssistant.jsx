import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Info, Leaf, Send, User, X } from 'lucide-react';
import { identifyPlant, formatPrediction } from '../lib/api';

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMessage(role, text, imageUrl) {
  return { id: crypto.randomUUID(), role, text, imageUrl, time: nowLabel() };
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-gray-200 text-gray-500' : 'bg-forest-100 text-forest-600'
        }`}
      >
        {isUser ? <User size={14} /> : <Leaf size={14} />}
      </div>

      <div className={`flex max-w-[78%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-forest-100 text-gray-800'
              : 'rounded-tl-sm border border-gray-100 bg-white text-gray-700 shadow-sm'
          }`}
        >
          {message.text && <p>{message.text}</p>}
          {message.imageUrl && (
            <img src={message.imageUrl} alt="Adjunto enviado en el chat" className="mt-2 max-h-56 w-full rounded-xl object-cover" />
          )}
        </div>
        <span className="mt-1 px-1 text-[11px] text-gray-400">{message.time}</span>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-600">
        <Leaf size={14} />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300"
            style={{ animationDelay: `${dot * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatAssistant({ onBack }) {
  const [messages, setMessages] = useState([
    createMessage(
      'assistant',
      "Hello! I'm your Plant Identification Assistant. You can send me a photo of a plant or describe it, and I'll help identify it!",
    ),
  ]);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState(null); // { file, previewUrl }
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef(null);
  const scrollAnchorRef = useRef(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
    event.target.value = '';
  }

  async function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed && !pendingImage) return;

    const imageFile = pendingImage?.file ?? null;
    setMessages((prev) => [...prev, createMessage('user', trimmed, pendingImage?.previewUrl)]);
    setInputText('');
    setPendingImage(null);
    setIsTyping(true);

    let replyText;
    try {
      if (imageFile) {
        const raw = await identifyPlant(imageFile);
        const parsed = formatPrediction(raw);
        replyText = parsed.isHealthy
          ? `Buenas noticias: la hoja de ${parsed.crop} se ve sana (confianza ${parsed.confidencePct}%).`
          : `He analizado la imagen. Parece una hoja de ${parsed.crop} con ${parsed.condition} (confianza ${parsed.confidencePct}%).`;
      } else {
        replyText =
          'Por ahora solo puedo analizar fotos de hojas de tomate, papa o pimiento. Adjunta una imagen con el icono de camara y te dire que encuentro.';
      }
    } catch (error) {
      replyText = `No pude analizar la imagen: ${error.message}`;
    }

    setMessages((prev) => [...prev, createMessage('assistant', replyText)]);
    setIsTyping(false);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-md flex-col lg:h-[calc(100vh-4rem)] lg:max-w-2xl">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3 lg:rounded-t-2xl lg:border lg:bg-white">
        <button type="button" onClick={onBack} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-forest-700">Plant AI Assistant</h1>
        <button type="button" className="rounded-full p-2 text-gray-400 hover:bg-gray-100" aria-label="Informacion">
          <Info size={20} />
        </button>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-gray-50/60 px-4 py-4 lg:border-x lg:bg-gray-50">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingBubble />}
        <div ref={scrollAnchorRef} />
      </div>

      <div className="border-t border-gray-100 bg-white px-3 py-3 lg:rounded-b-2xl lg:border lg:border-t-0">
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-forest-100 bg-forest-50 px-2 py-2">
            <img src={pendingImage.previewUrl} alt="Imagen adjunta" className="h-10 w-10 rounded-lg object-cover" />
            <span className="flex-1 truncate text-xs text-gray-500">Imagen lista para enviar</span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Quitar imagen"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-full p-2.5 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Adjuntar foto"
          >
            <Camera size={20} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />

          <textarea
            rows={1}
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe or ask..."
            className="max-h-24 flex-1 resize-none rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() && !pendingImage}
            className="shrink-0 rounded-full bg-forest-600 p-2.5 text-white transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            aria-label="Enviar mensaje"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
