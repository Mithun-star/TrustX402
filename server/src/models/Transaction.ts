import mongoose, { Schema, Document } from 'mongoose';
import { TransactionRecord } from '@trustx/shared';

export interface ITransactionDocument extends Omit<TransactionRecord, '_id'>, Document {}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    agentId: { type: String, required: true },
    serviceId: { type: String, required: true },
    serviceName: { type: String },
    amount: { type: Number, required: true },
    asset: { type: String, default: 'USDC' },
    network: { type: String, required: true },
    x402Status: { type: String, required: true },
    settlementStatus: { type: String, required: true },
    blockchainTransactionId: { type: String, required: true },
    payerAddress: { type: String },
    receiverAddress: { type: String },
    timestamp: { type: String, required: true },
    responseStatus: { type: Number, required: true },
    explorerUrl: { type: String },
  },
  { timestamps: true }
);

export const TransactionModel = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);
