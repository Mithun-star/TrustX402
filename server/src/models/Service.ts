import mongoose, { Schema, Document } from 'mongoose';
import { ServiceItem } from '@trustx/shared';

export interface IServiceDocument extends Omit<ServiceItem, '_id'>, Document {}

const ServiceSchema = new Schema<IServiceDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    endpoint: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['research', 'translation', 'data', 'compute', 'storage', 'ai', 'media', 'code', 'document'],
    },
    pricePerRequest: { type: Number, required: true },
    currency: { type: String, default: 'USDC' },
    network: { type: String, default: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=' },
    trustScore: { type: Number, required: true, min: 0, max: 100 },
    successRate: { type: Number, required: true, min: 0, max: 100 },
    averageLatencyMs: { type: Number, required: true },
    availability: { type: Number, required: true, min: 0, max: 100 },
    transactionCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'degraded', 'offline'], default: 'active' },
    capabilities: [{ type: String }],
    provider: { type: String, default: 'TRUSTX Demo Network' },
    paymentProtocol: { type: String, default: 'x402' },
    paymentAsset: { type: String, default: 'USDC ASA (10458941)' },
    requiresPayment: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ServiceModel = mongoose.model<IServiceDocument>('Service', ServiceSchema);
