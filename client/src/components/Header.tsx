import React from 'react';
import { ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-mono">TRUST<span className="text-sky-400">X</span></span>
              <span className="text-xs bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                x402 Gateway
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Trust before spend. Optimize before pay.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Algorand Testnet</span>
            <span className="text-slate-500">|</span>
            <span className="text-sky-400 font-mono">USDC ASA (10458941)</span>
          </div>

          <div className="flex items-center space-x-2 bg-sky-950/60 border border-sky-800/50 rounded-lg px-3 py-1.5 text-xs text-sky-300">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>GoPlausible Facilitator</span>
          </div>
        </div>
      </div>
    </header>
  );
};
