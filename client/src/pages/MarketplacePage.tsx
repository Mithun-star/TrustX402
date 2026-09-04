import React, { useEffect, useState } from 'react';
import { fetchServices, fetchReputation, registerNewService } from '../services/api';
import { ServiceItem, ReputationResult } from '@trustx/shared';
import { Store, ShieldCheck, Search, PlusCircle, Filter, Sparkles, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface MarketplacePageProps {
  onUseService?: (prompt: string, serviceId: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onUseService }) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedReputation, setSelectedReputation] = useState<ReputationResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'trust' | 'price' | 'latency' | 'reliability'>('trust');

  // Register Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regEndpoint, setRegEndpoint] = useState('');
  const [regCategory, setRegCategory] = useState<ServiceItem['category']>('ai');
  const [regCapabilities, setRegCapabilities] = useState('');
  const [regPrice, setRegPrice] = useState('0.03');
  const [regProvider, setRegProvider] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  const loadServices = async () => {
    setLoading(true);
    const data = await fetchServices();
    setServices(data);
    if (data.length > 0 && !selectedReputation) {
      fetchReputation(data[0]._id).then(setSelectedReputation);
    }
    setLoading(false);
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
    setRegError(null);
    setRegSuccessMsg(null);

    try {
      const caps = regCapabilities.split(',').map((c) => c.trim()).filter(Boolean);
      const priceNum = parseFloat(regPrice);

      if (!regName || !regEndpoint || caps.length === 0 || isNaN(priceNum)) {
        throw new Error('Please fill in name, endpoint, price, and at least one capability.');
      }

      await registerNewService({
        name: regName,
        description: regDescription,
        endpoint: regEndpoint,
        category: regCategory,
        capabilities: caps,
        pricePerRequest: priceNum,
        provider: regProvider || 'Third-Party Machine-Payable Service',
      });

      setRegSuccessMsg(`Service '${regName}' registered successfully!`);
      setShowRegisterModal(false);
      setRegName('');
      setRegDescription('');
      setRegEndpoint('');
      setRegCapabilities('');
      loadServices();
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    }
  };

  const filteredServices = services
    .filter((service) => {
      const matchSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || service.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'trust') return b.trustScore - a.trustScore;
      if (sortBy === 'price') return a.pricePerRequest - b.pricePerRequest;
      if (sortBy === 'latency') return a.averageLatencyMs - b.averageLatencyMs;
      if (sortBy === 'reliability') return b.successRate - a.successRate;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Machine-Payable Service Marketplace</span>
          </div>
          <h2 className="text-xl font-bold text-white">Extensible Service Registry</h2>
          <p className="text-xs text-slate-400 mt-1">Discover, evaluate and register x402-supported machine services on Algorand Testnet.</p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-2 shadow-lg shadow-sky-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Service</span>
        </button>
      </div>

      {regSuccessMsg && (
        <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-xl text-emerald-200 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{regSuccessMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, capability (e.g. 'translation', 'data_analysis')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition font-mono"
          >
            <option value="all">All Categories</option>
            <option value="research">Research</option>
            <option value="translation">Translation</option>
            <option value="data">Data Analytics</option>
            <option value="media">Media & Image</option>
            <option value="code">Code & Audit</option>
            <option value="document">Document Processing</option>
            <option value="ai">Artificial Intelligence</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition font-mono"
          >
            <option value="trust">Sort by Trust Score</option>
            <option value="price">Sort by Lowest Price</option>
            <option value="latency">Sort by Lowest Latency</option>
            <option value="reliability">Sort by Success Rate</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Services List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {filteredServices.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No machine-payable services match your filter search.
            </div>
          ) : (
            filteredServices.map((service) => {
              const isSelected = selectedReputation?.serviceId === service._id;
              return (
                <div
                  key={service._id}
                  onClick={() => handleSelectService(service._id)}
                  className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-base">{service.name}</span>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                            service.trustScore >= 90
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : service.trustScore >= 70
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          Trust {service.trustScore}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{service.description}</p>
                      {service.provider && (
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Provider: {service.provider}</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-sky-400 font-mono">${service.pricePerRequest.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 block">USDC / req</span>
                    </div>
                  </div>

                  {/* Capabilities Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {service.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded-md"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono items-center">
                    <div>
                      <span className="text-slate-500 block text-[10px]">SUCCESS</span>
                      <span className="text-white font-semibold">{service.successRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">LATENCY</span>
                      <span className="text-slate-300">{service.averageLatencyMs}ms</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">AVAILABILITY</span>
                      <span className="text-emerald-400 font-semibold">{service.availability}%</span>
                    </div>
                    <div className="text-right">
                      {onUseService && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUseService(`Test request for ${service.name}`, service._id);
                          }}
                          className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-sans font-semibold transition"
                        >
                          Use Service
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reputation Breakdown (5 cols) */}
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

      {/* REGISTER NEW SERVICE MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-sky-400 text-sm font-bold">
              <PlusCircle className="w-5 h-5 text-sky-400" />
              <span>Register Machine-Payable Service</span>
            </div>

            <p className="text-xs text-slate-400">
              Add your machine service to the TRUSTX Service Registry. Services advertise capabilities and receive x402 payments on Algorand Testnet.
            </p>

            {regError && (
              <div className="bg-rose-950/60 border border-rose-800 p-3 rounded-xl text-rose-200 text-xs">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Quantum Analytics API"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description</label>
                <textarea
                  value={regDescription}
                  onChange={(e) => setRegDescription(e.target.value)}
                  placeholder="Service summary and capability details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Endpoint *</label>
                  <input
                    type="text"
                    required
                    value={regEndpoint}
                    onChange={(e) => setRegEndpoint(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  >
                    <option value="research">Research</option>
                    <option value="translation">Translation</option>
                    <option value="data">Data Analytics</option>
                    <option value="media">Media & Image</option>
                    <option value="code">Code & Audit</option>
                    <option value="document">Document Processing</option>
                    <option value="ai">Artificial Intelligence</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Capabilities (comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={regCapabilities}
                  onChange={(e) => setRegCapabilities(e.target.value)}
                  placeholder="e.g. quantum_computing, statistics, research"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Price per Request (USDC) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={regPrice}
                    onChange={(e) => setRegPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Provider Name</label>
                  <input
                    type="text"
                    value={regProvider}
                    onChange={(e) => setRegProvider(e.target.value)}
                    placeholder="e.g. Quantum Labs Inc"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 text-slate-950 font-bold rounded-xl hover:bg-sky-400 transition"
                >
                  Register Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
