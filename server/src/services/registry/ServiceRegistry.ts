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

export function isEndpointValid(endpoint?: string): boolean {
  if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
    return false;
  }
  const ep = endpoint.trim();
  if (ep.includes('10000') || ep.includes('localhost:10000')) {
    return false;
  }
  try {
    const url = new URL(ep);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

export function normalizeEndpoint(endpoint?: string): string {
  const base = getPublicApiUrl();
  if (!endpoint || endpoint.trim() === '') {
    return `${base}/api/research`;
  }
  let ep = endpoint.trim();

  if (ep.includes('10000')) {
    if (ep.includes('sentiment')) {
      return `${base}/api/sentiment`;
    }
    return `${base}/api/research`;
  }

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
    capabilities: ['research', 'ev_battery_research', 'materials_science'],
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
    capabilities: ['research', 'ev_battery_research', 'patent_analysis'],
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
    capabilities: ['research', 'ev_battery_research', 'web_scraping'],
  },
  {
    _id: '60f766740a74b48f2a02a2c5',
    name: 'Sentiment Analytics Pro',
    description: 'Real-time NLP sentiment analysis engine for customer reviews, feedback, and opinion mining.',
    endpoint: `${getPublicApiUrl()}/api/sentiment`,
    category: 'sentiment_analysis',
    pricePerRequest: 0.02, // $0.02 USDC
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 91,
    successRate: 98.0,
    averageLatencyMs: 190,
    availability: 99.5,
    transactionCount: 650,
    status: 'active',
    capabilities: ['sentiment_analysis', 'text_analysis'],
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
    capabilities: ['research', 'ev_battery_research', 'unverified_data'],
  },
];

let inMemoryServices: ServiceItem[] = [...INITIAL_SERVICES];

export async function seedServiceRegistry(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    try {
      // Upsert all initial services to ensure existing MongoDB records are synchronized with INITIAL_SERVICES
      for (const service of INITIAL_SERVICES) {
        const { _id, ...updateData } = service;
        await ServiceModel.updateOne(
          { _id: new mongoose.Types.ObjectId(_id) },
          { $set: updateData },
          { upsert: true }
        );
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
          let caps = d.capabilities || [];
          let cat = d.category || 'research';
          if (d.name && d.name.toLowerCase().includes('sentiment')) {
            caps = ['sentiment_analysis', 'text_analysis'];
            cat = 'sentiment_analysis';
          }
          return {
            ...d,
            _id: d._id.toString(),
            category: cat,
            capabilities: caps,
            endpoint: normalizeEndpoint(d.endpoint),
          };
        });
      }
    } catch (err) {
      // Fallback
    }
  }
  return inMemoryServices.map((d) => {
    let caps = d.capabilities || [];
    let cat = d.category || 'research';
    if (d.name && d.name.toLowerCase().includes('sentiment')) {
      caps = ['sentiment_analysis', 'text_analysis'];
      cat = 'sentiment_analysis';
    }
    return { ...d, category: cat, capabilities: caps, endpoint: normalizeEndpoint(d.endpoint) };
  });
}

export async function getServiceById(id: string): Promise<ServiceItem | null> {
  const all = await getAllServices();
  return all.find((s) => s._id === id || s.name.includes(id)) || null;
}

export async function findServicesByCapability(capability: string): Promise<ServiceItem[]> {
  const all = await getAllServices();
  const capLower = capability.toLowerCase().trim();

  // 1. Filter only active services with valid reachable endpoints
  const activeServices = all.filter((s) => s.status !== 'offline' && isEndpointValid(s.endpoint));

  // 2. Strict capability matching
  const matched = activeServices.filter((s) => {
    const sCaps = (s.capabilities || []).map((c) => c.toLowerCase().trim());
    const sCategory = (s.category || '').toLowerCase().trim();

    // Check exact match in capability list or category
    if (sCaps.includes(capLower) || sCategory === capLower) {
      return true;
    }

    // For ev_battery_research or research queries
    if (capLower === 'ev_battery_research' || capLower === 'research') {
      return sCaps.some((c) => c.includes('ev_battery') || c === 'research' || c === 'ev_battery_research') || sCategory === 'research';
    }

    // For sentiment_analysis
    if (capLower === 'sentiment_analysis' || capLower === 'sentiment') {
      return sCaps.some((c) => c.includes('sentiment')) || sCategory.includes('sentiment');
    }

    // Generic sub-word match if non-empty
    return sCaps.some((c) => c.includes(capLower) || capLower.includes(c));
  });

  if (matched.length > 0) {
    return matched;
  }

  // 3. Category fallback if no capability array matched
  const categoryMatched = activeServices.filter((s) => {
    const sCategory = (s.category || '').toLowerCase().trim();
    if (capLower.includes('research') || capLower.includes('battery')) {
      return sCategory === 'research';
    }
    if (capLower.includes('sentiment')) {
      return sCategory.includes('sentiment');
    }
    return false;
  });

  if (categoryMatched.length > 0) {
    return categoryMatched;
  }

  // 4. Safe fallback: return active research services only when capability is research-oriented
  if (capLower.includes('research') || capLower.includes('battery') || capLower === 'general') {
    return activeServices.filter((s) => (s.category || '').toLowerCase() === 'research');
  }

  return activeServices;
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
