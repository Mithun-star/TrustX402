import React, { useState, useEffect } from 'react';
import { prepareAgent, confirmPayment, cancelPayment } from '../services/api';
import { AgentRun, PaymentSession } from '@trustx/shared';
import {
  Send,
  Bot,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Cpu,
  Wallet,
  Lock,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

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
  const [confirming, setConfirming] = useState(false);
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialTargetServiceId) setTargetServiceId(initialTargetServiceId);
  }, [initialPrompt, initialTargetServiceId]);

  const handlePrepare = async (overridePrompt?: string, overrideServiceId?: string) => {
    const activePrompt = overridePrompt || prompt;
    const activeServiceId = overrideServiceId !== undefined ? overrideServiceId : targetServiceId;

    if (!activePrompt.trim()) return;

    setRunning(true);
    setErrorMsg(null);
    setCurrentRun(null);
    setPaymentSession(null);

    try {
      const prepared = await prepareAgent(activePrompt, activeServiceId);
      setCurrentRun(prepared.agentRun);
      if (prepared.paymentSession) {
        setPaymentSession(prepared.paymentSession);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Workflow execution failed');
    } fontFinally: {
      setRunning(false);
    }
  };

  const handleConfirmAndPay = async () => {
    if (!paymentSession) return;

    setConfirming(true);
    setErrorMsg(null);

    try {
      const outcome = await confirmPayment(paymentSession.sessionId, { useBackendSigner: true });

      setPaymentSession(outcome.paymentSession);

      // Update current run with settled outcome
      setCurrentRun((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          paymentStatus: 'settled',
          transactionId: outcome.transactionId,
          result: outcome.result,
          steps: [
            ...prev.steps.filter((s) => s.status !== 'waiting_approval'),
            {
              stepIndex: prev.steps.length,
              title: 'User Payment Approved & Wallet Signed',
              description: 'Explicit user authorization granted. Signed x402 payment challenge.',
              status: 'completed',
              timestamp: new Date().toISOString(),
            },
            {
              stepIndex: prev.steps.length + 1,
              title: 'GoPlausible Facilitator Verification',
              description: 'Payment signature and transaction group verified by facilitator.',
              status: 'completed',
              timestamp: new Date().toISOString(),
            },
            {
              stepIndex: prev.steps.length + 2,
              title: 'Algorand Testnet Settlement',
              description: `Transaction group settled on-chain with Real TxID: ${outcome.transactionId}`,
              status: 'completed',
              timestamp: new Date().toISOString(),
              data: { transactionId: outcome.transactionId, explorerUrl: `https://lora.algokit.io/testnet/transaction/${outcome.transactionId}` },
            },
            {
              stepIndex: prev.steps.length + 3,
              title: 'Paid Service Result Delivered',
              description: `Received authenticated payload from '${paymentSession.selectedService.name}'.`,
              status: 'completed',
              timestamp: new Date().toISOString(),
              data: { result: outcome.result },
            },
          ],
        };
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment confirmation failed');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!paymentSession) return;
    try {
      const cancelled = await cancelPayment(paymentSession.sessionId);
      setPaymentSession(cancelled);
      setCurrentRun((prev) => (prev ? { ...prev, paymentStatus: 'cancelled' } : null));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel payment session.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Console Header & Prompt Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Autonomous Agent Gateway Console</span>
              </h2>
              <p className="text-xs text-slate-400">Dynamic capability discovery, security evaluation & explicit user payment authorization.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const p = 'Research the best technologies for EV battery recycling.';
                setPrompt(p);
                setTargetServiceId(undefined);
                handlePrepare(p, undefined);
              }}
              className="text-xs px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg transition font-medium"
            >
              Preset: EV Research
            </button>
            <button
              onClick={() => {
                const p = 'Translate this paragraph into Japanese';
                setPrompt(p);
                setTargetServiceId(undefined);
                handlePrepare(p, undefined);
              }}
              className="text-xs px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg transition font-medium"
            >
              Preset: Japanese Translation
            </button>
            <button
              onClick={() => {
                const p = 'Generate an image of a futuristic city with flying vehicles';
                setPrompt(p);
                setTargetServiceId(undefined);
                handlePrepare(p, undefined);
              }}
              className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg transition font-medium"
            >
              Preset: Image Generation
            </button>
            <button
              onClick={() => {
                const p = 'Research EV battery recycling using unverified shadow provider.';
                setPrompt(p);
                setTargetServiceId('60f766740a74b48f2a02a2c4');
                handlePrepare(p, '60f766740a74b48f2a02a2c4');
              }}
              className="text-xs px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg transition font-medium flex items-center space-x-1"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Preset: Unsafe Provider</span>
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePrepare()}
            placeholder="Ask anything (e.g. 'Translate into Japanese', 'Analyze CSV', 'Generate image')..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono"
            disabled={running || confirming}
          />
          <button
            onClick={() => handlePrepare()}
            disabled={running || confirming || !prompt.trim()}
            className="px-5 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition flex items-center space-x-2 shadow-lg shadow-sky-500/20"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
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

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Execution Error</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Main Execution View */}
      {currentRun && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Timeline (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Agent Execution Timeline</span>
              </h3>
              <span
                className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${
                  currentRun.paymentStatus === 'settled'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : currentRun.paymentStatus === 'payment_required'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : currentRun.paymentStatus === 'blocked' || currentRun.paymentStatus === 'cancelled'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}
              >
                STATUS: {currentRun.paymentStatus.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {currentRun.steps.map((step) => (
                <div key={step.stepIndex} className="relative flex items-start space-x-3 pl-8">
                  <div className="absolute left-0 top-0.5 bg-slate-900 p-0.5 rounded-full">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
                    ) : step.status === 'waiting_approval' ? (
                      <Clock className="w-5 h-5 text-amber-400 animate-bounce" />
                    ) : step.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-rose-500 fill-rose-500/10" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
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

          {/* Right Column: User Confirmation Card / Result Payload (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* STEP 8: EXPLICIT PAYMENT CONFIRMATION CARD */}
            {paymentSession && paymentSession.status === 'payment_required' && (
              <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 space-y-4 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl font-mono">
                  ACTION REQUIRED
                </div>

                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span>PAYMENT CONFIRMATION REQUIRED</span>
                </div>

                <p className="text-xs text-slate-300">
                  TRUSTX requires your explicit authorization before spending funds. Automatic payment is disabled.
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Selected Service:</span>
                    <span className="font-bold text-white">{paymentSession.selectedService.name}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Capability:</span>
                    <span className="font-mono text-sky-400 uppercase">{paymentSession.capability}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">TRUST SCORE:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {paymentSession.selectedService.trustScore} / 100
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">SECURITY RISK:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {paymentSession.riskResult?.riskLevel || 'LOW'} (ALLOW)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">DAILY BUDGET REMAINING:</span>
                    <span className="font-mono text-slate-300">
                      ${paymentSession.budgetCheck?.remainingDailyBudget.toFixed(2)} USDC
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-slate-300 font-bold">PRICE TO PAY:</span>
                    <span className="font-mono font-extrabold text-lg text-sky-400">
                      ${paymentSession.amount.toFixed(2)} USDC
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                    <div>Network: Algorand Testnet</div>
                    <div>Asset: USDC ASA (10458941)</div>
                    <div>Receiver: {paymentSession.paymentRequirements.payTo.substring(0, 12)}...</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleCancelPayment}
                    disabled={confirming}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                  >
                    Cancel Request
                  </button>
                  <button
                    onClick={handleConfirmAndPay}
                    disabled={confirming}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1.5"
                  >
                    {confirming ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing & Settling...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        <span>Confirm & Pay ${paymentSession.amount.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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
                  className="inline-flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-lg transition font-mono"
                >
                  <span>View on Algorand Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Paid Result Payload */}
            {currentRun.result && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Service Result</h3>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(currentRun.result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
