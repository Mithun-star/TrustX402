import mongoose from 'mongoose';
import { SecurityEventModel } from '../../models/SecurityEvent.js';
import { SecurityEventRecord } from '@trustx/shared';

const inMemorySecurityEvents: SecurityEventRecord[] = [];

export async function createSecurityEvent(
  data: Partial<SecurityEventRecord>
): Promise<SecurityEventRecord> {
  const record: SecurityEventRecord = {
    _id: `sec-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    agentId: data.agentId || 'research-agent-1',
    serviceId: data.serviceId || 'unknown',
    riskScore: data.riskScore ?? 0,
    riskLevel: data.riskLevel || 'LOW',
    decision: data.decision || 'ALLOW',
    reasons: data.reasons || [],
    userPrompt: data.userPrompt || '',
    timestamp: new Date().toISOString(),
  };

  inMemorySecurityEvents.unshift(record);

  if (mongoose.connection.readyState === 1) {
    try {
      const { _id, ...docData } = record;
      const doc = new SecurityEventModel(docData);
      await doc.save();
    } catch (e: any) {
      console.warn('⚠️ Saved security event to in-memory fallback store:', e.message);
    }
  }

  return record;
}

export async function getAllSecurityEvents(): Promise<SecurityEventRecord[]> {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await SecurityEventModel.find().sort({ createdAt: -1 }).lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({ ...d, _id: d._id.toString() }));
      }
    } catch (err) {
      // Fallback
    }
  }
  return inMemorySecurityEvents;
}
