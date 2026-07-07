import { useEffect, useRef, useState } from 'react';
import { Camera, Send, User, X, Bot, Trash2 } from 'lucide-react';
import { identifyPlant, formatPrediction } from '../lib/api';
import { getChatMessages, saveChatMessages, clearChatMessages, fileToCompressedDataUrl } from '../lib/storage';
import { answerQuestion, fallbackAnswer, buildDiagnosisReply } from '../lib/plantAssistant';

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMessage(role, text, imageUrl) {
  return { id: crypto.randomUUID(), role, text, imageUrl, time: nowLabel() };
}

function welcomeMessage() {
  return createMessage(
    'assistant',
    '¡Hola! Soy tu Asistente de Plantas. Envíame una foto de una hoja o hazme una pregunta sobre tus cultivos.',
  );
}

/** Parser minimo de **negrita** y *cursiva* para las respuestas del asistente. */
function formatRichText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser ? 'bg-gray-200 text-gray-500' : 'bg-forest-600 text-white'
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className={`flex max-w-[78%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-tr-sm bg-forest-600 text-white'
              : 'rounded-tl-sm border border-gray-100 bg-white text-gray-700'
          }`}
        >
          {message.text && <p className="whitespace-pre-line">{formatRichText(message.text)}</p>}
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Adjunto enviado en el chat"
              className="mt-2 max-h-56 w-full rounded-xl object-cover"
            />
          )}
        </div>
        <span className="mt-1 px-1 text-[11px] text-gray-400">{message.time}</span>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white shadow-sm">
        <Bot size={13} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 rounded-full bg-forest-400"
            style={{ animation: `bounce 1s ease-in-out ${dot * 150}ms infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Quick-start suggestion chips */
const SUGGESTIONS = [
  '¿Qué enfermedades afectan al tomate?',
  '¿Cómo prevenir el tizón tardío?',
  '¿Cuándo debo fumigar?',
];

export default function ChatAssistant({ onBack }) {
  const [messages, setMessages] = useState(() => {
    const stored = getChatMessages();
    return stored.length > 0 ? stored : [welcomeMessage()];
  });
  const [inputText, setInputText]   = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [isTyping, setIsTyping]     = useState(false);

  const fileInputRef    = useRef(null);
  const scrollAnchorRef = useRef(null);
  const textareaRef     = useRef(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    saveChatMessages(messages);
  }, [messages]);

  function handleClearChat() {
    const fresh = [welcomeMessage()];
    setMessages(fresh);
    clearChatMessages();
  }

  function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
    event.target.value = '';
  }

  async function handleSend(overrideText) {
    const text = (overrideText ?? inputText).trim();
    if (!text && !pendingImage) return;

    const imageFile = pendingImage?.file ?? null;

    // Convertimos a un data URL comprimido para poder persistir el mensaje
    // (el blob: URL de la vista previa no sobrevive a un refresh de pagina).
    let persistedImageUrl = null;
    if (imageFile) {
      try {
        persistedImageUrl = await fileToCompressedDataUrl(imageFile);
      } catch {
        persistedImageUrl = pendingImage.previewUrl;
      }
    }

    setMessages((prev) => [...prev, createMessage('user', text, persistedImageUrl)]);
    setInputText('');
    setPendingImage(null);
    setIsTyping(true);

    let replyText;
    try {
      if (imageFile) {
        const raw    = await identifyPlant(imageFile);
        const parsed = formatPrediction(raw);
        replyText = buildDiagnosisReply(raw.predicted_class, parsed);
      } else {
        replyText = answerQuestion(text) ?? fallbackAnswer();
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

  const hasOnlyWelcome = messages.length === 1;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col page-enter" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:rounded-t-2xl lg:border lg:shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-600 shadow-sm">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-forest-700">Plant AI Assistant</h1>
          <p className="text-[11px] text-forest-500">Identificación inteligente de cultivos</p>
        </div>
        <button
          type="button"
          onClick={handleClearChat}
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
          aria-label="Vaciar conversación"
          title="Vaciar conversación"
        >
          <Trash2 size={18} />
        </button>
      </header>

      {/* Messages */}
      <div className="no-scrollbar flex-1 overflow-y-auto bg-gray-50/60 px-4 py-4 lg:border-x lg:border-gray-100 lg:bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingBubble />}
          <div ref={scrollAnchorRef} />
        </div>

        {/* Suggestion chips — only shown when no user message yet */}
        {hasOnlyWelcome && !isTyping && (
          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSend(s)}
                className="rounded-full border border-forest-200 bg-white px-3 py-1.5 text-xs font-medium text-forest-700 shadow-sm transition-all duration-200 hover:border-forest-400 hover:bg-forest-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 lg:rounded-b-2xl lg:border lg:border-t-0 lg:shadow-sm">
        {pendingImage && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-forest-100 bg-forest-50 px-3 py-2">
            <img src={pendingImage.previewUrl} alt="Imagen adjunta" className="h-10 w-10 rounded-lg object-cover" />
            <span className="flex-1 truncate text-xs text-gray-500">Imagen lista para enviar</span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
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
            className="shrink-0 rounded-full p-2.5 text-gray-500 transition-all duration-200 hover:bg-forest-50 hover:text-forest-600 hover:scale-105"
            aria-label="Adjuntar foto"
          >
            <Camera size={20} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe o pregunta sobre tus plantas…"
            className="max-h-24 flex-1 resize-none rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() && !pendingImage}
            className="shrink-0 rounded-full bg-forest-600 p-2.5 text-white shadow-sm transition-all duration-200 hover:bg-forest-700 hover:shadow-md hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:shadow-none"
            aria-label="Enviar mensaje"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
