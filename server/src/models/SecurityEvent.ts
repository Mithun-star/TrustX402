import mongoose, { Schema, Document } from 'mongoose';
import { SecurityEventRecord } from '@trustx/shared';

export interface ISecurityEventDocument extends Omit<SecurityEventRecord, '_id'>, Document {}

const SecurityEventSchema = new Schema<ISecurityEventDocument>(
  {
    agentId: { type: String, required: true },
    serviceId: { type: String },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    decision: { type: String, required: true },
    reasons: [{ type: String }],
    userPrompt: { type: String },
    timestamp: { type: String, required: true },
  },
  { timestamps: true }
);

export const SecurityEventModel = mongoose.model<ISecurityEventDocument>('SecurityEvent', SecurityEventSchema);
