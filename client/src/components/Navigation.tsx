import React from 'react';
import { LayoutDashboard, Bot, Store, ShieldAlert, Wallet, History } from 'lucide-react';

export type TabType = 'dashboard' | 'console' | 'marketplace' | 'security' | 'budget' | 'transactions';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'console', label: 'Agent Console', icon: Bot },
    { id: 'marketplace', label: 'Service Marketplace', icon: Store },
    { id: 'security', label: 'Security Center', icon: ShieldAlert },
    { id: 'budget', label: 'Budget Policy', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: History },
  ] as const;

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
