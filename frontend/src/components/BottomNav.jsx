import { NAV_ITEMS } from '../data/navigation';

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 backdrop-blur-sm lg:hidden">
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                className="flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-150"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-accent-100 scale-110' : 'hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.4 : 1.7}
                    className={`transition-colors duration-200 ${isActive ? 'text-accent-600' : 'text-gray-400'}`}
                  />
                </span>
                <span className={`transition-colors duration-200 ${isActive ? 'text-accent-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
