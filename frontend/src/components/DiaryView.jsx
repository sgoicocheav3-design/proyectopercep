import { useEffect, useRef, useState } from 'react';
import { BookOpen, Plus, X, Save, Loader2, FileText, Trash2 } from 'lucide-react';
import { addDiaryEntry, getDiaryEntries, removeDiaryEntry } from '../lib/storage';

/** Empty state */
function EmptyState({ onNewEntry }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center page-enter">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest-50">
        <BookOpen size={40} strokeWidth={1.4} className="text-forest-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-800">Tu diario está vacío</h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-gray-400">
        Registra el estado de tus plantas, tratamientos aplicados o cualquier observación importante.
      </p>
      <button
        type="button"
        onClick={onNewEntry}
        className="flex items-center gap-2 rounded-xl bg-forest-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-forest-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        <Plus size={16} />
        Agregar primera entrada
      </button>
    </div>
  );
}

/** Modal for new diary entry */
function NewEntryModal({ onClose, onSave }) {
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef            = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate save
    onSave({ title: title.trim(), body: body.trim() });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center">
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl lg:rounded-2xl page-enter"
        role="dialog"
        aria-modal="true"
        aria-label="Nueva entrada del diario"
      >
        {/* Modal header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-forest-600" />
            <h2 className="text-base font-bold text-gray-800">Nueva entrada</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Date chip */}
        <p className="mb-4 text-xs font-medium text-gray-400">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la entrada…"
          className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-gray-400 focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
        />

        {/* Body */}
        <textarea
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe el estado de tus plantas, tratamientos, observaciones…"
          className="mb-5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 rounded-xl bg-forest-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-forest-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Single diary entry card */
function EntryCard({ entry, onDelete }) {
  const dateStr = new Date(entry.timestamp).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const timeStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug">{entry.title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">{dateStr} · {timeStr}</span>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="rounded-full p-1.5 text-gray-300 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            aria-label="Eliminar entrada"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {entry.body && (
        <p className="text-sm leading-relaxed text-gray-500 line-clamp-3">{entry.body}</p>
      )}
    </div>
  );
}

export default function DiaryView() {
  const [entries, setEntries] = useState(() => getDiaryEntries());
  const [showModal, setShowModal] = useState(false);

  function handleSave(data) {
    const list = addDiaryEntry({ id: crypto.randomUUID(), ...data, timestamp: Date.now() });
    setEntries(list);
    setShowModal(false);
  }

  function handleDelete(id) {
    setEntries(removeDiaryEntry(id));
  }

  return (
    <>
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-5 lg:max-w-none lg:px-0 lg:pt-0 page-enter">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-forest-700 lg:text-2xl">Diario</h1>
            <p className="text-xs text-gray-400 mt-0.5">Tus observaciones de campo</p>
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-forest-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-forest-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={15} />
              Nueva entrada
            </button>
          )}
        </header>

        {/* Content */}
        {entries.length === 0 ? (
          <EmptyState onNewEntry={() => setShowModal(true)} />
        ) : (
          <ul className="space-y-4">
            {entries.map((entry) => (
              <li key={entry.id}>
                <EntryCard entry={entry} onDelete={handleDelete} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB (only when there are entries) */}
      {entries.length > 0 && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-forest-600 text-white shadow-lg transition-all duration-200 hover:bg-forest-700 hover:shadow-xl hover:scale-105 active:scale-95 lg:bottom-6 lg:right-8"
          aria-label="Nueva entrada"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <NewEntryModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
