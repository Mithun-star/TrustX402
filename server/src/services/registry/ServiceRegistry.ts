import mongoose from 'mongoose';
import { ServiceModel } from '../../models/Service.js';
import { ServiceItem, ServiceRegistrationPayload } from '@trustx/shared';
import { env } from '../../config/env.js';

const PORT = env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    _id: '60f766740a74b48f2a02a2c1',
    name: 'Research Core Ultra',
    description: 'High-speed, top-tier research provider for EV battery technologies, materials science, and clean energy.',
    endpoint: `${BASE_URL}/api/research`,
    category: 'research',
    pricePerRequest: 0.03,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 97,
    successRate: 99.5,
    averageLatencyMs: 250,
    availability: 99.9,
    transactionCount: 1842,
    status: 'active',
    capabilities: ['research', 'ev_battery_research', 'materials_science', 'market_intelligence', 'academic_search'],
    provider: 'TRUSTX Core Labs',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c2',
    name: 'DeepSearch Pro',
    description: 'Comprehensive academic research engine with patent search and deep literature synthesis.',
    endpoint: `${BASE_URL}/api/research`,
    category: 'research',
    pricePerRequest: 0.05,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 94,
    successRate: 97.8,
    averageLatencyMs: 300,
    availability: 98.5,
    transactionCount: 920,
    status: 'active',
    capabilities: ['research', 'patent_analysis', 'academic_search', 'summarization'],
    provider: 'DeepSearch Systems',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c3',
    name: 'QuickResearch Lite',
    description: 'Economy research provider for rapid informational overviews and web data extraction.',
    endpoint: `${BASE_URL}/api/research`,
    category: 'research',
    pricePerRequest: 0.02,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 72,
    successRate: 88.0,
    averageLatencyMs: 900,
    availability: 91.0,
    transactionCount: 410,
    status: 'active',
    capabilities: ['research', 'web_scraping', 'summarization'],
    provider: 'QuickResearch Inc',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c5',
    name: 'Translation Nexus',
    description: 'Neural multi-lingual translation service supporting 100+ global languages with context preservation.',
    endpoint: `${BASE_URL}/api/translate`,
    category: 'translation',
    pricePerRequest: 0.02,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 95,
    successRate: 98.9,
    averageLatencyMs: 180,
    availability: 99.7,
    transactionCount: 2310,
    status: 'active',
    capabilities: ['translation', 'language_processing', 'localization'],
    provider: 'LingoNexus AI',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c6',
    name: 'DataInsight Engine',
    description: 'Autonomous CSV & dataset analytics engine for statistical distribution and anomaly detection.',
    endpoint: `${BASE_URL}/api/data-analysis`,
    category: 'data',
    pricePerRequest: 0.04,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 96,
    successRate: 99.1,
    averageLatencyMs: 340,
    availability: 99.5,
    transactionCount: 1540,
    status: 'active',
    capabilities: ['data_analysis', 'statistics', 'csv_analysis', 'computation'],
    provider: 'DataInsight Labs',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c7',
    name: 'VisionForge',
    description: 'Generative AI visual studio capable of rendering high-definition futuristic concepts and artwork.',
    endpoint: `${BASE_URL}/api/image-generation`,
    category: 'media',
    pricePerRequest: 0.08,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 98,
    successRate: 99.8,
    averageLatencyMs: 1200,
    availability: 99.8,
    transactionCount: 3100,
    status: 'active',
    capabilities: ['image_generation', 'media_creation', 'render'],
    provider: 'VisionForge Studios',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c8',
    name: 'SummarizeAI',
    description: 'High-speed document summarizer producing executive bullet points and key takeaways.',
    endpoint: `${BASE_URL}/api/summarize`,
    category: 'ai',
    pricePerRequest: 0.01,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 93,
    successRate: 96.5,
    averageLatencyMs: 150,
    availability: 99.0,
    transactionCount: 4200,
    status: 'active',
    capabilities: ['summarization', 'text_processing'],
    provider: 'Summarize Labs',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c9',
    name: 'CodeAudit Service',
    description: 'Automated static analysis and security vulnerability detector for smart contracts and web apps.',
    endpoint: `${BASE_URL}/api/code-analysis`,
    category: 'code',
    pricePerRequest: 0.05,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 92,
    successRate: 95.0,
    averageLatencyMs: 450,
    availability: 98.0,
    transactionCount: 880,
    status: 'active',
    capabilities: ['code_analysis', 'security_audit', 'vulnerability_scan'],
    provider: 'SecCode Security',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2ca',
    name: 'DocumentFlow Converter',
    description: 'Universal document format conversion engine for PDF, DOCX, Markdown, and HTML.',
    endpoint: `${BASE_URL}/api/document-conversion`,
    category: 'document',
    pricePerRequest: 0.02,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 91,
    successRate: 94.2,
    averageLatencyMs: 220,
    availability: 97.5,
    transactionCount: 650,
    status: 'active',
    capabilities: ['document_conversion', 'pdf_processing'],
    provider: 'DocFlow Technologies',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2cb',
    name: 'Sentiment Analytics API',
    description: 'Customer review sentiment analyzer quantifying mood, tone, and feedback categorization.',
    endpoint: `${BASE_URL}/api/sentiment`,
    category: 'data',
    pricePerRequest: 0.02,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 94,
    successRate: 97.5,
    averageLatencyMs: 190,
    availability: 99.2,
    transactionCount: 1720,
    status: 'active',
    capabilities: ['sentiment_analysis', 'customer_feedback', 'text_processing'],
    provider: 'Sentiment Metrics',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
  {
    _id: '60f766740a74b48f2a02a2c4',
    name: 'Unverified Shadow Data (Unsafe Service X)',
    description: 'High-risk external endpoint flagged for suspicious instruction patterns and low reputation.',
    endpoint: `${BASE_URL}/api/research`,
    category: 'research',
    pricePerRequest: 0.80,
    currency: 'USDC',
    network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 31,
    successRate: 42.0,
    averageLatencyMs: 2500,
    availability: 65.0,
    transactionCount: 14,
    status: 'degraded',
    capabilities: ['research', 'unverified_data'],
    provider: 'Unknown Shadow Entity',
    paymentProtocol: 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  },
];

let inMemoryServices: ServiceItem[] = [...INITIAL_SERVICES];

export async function seedServiceRegistry(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    try {
      const count = await ServiceModel.countDocuments();
      if (count < INITIAL_SERVICES.length) {
        console.log('🌱 Syncing Service Registry with initial services in MongoDB...');
        for (const s of INITIAL_SERVICES) {
          await ServiceModel.updateOne({ _id: s._id }, { $set: s }, { upsert: true });
        }
        console.log('✅ Service Registry synced successfully.');
      }
    } catch (e: any) {
      console.warn('⚠️ Service seeding fallback in-memory store:', e.message);
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
  return all.find((s) => s._id === id || s.name.toLowerCase().includes(id.toLowerCase())) || null;
}

export async function findServicesByCapability(capability: string): Promise<ServiceItem[]> {
  const all = await getAllServices();
  const capNormalized = capability.toLowerCase().trim();

  return all.filter((s) => {
    if (s.status === 'offline') return false;
    if (s.category.toLowerCase() === capNormalized) return true;
    return s.capabilities.some((c) => {
      const target = c.toLowerCase();
      return target === capNormalized || target.includes(capNormalized) || capNormalized.includes(target);
    });
  });
}

export async function findServicesByCategory(category: string): Promise<ServiceItem[]> {
  const all = await getAllServices();
  return all.filter((s) => s.status !== 'offline' && s.category.toLowerCase() === category.toLowerCase());
}

export async function registerService(payload: ServiceRegistrationPayload): Promise<ServiceItem> {
  if (!payload.name || !payload.endpoint || !payload.capabilities || payload.capabilities.length === 0) {
    throw new Error('Service registration requires name, endpoint, and at least one capability.');
  }

  if (payload.pricePerRequest === undefined || payload.pricePerRequest < 0) {
    throw new Error('Valid pricePerRequest is required.');
  }

  const newService: ServiceItem = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: payload.name.trim(),
    description: payload.description || 'Machine-payable service registered via TRUSTX API.',
    endpoint: payload.endpoint.trim(),
    category: payload.category || 'ai',
    pricePerRequest: payload.pricePerRequest,
    currency: payload.currency || 'USDC',
    network: payload.network || 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    trustScore: 85,
    successRate: 98.0,
    averageLatencyMs: 250,
    availability: 99.0,
    transactionCount: 0,
    status: 'active',
    capabilities: payload.capabilities.map((c) => c.toLowerCase().trim()),
    provider: payload.provider || 'Registered Third-Party Provider',
    paymentProtocol: payload.paymentProtocol || 'x402',
    paymentAsset: '10458941',
    requiresPayment: true,
  };

  inMemoryServices.push(newService);

  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new ServiceModel(newService);
      await doc.save();
    } catch (err: any) {
      console.warn('⚠️ Saved registered service to in-memory store:', err.message);
    }
  }

  return newService;
}
