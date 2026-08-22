import React, { useEffect, useState } from 'react';
import { fetchServices, fetchReputation } from '../services/api';
import { ServiceItem, ReputationResult } from '@trustx/shared';
import { Store, ShieldCheck, Zap, Layers, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedReputation, setSelectedReputation] = useState<ReputationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices().then((data) => {
      setServices(data);
      if (data.length > 0) {
        fetchReputation(data[0]._id).then(setSelectedReputation);
      }
      setLoading(false);
    });
  }, []);

  const handleSelectService = async (serviceId: string) => {
    const rep = await fetchReputation(serviceId);
    setSelectedReputation(rep);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Service Registry & Marketplace</span>
          </div>
          <h2 className="text-xl font-bold text-white">Discovered Machine-Payable Services</h2>
          <p className="text-xs text-slate-400 mt-1">Services registered with x402 payment support on Algorand Testnet.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Services List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {services.map((service) => {
            const isSelected = selectedReputation?.serviceId === service._id;
            return (
              <div
                key={service._id}
                onClick={() => handleSelectService(service._id)}
                className={`p-5 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-base">{service.name}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                        service.trustScore >= 90
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : service.trustScore >= 70
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        Trust {service.trustScore}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-sky-400 font-mono">${service.pricePerRequest.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">USDC / req</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">SUCCESS RATE</span>
                    <span className="text-white font-semibold">{service.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVG LATENCY</span>
                    <span className="text-slate-300">{service.averageLatencyMs}ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVAILABILITY</span>
                    <span className="text-emerald-400 font-semibold">{service.availability}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transparent Reputation Score Breakdown (5 cols) */}
        <div className="lg:col-span-5">
          {selectedReputation ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-20">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{selectedReputation.label}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{selectedReputation.serviceName}</h3>
                <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                  {selectedReputation.trustScore} <span className="text-xs text-slate-500 font-sans">/ 100</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="text-xs font-bold text-slate-300">Transparent Formula Breakdown:</div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>1. Success Rate (30% weight)</span>
                    <span className="font-mono text-emerald-400">{selectedReputation.breakdown.successRateScore} / 30</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(selectedReputation.breakdown.successRateScore / 30) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>2. Transaction History (25% weight)</span>
                    <span className="font-mono text-sky-400">{selectedReputation.breakdown.historyScore} / 25</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full rounded-full" style={{ width: `${(selectedReputation.breakdown.historyScore / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>3. Availability (20% weight)</span>
                    <span className="font-mono text-purple-400">{selectedReputation.breakdown.availabilityScore} / 20</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full rounded-full" style={{ width: `${(selectedReputation.breakdown.availabilityScore / 20) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>4. Latency Performance (15% weight)</span>
                    <span className="font-mono text-amber-400">{selectedReputation.breakdown.latencyScore} / 15</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(selectedReputation.breakdown.latencyScore / 15) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>5. User Feedback (10% weight)</span>
                    <span className="font-mono text-teal-400">{selectedReputation.breakdown.feedbackScore} / 10</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: `${(selectedReputation.breakdown.feedbackScore / 10) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-slate-500 text-xs text-center">
              Select a service from the left to view its reputation breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
