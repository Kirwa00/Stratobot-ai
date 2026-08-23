import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SdlcPhaseTracker } from './components/SdlcPhaseTracker';
import { StrategyBuilder } from './components/StrategyBuilder';
import { MyStrategies } from './components/MyStrategies';
import { VideoHub } from './components/VideoHub';
import { SimulatorEngine } from './components/SimulatorEngine';
import { CodeAndCompiler } from './components/CodeAndCompiler';
import { PesaPalModal } from './components/PesaPalModal';
import { AdminPanel } from './components/AdminPanel';
import { StrategyBlueprint, UserSubscription } from './types';
import { INITIAL_VIDEOS, INITIAL_MY_STRATEGIES } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('builder');
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Saved strategies collection with localStorage persistence
  const [savedStrategies, setSavedStrategies] = useState<StrategyBlueprint[]>(() => {
    try {
      const stored = localStorage.getItem('stratobot_saved_strategies');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved strategies from localStorage:', e);
    }
    return INITIAL_MY_STRATEGIES;
  });

  // Sync saved strategies to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('stratobot_saved_strategies', JSON.stringify(savedStrategies));
    } catch (e) {
      console.warn('Failed to save strategies to localStorage:', e);
    }
  }, [savedStrategies]);

  // Default initial blueprint loaded from first saved strategy or video strategy card
  const [blueprint, setBlueprint] = useState<StrategyBlueprint>(
    savedStrategies[0] || INITIAL_VIDEOS[0].blueprint
  );

  // User subscription state
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: 'Free',
    downloadsUsedThisHour: 1,
    hourlyLimit: 5,
    kesPrice: 2500,
    usdPrice: 20,
  });

  // Save / Update a strategy in the My Strategies collection
  const handleSaveStrategy = (newBlueprint: StrategyBlueprint) => {
    setSavedStrategies((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === newBlueprint.id || s.title.trim().toLowerCase() === newBlueprint.title.trim().toLowerCase());
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = {
          ...newBlueprint,
          updatedAt: new Date().toISOString()
        };
        return updated;
      }
      return [
        {
          ...newBlueprint,
          createdAt: newBlueprint.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...prev
      ];
    });
  };

  // Delete strategy
  const handleDeleteStrategy = (id: string) => {
    setSavedStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  // Duplicate strategy
  const handleDuplicateStrategy = (id: string) => {
    const target = savedStrategies.find((s) => s.id === id);
    if (!target) return;

    const cloned: StrategyBlueprint = {
      ...target,
      id: `my-strat-${Date.now()}`,
      title: `${target.title} (Copy)`,
      magicNumber: Math.floor(100000 + Math.random() * 800000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: target.source || 'manual'
    };

    setSavedStrategies((prev) => [cloned, ...prev]);
  };

  // Handler when user clicks "One-Click Load Strategy" in Video Hub
  const handleLoadStrategyFromVideo = (newBlueprint: StrategyBlueprint) => {
    setBlueprint(newBlueprint);
    handleSaveStrategy({
      ...newBlueprint,
      source: 'youtube',
      tags: ['YouTube Strategy', newBlueprint.symbol, newBlueprint.timeframe]
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        subscription={subscription}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        strategiesCount={savedStrategies.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'builder' && (
          <StrategyBuilder
            blueprint={blueprint}
            setBlueprint={setBlueprint}
            onSendToBacktest={() => setActiveTab('simulator')}
            onSendToCompile={() => setActiveTab('compiler')}
            onNavigateToVideoHub={() => setActiveTab('video-hub')}
            onSaveToMyStrategies={handleSaveStrategy}
            onNavigateToMyStrategies={() => setActiveTab('my-strategies')}
          />
        )}

        {activeTab === 'my-strategies' && (
          <MyStrategies
            strategies={savedStrategies}
            currentBlueprint={blueprint}
            onSelectStrategy={(strat) => setBlueprint(strat)}
            onSaveStrategy={handleSaveStrategy}
            onDeleteStrategy={handleDeleteStrategy}
            onDuplicateStrategy={handleDuplicateStrategy}
            onNavigateToBuilder={() => setActiveTab('builder')}
            onNavigateToSimulator={() => setActiveTab('simulator')}
            onNavigateToCompiler={() => setActiveTab('compiler')}
          />
        )}

        {activeTab === 'video-hub' && (
          <VideoHub
            onLoadStrategy={handleLoadStrategyFromVideo}
            onNavigateToBuilder={() => setActiveTab('builder')}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorEngine blueprint={blueprint} currency={currency} />
        )}

        {activeTab === 'compiler' && (
          <CodeAndCompiler blueprint={blueprint} />
        )}

        {activeTab === 'sdlc' && <SdlcPhaseTracker />}

        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-8 text-xs text-slate-400 mt-12 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">StratoBot AI</span>
            <span>—</span>
            <span>MetaTrader 5 EA Builder & Compiler Agent</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>SDLC Version: 1.0 (MVP)</span>
            <span>•</span>
            <span>Azure Windows VM Agent Ready</span>
            <span>•</span>
            <span>PesaPal M-Pesa Integrated</span>
          </div>
        </div>
      </footer>

      {/* PesaPal Checkout Modal */}
      <PesaPalModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currency={currency}
        onSuccess={(updatedSub) => setSubscription(updatedSub)}
      />
    </div>
  );
}
