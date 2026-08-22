import React, { useEffect, useState } from 'react';
import { fetchServices, fetchBudgetPolicy, fetchTransactions, fetchSecurityEvents } from '../services/api';
import { ServiceItem, BudgetPolicy, TransactionRecord, SecurityEventRecord } from '@trustx/shared';
import { ShieldCheck, Wallet, Activity, ArrowUpRight, CheckCircle2, AlertTriangle, Layers, Cpu } from 'lucide-react';

interface DashboardPageProps {
  onNavigateToConsole: (promptPreset?: string, targetServiceId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToConsole }) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [policy, setPolicy] = useState<BudgetPolicy | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [events, setEvents] = useState<SecurityEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sData, pData, tData, eData] = await Promise.all([
        fetchServices(),
        fetchBudgetPolicy(),
        fetchTransactions(),
        fetchSecurityEvents(),
      ]);
      setServices(sData);
      setPolicy(pData);
      setTransactions(tData);
      setEvents(eData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSpent = policy ? policy.spentToday : 0;
  const remainingBudget = policy ? Number((policy.dailyBudget - policy.spentToday).toFixed(4)) : 0;
  const avgTrust = services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.trustScore, 0) / services.length) : 0;

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/60 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous AI Agent Policy & Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trust before spend. <span className="text-sky-400">Optimize before pay.</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            TRUSTX continuously evaluates service reputation, security policy, and budget constraints before routing machine micro-payments over the x402 protocol on Algorand Testnet.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigateToConsole('Research the best technologies for EV battery recycling.')}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center space-x-2"
          >
            <span>Run Safe Demo</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigateToConsole('Research EV battery recycling using unverified shadow data provider.', 'Unverified Shadow Data (Unsafe Service X)')}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Test Unsafe Demo</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Daily Budget Spent</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            ${totalSpent.toFixed(2)} <span className="text-xs text-slate-500 font-sans">/ ${policy?.dailyBudget.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalSpent / (policy?.dailyBudget || 1)) * 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>Remaining:</span>
            <span className="text-emerald-400 font-mono">${remainingBudget.toFixed(2)} USDC</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Trust Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {avgTrust} <span className="text-xs text-slate-500 font-sans">/ 100</span>
          </div>
          <p className="text-xs text-emerald-400 mt-3 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reputation engine active</span>
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Verified Transactions</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {transactions.length}
          </div>
          <p className="text-xs text-slate-400 mt-3">Settled on Algorand Testnet</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Services</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {services.length}
          </div>
          <p className="text-xs text-purple-400 mt-3">Discovered in Registry</p>
        </div>
      </div>

      {/* Grid: Active Services & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Services */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
            <span>Discovered Services</span>
            <span className="text-xs font-normal text-slate-400">{services.length} endpoints available</span>
          </h3>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service._id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-white">{service.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      service.trustScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      Trust {service.trustScore}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{service.description}</p>
                </div>
                <div className="text-right pl-3">
                  <div className="text-xs font-mono font-bold text-sky-400">${service.pricePerRequest.toFixed(2)} USDC</div>
                  <div className="text-[10px] text-slate-500">{service.averageLatencyMs}ms latency</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
            <span>Recent Settlement Feed</span>
            <span className="text-xs font-normal text-sky-400">Algorand Testnet</span>
          </h3>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No transactions recorded yet. Run an agent request to trigger an x402 payment.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx._id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-emerald-400">x402 SETTLED</span>
                      <span className="text-xs text-slate-300 font-mono">${tx.amount} USDC</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center space-x-1">
                      <span>TxID:</span>
                      <span className="text-sky-400 truncate max-w-[180px] sm:max-w-[240px]">{tx.blockchainTransactionId}</span>
                    </div>
                  </div>
                  <a
                    href={tx.explorerUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-2 py-1 rounded flex items-center space-x-1"
                  >
                    <span>Explorer</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
