import mongoose, { Schema, Document } from 'mongoose';
import { AgentRun } from '@trustx/shared';

export interface IAgentRunDocument extends Omit<AgentRun, '_id'>, Document {}

const AgentRunSchema = new Schema<IAgentRunDocument>(
  {
    agentId: { type: String, required: true },
    userRequest: { type: String, required: true },
    steps: [
      {
        stepIndex: Number,
        title: String,
        description: String,
        status: String,
        timestamp: String,
        data: Schema.Types.Mixed,
      },
    ],
    selectedService: Schema.Types.Mixed,
    paymentStatus: {
      type: String,
      enum: ['none', 'pending', 'signed', 'settled', 'blocked', 'failed'],
      default: 'none',
    },
    result: Schema.Types.Mixed,
    transactionId: String,
    startedAt: { type: String, required: true },
    completedAt: String,
  },
  { timestamps: true }
);

export const AgentRunModel = mongoose.model<IAgentRunDocument>('AgentRun', AgentRunSchema);
