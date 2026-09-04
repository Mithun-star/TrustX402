import React, { useState, useEffect } from 'react';
import { runAgent } from '../services/api';
import { AgentRun } from '@trustx/shared';
import { Send, Bot, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Cpu } from 'lucide-react';

interface AgentConsolePageProps {
  initialPrompt?: string;
  initialTargetServiceId?: string;
}

export const AgentConsolePage: React.FC<AgentConsolePageProps> = ({
  initialPrompt = 'Research the best technologies for EV battery recycling.',
  initialTargetServiceId,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [targetServiceId, setTargetServiceId] = useState<string | undefined>(initialTargetServiceId);
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialTargetServiceId) setTargetServiceId(initialTargetServiceId);
  }, [initialPrompt, initialTargetServiceId]);

  const handleRun = async (overridePrompt?: string, overrideServiceId?: string) => {
    const activePrompt = overridePrompt || prompt;
    const activeServiceId = overrideServiceId !== undefined ? overrideServiceId : targetServiceId;

    if (!activePrompt.trim()) return;

    setRunning(true);
    setErrorMsg(null);
    setCurrentRun(null);

    const newHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: activePrompt },
    ];

    try {
      const run = await runAgent(activePrompt, activeServiceId, newHistory);
      setCurrentRun(run);
      if (run.result?.summary) {
        setConversationHistory([
          ...newHistory,
          { role: 'assistant' as const, content: run.result.summary },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Workflow execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Console Header & Prompt Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Autonomous Agent Execution Console</span>
              </h2>
              <p className="text-xs text-slate-400">Execute capabilities using TRUSTX trust, risk, budget & payment routing.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setPrompt('Research the best technologies for EV battery recycling.');
                setTargetServiceId(undefined);
                handleRun('Research the best technologies for EV battery recycling.', undefined);
              }}
              className="text-xs px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg transition font-medium"
            >
              Preset: Safe EV Battery Research
            </button>
            <button
              onClick={() => {
                setPrompt('Research EV battery recycling using unverified shadow provider.');
                setTargetServiceId('Unverified Shadow Data (Unsafe Service X)');
                handleRun('Research EV battery recycling using unverified shadow provider.', 'Unverified Shadow Data (Unsafe Service X)');
              }}
              className="text-xs px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg transition font-medium flex items-center space-x-1"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Preset: Unsafe Low-Trust Provider</span>
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder="Ask the AI agent anything (e.g. 'Compare MongoDB and PostgreSQL', 'Find a weather API')..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono"
            disabled={running}
          />
          <button
            onClick={() => handleRun()}
            disabled={running || !prompt.trim()}
            className="px-5 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition flex items-center space-x-2 shadow-lg shadow-sky-500/20"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <span>Execute Agent</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Execution Output */}
      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Execution Error</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {currentRun && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Granular Timeline (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Agent Execution Timeline</span>
              </h3>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${
                currentRun.paymentStatus === 'settled'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : currentRun.paymentStatus === 'blocked'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                STATUS: {currentRun.paymentStatus.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {currentRun.steps.map((step) => (
                <div key={step.stepIndex} className="relative flex items-start space-x-3 pl-8">
                  {/* Circle status icon */}
                  <div className="absolute left-0 top-0.5 bg-slate-900 p-0.5 rounded-full">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
                    ) : step.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-rose-500 fill-rose-500/10" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{step.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{step.description}</p>

                    {step.data && (
                      <div className="mt-2 p-2 bg-slate-900/90 border border-slate-800 rounded text-[11px] font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Payment & Result Synthesis (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Selected Service Card */}
            {currentRun.selectedService && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Routed Service</h3>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{currentRun.selectedService.name}</span>
                  <span className="text-sm font-mono font-bold text-sky-400">${currentRun.selectedService.pricePerRequest?.toFixed(2)} USDC</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TRUST SCORE</span>
                    <span className="text-emerald-400 font-bold">{currentRun.selectedService.trustScore} / 100</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">LATENCY</span>
                    <span className="text-sky-300">{currentRun.selectedService.averageLatencyMs}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* Blockchain Settlement Card */}
            {currentRun.transactionId && (
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Algorand Testnet Settlement Verified</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div><span className="text-slate-500">Asset:</span> <span className="font-mono text-white">USDC ASA (10458941)</span></div>
                  <div><span className="text-slate-500">Protocol:</span> <span className="font-mono text-white">x402 HTTP Payment</span></div>
                  <div className="break-all"><span className="text-slate-500">TxID:</span> <span className="font-mono text-sky-400 text-[11px]">{currentRun.transactionId}</span></div>
                </div>
                <a
                  href={`https://lora.algokit.io/testnet/transaction/${currentRun.transactionId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-lg transition"
                >
                  <span>View on Algorand Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Final Research Payload Synthesis */}
            {currentRun.result && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Research Payload</h3>
                <div className="text-xs text-slate-300 space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {currentRun.result.summary}
                  </div>

                  {currentRun.result.keyFindings && (
                    <div>
                      <div className="text-xs font-bold text-white mb-1.5">Key Research Findings:</div>
                      <ul className="space-y-1 pl-4 list-disc text-slate-400">
                        {currentRun.result.keyFindings.map((finding: string, i: number) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
