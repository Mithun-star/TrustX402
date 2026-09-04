import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllServices,
  getServiceById,
  findServicesByCapability,
  findServicesByCategory,
  registerService,
} from '../services/registry/ServiceRegistry.js';
import { calculateReputationScore } from '../services/reputation/ReputationEngine.js';
import { evaluateRisk } from '../services/risk/RiskEngine.js';
import { evaluateBudget, getBudgetPolicy, updateBudgetPolicy } from '../services/budget/BudgetEngine.js';
import { selectOptimalService } from '../services/router/PaymentRouter.js';
import { runAgentWorkflow, prepareAgentWorkflow, confirmAndExecutePaymentSession } from '../services/agent/AIAgentService.js';
import { getPaymentSession, updatePaymentSessionStatus } from '../services/payment/PaymentSessionService.js';
import { AgentRunModel } from '../models/AgentRun.js';
import { getAllTransactions, getTransactionById } from '../services/transactions/TransactionService.js';
import { getAllSecurityEvents } from '../services/security/SecurityEventService.js';
import { x402ExpressMiddleware } from '../services/x402/x402Server.js';
import { env } from '../config/env.js';
import { ServiceItem } from '@trustx/shared';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'TRUSTX Gateway',
    timestamp: new Date().toISOString(),
    network: env.X402_NETWORK,
    facilitator: env.FACILITATOR_URL,
    usdcAssetId: env.USDC_ASSET_ID,
  });
});

// Services Registry API
apiRouter.get('/services', async (req: Request, res: Response) => {
  try {
    const { capability, category } = req.query;

    let rawServices: ServiceItem[];
    if (capability && typeof capability === 'string') {
      rawServices = await findServicesByCapability(capability);
    } else if (category && typeof category === 'string') {
      rawServices = await findServicesByCategory(category);
    } else {
      rawServices = await getAllServices();
    }

    const services: ServiceItem[] = rawServices.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
    }));
    res.json({ success: true, services });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/services/:id', async (req: Request, res: Response) => {
  try {
    const service: any = await getServiceById(req.params.id);
    if (!service) return res.status(404).json({ success: false, error: 'Service not found' });
    const formatted: ServiceItem = { ...service, _id: service._id.toString() };
    res.json({ success: true, service: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/services/:id/reputation', async (req: Request, res: Response) => {
  try {
    const service: any = await getServiceById(req.params.id);
    if (!service) return res.status(404).json({ success: false, error: 'Service not found' });
    const formatted: ServiceItem = { ...service, _id: service._id.toString() };
    const reputation = calculateReputationScore(formatted);
    res.json({ success: true, reputation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register New Service
apiRouter.post('/services/register', async (req: Request, res: Response) => {
  try {
    const registered = await registerService(req.body);
    res.status(201).json({ success: true, service: registered });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Security & Risk Engine API
apiRouter.post('/security/check', async (req: Request, res: Response) => {
  try {
    const riskResult = evaluateRisk(req.body);
    res.json({ success: true, riskResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/security/events', async (req: Request, res: Response) => {
  try {
    const rawEvents = await getAllSecurityEvents();
    const events = rawEvents.map((evt: any) => ({ ...evt, _id: evt._id.toString() }));
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Policy & Budget API
apiRouter.get('/policy', (req: Request, res: Response) => {
  res.json({ success: true, policy: getBudgetPolicy() });
});

apiRouter.post('/policy/update', (req: Request, res: Response) => {
  const updated = updateBudgetPolicy(req.body);
  res.json({ success: true, policy: updated });
});

apiRouter.post('/policy/check', (req: Request, res: Response) => {
  try {
    const { service, amount } = req.body;
    const result = evaluateBudget(service || {}, amount);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Payment Router API
apiRouter.post('/router/select', async (req: Request, res: Response) => {
  try {
    const rawServices = await getAllServices();
    const services: ServiceItem[] = rawServices.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
    }));
    const result = selectOptimalService(services, req.body.weights);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Agent Execution & Payment Sessions API
apiRouter.post('/agent/prepare', async (req: Request, res: Response) => {
  try {
    const { userRequest, targetServiceId } = req.body;
    if (!userRequest) {
      return res.status(400).json({ success: false, error: 'userRequest parameter is required.' });
    }
    const prepared = await prepareAgentWorkflow(userRequest, targetServiceId);
    res.json({
      success: true,
      agentRun: prepared.agentRun,
      paymentSession: prepared.paymentSession,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/agent/run', async (req: Request, res: Response) => {
  try {
    const { userRequest, targetServiceId } = req.body;
    if (!userRequest) {
      return res.status(400).json({ success: false, error: 'userRequest parameter is required.' });
    }
    const agentRun = await runAgentWorkflow(userRequest, targetServiceId);
    res.json({ success: true, agentRun });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/agent/runs/:id', async (req: Request, res: Response) => {
  try {
    const run: any = await AgentRunModel.findById(req.params.id).lean();
    if (!run) return res.status(404).json({ success: false, error: 'Agent run not found' });
    const formatted = { ...run, _id: run._id.toString() };
    res.json({ success: true, agentRun: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Payment Session API
apiRouter.get('/payment/session/:id', async (req: Request, res: Response) => {
  try {
    const session = await getPaymentSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Payment session not found' });
    res.json({ success: true, paymentSession: session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payment/confirm', async (req: Request, res: Response) => {
  try {
    const { paymentSessionId, signedPaymentPayload, useBackendSigner } = req.body;
    if (!paymentSessionId) {
      return res.status(400).json({ success: false, error: 'paymentSessionId parameter is required.' });
    }
    const outcome = await confirmAndExecutePaymentSession(paymentSessionId, {
      signedPaymentPayload,
      useBackendSigner: !!useBackendSigner,
    });
    res.json(outcome);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payment/cancel', async (req: Request, res: Response) => {
  try {
    const { paymentSessionId } = req.body;
    if (!paymentSessionId) {
      return res.status(400).json({ success: false, error: 'paymentSessionId is required.' });
    }
    const updated = await updatePaymentSessionStatus(paymentSessionId, 'cancelled');
    res.json({ success: true, paymentSession: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Transactions API
apiRouter.get('/transactions', async (req: Request, res: Response) => {
  try {
    const rawTxs = await getAllTransactions();
    const transactions = rawTxs.map((tx: any) => ({ ...tx, _id: tx._id.toString() }));
    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const tx: any = await getTransactionById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, error: 'Transaction not found' });
    const formatted = { ...tx, _id: tx._id.toString() };
    res.json({ success: true, transaction: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TRUSTX Demo Machine-Payable Service Endpoints
apiRouter.post('/translate', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: {
      originalText: req.body?.text || req.body?.query || '',
      translatedText: 'EVバッテリーリサイクル技術の最新の進歩により、リチウムとコバルトの回収率が95%以上に達しています。',
      targetLanguage: 'Japanese',
      provider: 'TRUSTX Demo Translation Service',
    },
  });
});

apiRouter.post('/data-analysis', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: {
      totalRows: 1420,
      anomaliesDetected: 3,
      statisticalSummary: { meanLatencyMs: 245.2, p99LatencyMs: 820.0, errorRate: 0.002 },
      provider: 'TRUSTX Demo DataInsight Engine',
    },
  });
});

apiRouter.post('/summarize', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: {
      summary: 'Executive Summary: Direct hydrometallurgical recycling achieves 95%+ material recovery while reducing carbon intensity by 40%.',
      provider: 'TRUSTX Demo SummarizeAI',
    },
  });
});

apiRouter.post('/image-generation', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: {
      prompt: req.body?.prompt || req.body?.query || 'Futuristic city',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
      resolution: '1024x1024',
      provider: 'TRUSTX Demo VisionForge',
    },
  });
});

apiRouter.post('/sentiment', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: {
      overallSentiment: 'POSITIVE',
      score: 0.88,
      provider: 'TRUSTX Demo Sentiment Analytics API',
    },
  });
});

apiRouter.post('/code-analysis', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: {
      target: 'Smart Contract Audit',
      issuesFound: [{ severity: 'LOW', title: 'Unchecked return value', line: 42 }],
      securityScore: 95,
      provider: 'TRUSTX Demo CodeAudit Service',
    },
  });
});

apiRouter.post('/document-conversion', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: {
      sourceFormat: 'DOCX',
      targetFormat: 'PDF',
      outputFileUrl: '/downloads/converted-document.pdf',
      provider: 'TRUSTX Demo DocumentFlow Converter',
    },
  });
});

// Mandatory x402 Protected Research Endpoint ($0.03 USDC on Algorand Testnet)
apiRouter.post(
  '/research',
  (req: Request, res: Response, next: NextFunction) => {
    const hasSig = req.headers['payment-signature'] ? 'PRESENT' : 'MISSING';
    const hasXPayment = req.headers['x-payment'] ? 'PRESENT' : 'MISSING';
    console.log(`📥 [Server Middleware] Incoming POST /api/research request.`);
    console.log(`   PAYMENT-SIGNATURE: ${hasSig}, X-PAYMENT: ${hasXPayment}`);
    next();
  },
  x402ExpressMiddleware,
  (req: Request, res: Response) => {
    const query = req.body?.query || 'EV battery recycling technologies';
    console.log(`🎉 [Server Route] Handler executed successfully. Returning 200 JSON payload.`);
    res.json({
      success: true,
      result: {
        query,
        summary: `Comprehensive research summary on '${query}': Closed-loop hydrometallurgical recycling achieves 95%+ recovery rate of Lithium, Nickel, and Cobalt with low carbon footprint. Direct recycling and automated disassembly systems are rapidly advancing for commercial deployment.`,
        keyFindings: [
          'Hydrometallurgical extraction recovers 95%+ of battery-grade Cathode Active Materials (CAM).',
          'Direct cathode-to-cathode reconditioning reduces energy consumption by 40% compared to traditional smelting.',
          'Robotic disassembly and AI vision systems reduce hazardous manual handling by 80%.',
        ],
        sources: [
          'Journal of Cleaner Production (2025)',
          'Global EV Recycling Market Intelligence Report',
          'Algorand Decoupled Circular Economy Consortium',
        ],
      },
    });
  }
);