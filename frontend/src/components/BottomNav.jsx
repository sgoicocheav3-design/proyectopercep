import { NAV_ITEMS } from '../data/navigation';

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white lg:hidden">
      <ul className="flex items-stretch justify-between">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                className="flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.7} className={isActive ? 'text-accent-600' : 'text-gray-400'} />
                <span className={isActive ? 'text-accent-600' : 'text-gray-400'}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
