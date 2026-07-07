import { useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';
import Layout from './components/Layout';
import PlantIdentifier from './components/PlantIdentifier';
import ChatAssistant from './components/ChatAssistant';
import HistoryView from './components/HistoryView';
import DiaryView from './components/DiaryView';
import { checkHealth } from './lib/api';

// Cada cuanto se reintenta el ping a /health mientras el backend esta caido.
const HEALTH_RETRY_MS = 15000;

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [backendOnline, setBackendOnline] = useState(true); // optimista hasta el primer chequeo
  const retryTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      const online = await checkHealth();
      if (cancelled) return;
      setBackendOnline(online);
      if (!online) {
        retryTimerRef.current = setTimeout(ping, HEALTH_RETRY_MS);
      }
    }

    ping();
    return () => {
      cancelled = true;
      clearTimeout(retryTimerRef.current);
    };
  }, []);

  function renderScreen() {
    switch (activeTab) {
      case 'home':
        return <PlantIdentifier />;
      case 'history':
        return <HistoryView onNavigate={setActiveTab} />;
      case 'diary':
        return <DiaryView />;
      case 'ai-coach':
        return <ChatAssistant onBack={() => setActiveTab('home')} />;
      default:
        return <PlantIdentifier />;
    }
  }

  return (
    <>
      {!backendOnline && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm">
          <WifiOff size={14} />
          No se pudo conectar con el servidor de análisis. Verifica que la API esté corriendo.
        </div>
      )}
      <Layout active={activeTab} onChange={setActiveTab}>
        {renderScreen()}
      </Layout>
    </>
  );
}
