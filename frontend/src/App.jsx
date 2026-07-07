import { useState } from 'react';
import Layout from './components/Layout';
import PlantIdentifier from './components/PlantIdentifier';
import ChatAssistant from './components/ChatAssistant';
import ComingSoon from './components/ComingSoon';
import { NAV_ITEMS } from './data/navigation';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  function renderScreen() {
    switch (activeTab) {
      case 'home':
        return <PlantIdentifier />;
      case 'ai-coach':
        return <ChatAssistant onBack={() => setActiveTab('home')} />;
      default: {
        const label = NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? activeTab;
        return <ComingSoon label={label} />;
      }
    }
  }

  return (
    <Layout active={activeTab} onChange={setActiveTab}>
      {renderScreen()}
    </Layout>
  );
}
