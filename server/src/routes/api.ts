import { Router, Request, Response, NextFunction } from 'express';
import { getAllServices, getServiceById, seedServiceRegistry } from '../services/registry/ServiceRegistry.js';
import { calculateReputationScore } from '../services/reputation/ReputationEngine.js';
import { evaluateRisk } from '../services/risk/RiskEngine.js';
import { evaluateBudget, getBudgetPolicy, updateBudgetPolicy } from '../services/budget/BudgetEngine.js';
import { selectOptimalService } from '../services/router/PaymentRouter.js';
import { runAgentWorkflow } from '../services/agent/AIAgentService.js';
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

// Services API
apiRouter.get('/services', async (req: Request, res: Response) => {
  try {
    const rawServices = await getAllServices();
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

// AI Agent Execution API
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

// Mandatory x402 Protected Research Endpoint ($0.03 USDC on Algorand Testnet)
// Mandatory x402 Protected Research Endpoint ($0.03 USDC on Algorand Testnet)
apiRouter.post(
  '/research',

  (req: Request, res: Response, next: NextFunction) => {
    const hasSig = req.headers['payment-signature']
      ? 'PRESENT'
      : 'MISSING';

    const hasXPayment = req.headers['x-payment']
      ? 'PRESENT'
      : 'MISSING';

    console.log(
      `📥 [Server Middleware] Incoming POST /api/research request.`
    );

    console.log(
      `   PAYMENT-SIGNATURE: ${hasSig}, X-PAYMENT: ${hasXPayment}`
    );

    next();
  },

  x402ExpressMiddleware,

  (req: Request, res: Response) => {
    const query =
      req.body?.query ||
      'EV battery recycling technologies';

    console.log(
      `🎉 [Server Route] Handler executed successfully. Returning 200 JSON payload.`
    );

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