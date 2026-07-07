import { useState } from 'react';
import Layout from './components/Layout';
import PlantIdentifier from './components/PlantIdentifier';
import ChatAssistant from './components/ChatAssistant';
import HistoryView from './components/HistoryView';
import DiaryView from './components/DiaryView';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

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
    <Layout active={activeTab} onChange={setActiveTab}>
      {renderScreen()}
    </Layout>
  );
}
