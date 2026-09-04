import React, { useEffect, useState } from 'react';
import { fetchServices, fetchReputation, registerService } from '../services/api';
import { ServiceItem, ReputationResult } from '@trustx/shared';
import { Store, ShieldCheck, Zap, Layers, ChevronRight, Activity, ArrowUpRight, Plus, X, Building2 } from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedReputation, setSelectedReputation] = useState<ReputationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    description: '',
    endpoint: '',
    category: 'research',
    capabilities: 'research, market-intelligence',
    pricePerRequest: 0.04,
    initialTrustScore: 85,
    successRate: 97.0,
    averageLatencyMs: 300,
    availability: 99.0,
  });

  const loadServices = () => {
    fetchServices().then((data) => {
      setServices(data);
      if (data.length > 0 && !selectedReputation) {
        fetchReputation(data[0]._id).then(setSelectedReputation);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSelectService = async (serviceId: string) => {
    const rep = await fetchReputation(serviceId);
    setSelectedReputation(rep);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const capsArray = formData.capabilities.split(',').map((c) => c.trim()).filter(Boolean);
      await registerService({
        ...formData,
        pricePerRequest: Number(formData.pricePerRequest),
        initialTrustScore: Number(formData.initialTrustScore),
        trustScore: Number(formData.initialTrustScore),
        successRate: Number(formData.successRate),
        averageLatencyMs: Number(formData.averageLatencyMs),
        availability: Number(formData.availability),
        capabilities: capsArray,
      });
      setShowRegisterModal(false);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to register service');
    } finally {
      setRegistering(false);
    }
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
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl transition flex items-center space-x-2 shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Service</span>
        </button>
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
                    {service.companyName && (
                      <div className="text-[11px] text-sky-400 flex items-center space-x-1 mt-0.5 font-medium">
                        <Building2 className="w-3 h-3" />
                        <span>{service.companyName}</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{service.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {service.capabilities.map((cap, i) => (
                        <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {cap}
                        </span>
                      ))}
                    </div>
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

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <span>Register Machine-Payable Service</span>
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Example AI Labs"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Market Intelligence API"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Service summary and analytical capabilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. research, weather, data"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Price (USDC)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.pricePerRequest}
                    onChange={(e) => setFormData({ ...formData, pricePerRequest: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Capabilities (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. weather, forecast, climate"
                  value={formData.capabilities}
                  onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Initial Trust Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.initialTrustScore}
                    onChange={(e) => setFormData({ ...formData, initialTrustScore: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Success Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.successRate}
                    onChange={(e) => setFormData({ ...formData, successRate: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-sky-500/20"
                >
                  <span>{registering ? 'Registering...' : 'Register Company Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
