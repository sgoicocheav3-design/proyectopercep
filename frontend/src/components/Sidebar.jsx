import { Leaf } from 'lucide-react';
import { NAV_ITEMS } from '../data/navigation';

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-100 lg:bg-white lg:shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-600 shadow-sm">
          <Leaf size={20} className="text-white" />
        </div>
        <div>
          <span className="block text-base font-bold text-forest-700 leading-tight">Plant AI</span>
          <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest">Identificador</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Navegación
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onChange(id)}
                  className={`
                    group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5
                    text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-accent-50 text-accent-600 shadow-sm'
                      : 'text-gray-500 hover:bg-forest-50 hover:text-forest-700'
                    }
                  `}
                >
                  {/* Active accent bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-accent-600" />
                  )}
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    className={`shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`}
                  />
                  <span className="transition-colors duration-200">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4">
        <p className="text-[10px] text-gray-400">v1.0.0 · Plant AI &copy; 2025</p>
      </div>
    </aside>
  );
}
