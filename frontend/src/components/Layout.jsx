import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

/**
 * Shell responsivo: sidebar fija a la izquierda en pantallas >= lg,
 * barra de navegacion inferior fija en movil/tablet.
 */
export default function Layout({ active, onChange, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active={active} onChange={onChange} />

      <div className="lg:pl-64">
        <main className="min-h-screen w-full bg-white pb-20 lg:bg-gray-50 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav active={active} onChange={onChange} />
    </div>
  );
}
