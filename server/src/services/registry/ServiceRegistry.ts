import mongoose from 'mongoose';
import { ServiceModel } from '../../models/Service.js';
import { ServiceItem } from '@trustx/shared';
import { env } from '../../config/env.js';

const PORT = env.PORT || 5000;

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    _id: '60f766740a74b48f2a02a2c1',
    name: 'Research Core Ultra (Service C)',
    description: 'High-speed, top-tier research provider for battery technologies, EV systems, and materials science.',
    endpoint: `http://127.0.0.1:${PORT}/api/research`,
    category: 'research',
    pricePerRequest: 0.03, // $0.03 USDC
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 97,
    successRate: 99.5,
    averageLatencyMs: 250,
    availability: 99.9,
    transactionCount: 1842,
    status: 'active',
    capabilities: ['ev_battery_research', 'materials_science', 'market_intelligence'],
  },
  {
    _id: '60f766740a74b48f2a02a2c2',
    name: 'DeepSearch Pro (Service A)',
    description: 'Comprehensive academic research engine with high reliability.',
    endpoint: `http://127.0.0.1:${PORT}/api/research`,
    category: 'research',
    pricePerRequest: 0.05, // $0.05 USDC
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 94,
    successRate: 97.8,
    averageLatencyMs: 300,
    availability: 98.5,
    transactionCount: 920,
    status: 'active',
    capabilities: ['ev_battery_research', 'patent_analysis'],
  },
  {
    _id: '60f766740a74b48f2a02a2c3',
    name: 'QuickResearch Lite (Service B)',
    description: 'Economy research provider with moderate latency and acceptable accuracy.',
    endpoint: `http://127.0.0.1:${PORT}/api/research`,
    category: 'research',
    pricePerRequest: 0.02, // $0.02 USDC
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 72,
    successRate: 88.0,
    averageLatencyMs: 900,
    availability: 91.0,
    transactionCount: 410,
    status: 'active',
    capabilities: ['ev_battery_research', 'web_scraping'],
  },
  {
    _id: '60f766740a74b48f2a02a2c4',
    name: 'Unverified Shadow Data (Unsafe Service X)',
    description: 'High-risk external endpoint flagged for suspicious instruction patterns and low reputation.',
    endpoint: `http://127.0.0.1:${PORT}/api/research`,
    category: 'research',
    pricePerRequest: 0.80, // Exceeds budget limit
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 31,
    successRate: 42.0,
    averageLatencyMs: 2500,
    availability: 65.0,
    transactionCount: 14,
    status: 'degraded',
    capabilities: ['ev_battery_research', 'unverified_data'],
  },
];

let inMemoryServices: ServiceItem[] = [...INITIAL_SERVICES];

export async function seedServiceRegistry(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    try {
      const count = await ServiceModel.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding Service Registry with initial services in MongoDB...');
        await ServiceModel.insertMany(INITIAL_SERVICES);
        console.log('✅ Service Registry seeded successfully.');
      }
    } catch (e: any) {
      console.warn('⚠️ Service seeding using fallback in-memory store:', e.message);
    }
  }
}

export async function getAllServices(): Promise<ServiceItem[]> {
  await seedServiceRegistry();
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await ServiceModel.find().lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({ ...d, _id: d._id.toString() }));
      }
    } catch (err) {
      // Fallback
    }
  }
  return inMemoryServices;
}

export async function getServiceById(id: string): Promise<ServiceItem | null> {
  const all = await getAllServices();
  return all.find((s) => s._id === id || s.name.includes(id)) || null;
}

export async function findServicesByCapability(capability: string): Promise<ServiceItem[]> {
  const all = await getAllServices();
  return all.filter(
    (s) =>
      s.status !== 'offline' &&
      (s.category.toLowerCase() === capability.toLowerCase() ||
        s.capabilities.some((c) => c.toLowerCase().includes(capability.toLowerCase())))
  );
}
