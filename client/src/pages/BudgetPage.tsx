import React, { useEffect, useState } from 'react';
import { fetchBudgetPolicy, updateBudgetPolicyApi } from '../services/api';
import { BudgetPolicy } from '@trustx/shared';
import { Wallet, Save, RefreshCcw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const BudgetPage: React.FC = () => {
  const [policy, setPolicy] = useState<BudgetPolicy | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgetPolicy().then(setPolicy);
  }, []);

  const handleSave = async () => {
    if (!policy) return;
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateBudgetPolicyApi(policy);
      setPolicy(updated);
      setMsg('Policy updated successfully.');
    } catch (err: any) {
      setMsg('Failed to update policy: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!policy) return <div className="p-8 text-center text-slate-500">Loading Budget Policy...</div>;

  const spentPercent = Math.min(100, (policy.spentToday / policy.dailyBudget) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Agent Financial Governance</span>
          </div>
          <h2 className="text-xl font-bold text-white">Budget & Spending Policy Engine</h2>
          <p className="text-xs text-slate-400 mt-1">Configure maximum transaction limits, daily caps, minimum trust thresholds, and allowed category filters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Spending Visualizer (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Daily Budget Utilization</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Daily Cap:</span>
              <span className="font-mono font-bold text-white">${policy.dailyBudget.toFixed(2)} USDC</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Spent Today:</span>
              <span className="font-mono font-bold text-sky-400">${policy.spentToday.toFixed(2)} USDC</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Remaining:</span>
              <span className="font-mono font-bold text-emerald-400">${(policy.dailyBudget - policy.spentToday).toFixed(2)} USDC</span>
            </div>

            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${spentPercent}%` }}></div>
            </div>
          </div>

          <div className="p-4 bg-sky-950/40 border border-sky-800/40 rounded-xl text-xs text-sky-300 space-y-1">
            <div className="font-bold flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Automatic Payment Blocking</span>
            </div>
            <p className="text-sky-400/80">
              The Budget Engine validates every x402 payment challenge before on-chain signing occurs. If a request violates any rule below, execution is aborted immediately.
            </p>
          </div>
        </div>

        {/* Right Column: Policy Configuration Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Policy Parameters</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Policy'}</span>
            </button>
          </h3>

          {msg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{msg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Daily Budget Cap (USDC):</label>
              <input
                type="number"
                step="0.10"
                value={policy.dailyBudget}
                onChange={(e) => setPolicy({ ...policy, dailyBudget: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Max Per Transaction (USDC):</label>
              <input
                type="number"
                step="0.01"
                value={policy.maxPerTransaction}
                onChange={(e) => setPolicy({ ...policy, maxPerTransaction: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Minimum Trust Score (0-100):</label>
              <input
                type="number"
                value={policy.minimumTrustScore}
                onChange={(e) => setPolicy({ ...policy, minimumTrustScore: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Spent Today (USDC):</label>
              <input
                type="number"
                disabled
                value={policy.spentToday}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-slate-400 text-xs font-semibold">Allowed Service Categories:</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {['research', 'data', 'compute', 'storage', 'ai'].map((cat) => {
                const isAllowed = policy.allowedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      const updatedCats = isAllowed
                        ? policy.allowedCategories.filter((c) => c !== cat)
                        : [...policy.allowedCategories, cat];
                      setPolicy({ ...policy, allowedCategories: updatedCats });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition border ${
                      isAllowed
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isAllowed ? '✓ ' : '+ '}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
