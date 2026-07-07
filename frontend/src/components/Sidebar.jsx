import { Leaf } from 'lucide-react';
import { NAV_ITEMS } from '../data/navigation';

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-100 lg:bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-600">
          <Leaf size={20} className="text-white" />
        </div>
        <span className="text-lg font-semibold text-forest-700">Plant AI</span>
      </div>

      <ul className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent-50 text-accent-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
