import mongoose from 'mongoose';
import { TransactionModel } from '../../models/Transaction.js';
import { TransactionRecord } from '@trustx/shared';

const inMemoryTransactions: TransactionRecord[] = [];

export async function createTransactionRecord(
  data: Partial<TransactionRecord>
): Promise<TransactionRecord> {
  const record: TransactionRecord = {
    _id: `tx-doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    agentId: data.agentId || 'research-agent-1',
    serviceId: data.serviceId || 'service-c',
    serviceName: data.serviceName || 'Research Core Ultra',
    amount: data.amount || 0.03,
    asset: data.asset || 'USDC',
    network: data.network || 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    x402Status: data.x402Status || '200 OK',
    settlementStatus: data.settlementStatus || 'SETTLED',
    blockchainTransactionId: data.blockchainTransactionId || `tx-${Date.now()}`,
    payerAddress: data.payerAddress || '0xTESTNET_PAYER',
    receiverAddress: data.receiverAddress || '0xTESTNET_RECEIVER',
    timestamp: new Date().toISOString(),
    responseStatus: data.responseStatus || 200,
    explorerUrl: data.blockchainTransactionId
      ? `https://lora.algokit.io/testnet/transaction/${data.blockchainTransactionId}`
      : undefined,
  };

  inMemoryTransactions.unshift(record);

  if (mongoose.connection.readyState === 1) {
    try {
      const { _id, ...docData } = record;
      const doc = new TransactionModel(docData);
      await doc.save();
    } catch (e: any) {
      console.warn('⚠️ Saved transaction to in-memory fallback store:', e.message);
    }
  }

  return record;
}

export async function getAllTransactions(): Promise<TransactionRecord[]> {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await TransactionModel.find().sort({ createdAt: -1 }).lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({ ...d, _id: d._id.toString() }));
      }
    } catch (err) {
      // Fallback
    }
  }
  return inMemoryTransactions;
}

export async function getTransactionById(id: string): Promise<TransactionRecord | null> {
  const all = await getAllTransactions();
  return all.find((t) => t._id === id || t.blockchainTransactionId === id) || null;
}
