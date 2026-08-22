import React, { useEffect, useState } from 'react';
import { fetchTransactions } from '../services/api';
import { TransactionRecord } from '@trustx/shared';
import { History, ExternalLink, CheckCircle2, ArrowUpRight } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions().then((data) => {
      setTransactions(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>On-Chain Settlement Ledger</span>
          </div>
          <h2 className="text-xl font-bold text-white">Algorand Testnet Transactions</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time payment settlements verified and settled via x402 GoPlausible Facilitator.</p>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading Transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No settled transactions found. Trigger an agent workflow to generate real x402 payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Agent ID</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Asset / Network</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-400 font-sans text-xs">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-sky-300 font-semibold">{tx.agentId}</td>
                    <td className="p-4 text-white font-sans font-medium">{tx.serviceName || tx.serviceId}</td>
                    <td className="p-4 font-bold text-emerald-400">${tx.amount.toFixed(2)}</td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {tx.asset} (ASA 10458941)
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{tx.settlementStatus}</span>
                      </span>
                    </td>
                    <td className="p-4 text-sky-400 max-w-[200px] truncate text-[11px]">
                      {tx.blockchainTransactionId}
                    </td>
                    <td className="p-4 text-right font-sans">
                      <a
                        href={tx.explorerUrl || `https://lora.algokit.io/testnet/transaction/${tx.blockchainTransactionId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1 rounded-lg transition"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
