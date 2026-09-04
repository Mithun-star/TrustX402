import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { AgentConsolePage } from './pages/AgentConsolePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { SecurityPage } from './pages/SecurityPage';
import { BudgetPage } from './pages/BudgetPage';
import { TransactionsPage } from './pages/TransactionsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [consolePrompt, setConsolePrompt] = useState<string>('Research the best technologies for EV battery recycling.');
  const [consoleTargetServiceId, setConsoleTargetServiceId] = useState<string | undefined>(undefined);

  const handleNavigateToConsole = (promptPreset?: string, targetServiceId?: string) => {
    if (promptPreset) setConsolePrompt(promptPreset);
    setConsoleTargetServiceId(targetServiceId);
    setActiveTab('console');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardPage onNavigateToConsole={handleNavigateToConsole} />}
        {activeTab === 'console' && (
          <AgentConsolePage initialPrompt={consolePrompt} initialTargetServiceId={consoleTargetServiceId} />
        )}
        {activeTab === 'marketplace' && <MarketplacePage onUseService={handleNavigateToConsole} />}
        {activeTab === 'security' && <SecurityPage />}
        {activeTab === 'budget' && <BudgetPage />}
        {activeTab === 'transactions' && <TransactionsPage />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>TRUSTX Gateway v1.0 • Agentic Payments (x402) Algorand Hackathon MVP</div>
          <div className="flex space-x-4 text-slate-400">
            <span>Network: Algorand Testnet</span>
            <span>USDC ASA: 10458941</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
