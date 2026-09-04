import mongoose, { Schema, Document } from 'mongoose';
import { ServiceItem } from '@trustx/shared';

export interface IServiceDocument extends Omit<ServiceItem, '_id'>, Document {}

const ServiceSchema = new Schema<IServiceDocument>(
  {
    name: { type: String, required: true, unique: true },
    companyName: { type: String },
    description: { type: String, required: true },
    endpoint: { type: String, required: true },
    category: { type: String, required: true },
    pricePerRequest: { type: Number, required: true },
    currency: { type: String, default: 'USDC' },
    network: { type: String, default: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=' },
    trustScore: { type: Number, required: true, min: 0, max: 100 },
    initialTrustScore: { type: Number, min: 0, max: 100 },
    successRate: { type: Number, required: true, min: 0, max: 100 },
    averageLatencyMs: { type: Number, required: true },
    availability: { type: Number, required: true, min: 0, max: 100 },
    transactionCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'degraded', 'offline'], default: 'active' },
    capabilities: [{ type: String }],
  },
  { timestamps: true }
);

export const ServiceModel = mongoose.model<IServiceDocument>('Service', ServiceSchema);
