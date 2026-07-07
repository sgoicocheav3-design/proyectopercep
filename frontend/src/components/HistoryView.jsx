import { useMemo, useState } from 'react';
import { History, Leaf, Plus, Search, Trash2 } from 'lucide-react';
import { getHistory, removeHistoryEntry } from '../lib/storage';

/** Empty state */
function EmptyState({ onGoHome }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center page-enter">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest-50">
        <History size={40} strokeWidth={1.4} className="text-forest-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-800">No hay análisis aún</h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-gray-400">
        Una vez que identifiques tu primera planta, el historial aparecerá aquí con todos los detalles.
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="flex items-center gap-2 rounded-xl bg-forest-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-forest-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        <Leaf size={16} />
        Identificar mi primera planta
      </button>
    </div>
  );
}

export default function HistoryView({ onNavigate }) {
  const [items, setItems] = useState(() => getHistory());
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.crop.toLowerCase().includes(q) || item.condition.toLowerCase().includes(q),
    );
  }, [items, query]);

  function handleDelete(id) {
    setItems(removeHistoryEntry(id));
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8 pt-5 lg:max-w-none lg:px-0 lg:pt-0 page-enter">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-forest-700 lg:text-2xl">Historial</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {items.length === 0 ? 'Tus análisis anteriores' : `${items.length} análisis guardado${items.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </header>

      {/* Search bar */}
      {items.length > 0 && (
        <div className="mb-5 relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por especie o condición…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
          />
        </div>
      )}

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState onGoHome={() => onNavigate('home')} />
      ) : filteredItems.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">No hay resultados para "{query}".</p>
      ) : (
        <ul className="space-y-3">
          {filteredItems.map((item) => (
            <li key={item.id} className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <img src={item.imageUrl} alt={item.crop} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{item.crop}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.condition} · {item.confidencePct}%</p>
                <p className="text-xs text-gray-300 mt-1">{item.date}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.isHealthy ? 'bg-forest-50 text-forest-600' : 'bg-amber-50 text-amber-600'}`}>
                {item.isHealthy ? 'Sana' : 'Enferma'}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="shrink-0 rounded-full p-2 text-gray-300 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                aria-label="Eliminar del historial"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-forest-600 text-white shadow-lg transition-all duration-200 hover:bg-forest-700 hover:shadow-xl hover:scale-105 active:scale-95 lg:bottom-6 lg:right-8"
        aria-label="Nuevo análisis"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
