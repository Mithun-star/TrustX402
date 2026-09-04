import mongoose from 'mongoose';
import { ServiceModel } from '../../models/Service.js';
import { ServiceItem } from '@trustx/shared';
import { env } from '../../config/env.js';

export function getPublicApiUrl(): string {
  if (env.PUBLIC_API_URL && env.PUBLIC_API_URL.trim() !== '') {
    return env.PUBLIC_API_URL.replace(/\/+$/, '');
  }
  return `http://127.0.0.1:${env.PORT || 5000}`;
}

export function normalizeEndpoint(endpoint?: string): string {
  const base = getPublicApiUrl();
  if (!endpoint || endpoint.trim() === '') {
    return `${base}/api/research`;
  }
  let ep = endpoint.trim();
  if (ep.startsWith('/')) {
    return `${base}${ep}`;
  }
  if (ep.match(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i)) {
    const urlPath = ep.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i, '');
    return `${base}${urlPath || '/api/research'}`;
  }
  return ep;
}

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    _id: '60f766740a74b48f2a02a2c1',
    name: 'Research Core Ultra (Service C)',
    description: 'High-speed, top-tier research provider for battery technologies, EV systems, and materials science.',
    endpoint: `${getPublicApiUrl()}/api/research`,
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
    endpoint: `${getPublicApiUrl()}/api/research`,
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
    endpoint: `${getPublicApiUrl()}/api/research`,
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
    endpoint: `${getPublicApiUrl()}/api/research`,
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
        return docs.map((d: any) => {
          return { ...d, _id: d._id.toString(), endpoint: normalizeEndpoint(d.endpoint) };
        });
      }
    } catch (err) {
      // Fallback
    }
  }
  return inMemoryServices.map((d) => {
    return { ...d, endpoint: normalizeEndpoint(d.endpoint) };
  });
}

export async function getServiceById(id: string): Promise<ServiceItem | null> {
  const all = await getAllServices();
  return all.find((s) => s._id === id || s.name.includes(id)) || null;
}

export async function findServicesByCapability(capability: string): Promise<ServiceItem[]> {
  const all = await getAllServices();
  const capLower = capability.toLowerCase().trim();
  const keywords = capLower.split(/[\s,_\-+]+/);

  const matched = all.filter((s) => {
    if (s.status === 'offline') return false;
    const catMatch = s.category.toLowerCase().includes(capLower);
    const capMatch = s.capabilities.some((c) =>
      keywords.some((kw) => c.toLowerCase().includes(kw) || kw.includes(c.toLowerCase()))
    );
    const nameMatch = keywords.some((kw) => s.name.toLowerCase().includes(kw));
    const descMatch = keywords.some((kw) => s.description.toLowerCase().includes(kw));
    return catMatch || capMatch || nameMatch || descMatch;
  });

  if (matched.length > 0) return matched;

  // Fallback: If no exact capability match, return all active services for multi-attribute router evaluation
  return all.filter((s) => s.status !== 'offline');
}

export async function registerNewService(serviceData: Partial<ServiceItem>): Promise<ServiceItem> {
  const initialScore = serviceData.initialTrustScore ?? serviceData.trustScore ?? 85;
  const newService: ServiceItem = {
    _id: serviceData._id || `service-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: serviceData.name || 'Custom Machine Service',
    companyName: serviceData.companyName || 'Registered Provider Labs',
    description: serviceData.description || 'Custom machine-payable API service registered with TRUSTX.',
    endpoint: normalizeEndpoint(serviceData.endpoint),
    category: serviceData.category || 'research',
    pricePerRequest: typeof serviceData.pricePerRequest === 'number' ? serviceData.pricePerRequest : 0.03,
    currency: serviceData.currency || 'USDC',
    network: serviceData.network || 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: initialScore,
    initialTrustScore: initialScore,
    successRate: typeof serviceData.successRate === 'number' ? serviceData.successRate : 97.0,
    averageLatencyMs: typeof serviceData.averageLatencyMs === 'number' ? serviceData.averageLatencyMs : 300,
    availability: typeof serviceData.availability === 'number' ? serviceData.availability : 99.0,
    transactionCount: typeof serviceData.transactionCount === 'number' ? serviceData.transactionCount : 1,
    status: serviceData.status || 'active',
    capabilities: Array.isArray(serviceData.capabilities) && serviceData.capabilities.length > 0
      ? serviceData.capabilities
      : [serviceData.category || 'research'],
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const { _id, ...docData } = newService;
      const doc = new ServiceModel(docData);
      const saved = await doc.save();
      const formatted: ServiceItem = { ...saved.toObject(), _id: saved._id.toString() };
      inMemoryServices.unshift(formatted);
      return formatted;
    } catch (e: any) {
      console.warn('⚠️ Could not save service to MongoDB, using in-memory store:', e.message);
    }
  }

  inMemoryServices.unshift(newService);
  return newService;
}
