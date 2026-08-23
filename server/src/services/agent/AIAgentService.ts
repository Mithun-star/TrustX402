import mongoose from 'mongoose';
import { AgentRun, AgentRunStep, ServiceItem } from '@trustx/shared';
import { AgentRunModel } from '../../models/AgentRun.js';
import { findServicesByCapability } from '../registry/ServiceRegistry.js';
import { calculateReputationScore } from '../reputation/ReputationEngine.js';
import { evaluateRisk } from '../risk/RiskEngine.js';
import { evaluateBudget, recordSpending, getBudgetPolicy } from '../budget/BudgetEngine.js';
import { selectOptimalService } from '../router/PaymentRouter.js';
import { executeX402PaidRequest } from '../x402/x402ClientService.js';
import { createTransactionRecord } from '../transactions/TransactionService.js';
import { createSecurityEvent } from '../security/SecurityEventService.js';

const inMemoryRuns: AgentRun[] = [];

export async function runAgentWorkflow(
  userRequest: string,
  targetServiceId?: string
): Promise<AgentRun> {
  const agentId = 'research-agent-1';
  const startedAt = new Date().toISOString();
  const steps: AgentRunStep[] = [];

  const addStep = (title: string, description: string, data?: any) => {
    const step: AgentRunStep = {
      stepIndex: steps.length + 1,
      title,
      description,
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      data,
    };
    steps.push(step);
    return step;
  };

  const completeStep = (index: number, data?: any) => {
    if (steps[index - 1]) {
      steps[index - 1].status = 'completed';
      if (data) steps[index - 1].data = { ...steps[index - 1].data, ...data };
    }
  };

  const failStep = (index: number, errorMsg: string) => {
    if (steps[index - 1]) {
      steps[index - 1].status = 'failed';
      steps[index - 1].data = { ...steps[index - 1].data, error: errorMsg };
    }
  };

  let selectedService: ServiceItem | undefined;
  let paymentStatus: AgentRun['paymentStatus'] = 'none';
  let finalResult: any = null;
  let transactionId: string | undefined = undefined;

  try {
    // Step 1: Understanding Request & Identifying Capability
    addStep(
      'Understanding request & capability identification',
      `Parsed user prompt: "${userRequest}". Determined required capability: research.`
    );
    completeStep(1, { capability: 'research' });

    // Step 2: Discovering Available Services
    addStep('Discovering candidate services', 'Querying TRUSTX Service Registry for research providers...');
    let candidateServices = await findServicesByCapability('research');

    if (targetServiceId) {
      const specific = candidateServices.find((s) => s._id === targetServiceId || s.name.includes(targetServiceId));
      if (specific) {
        candidateServices = [specific];
      }
    }

    completeStep(2, { candidateCount: candidateServices.length, candidates: candidateServices.map((s) => s.name) });

    if (candidateServices.length === 0) {
      throw new Error('No candidate research services found in registry.');
    }

    // Step 3: Evaluating Trust Scores
    addStep('Evaluating TRUSTX service trust scores', 'Calculating transparent reputation metrics for candidate services...');
    const reputationReports = candidateServices.map((service) => ({
      service: service.name,
      report: calculateReputationScore(service),
    }));
    completeStep(3, { reputationReports });

    // Step 4: Comparing & Selecting Optimal Service
    addStep('Comparing & routing payment to optimal service', 'Applying multi-attribute decision matrix (Trust 35%, Price 25%, Latency 20%, Reliability 20%)...');
    const routeResult = selectOptimalService(candidateServices);
    selectedService = routeResult.selectedService;
    completeStep(4, { selectedService: selectedService.name, score: routeResult.score, rankings: routeResult.rankings, reason: routeResult.reason });

    // Step 5: Security & Risk Engine Evaluation
    addStep('Evaluating security & risk rules', `Checking risk indicators for provider '${selectedService.name}'...`);
    const riskResult = evaluateRisk({
      agentId,
      serviceId: selectedService._id,
      serviceName: selectedService.name,
      trustScore: selectedService.trustScore,
      price: selectedService.pricePerRequest,
      userPrompt: userRequest,
    });

    await createSecurityEvent({
      agentId,
      serviceId: selectedService._id,
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
      decision: riskResult.decision,
      reasons: riskResult.reasons,
      userPrompt: userRequest,
    });

    completeStep(5, { riskScore: riskResult.riskScore, riskLevel: riskResult.riskLevel, decision: riskResult.decision, reasons: riskResult.reasons });

    if (riskResult.decision === 'BLOCK') {
      paymentStatus = 'blocked';
      addStep('Payment Blocked by Security Engine', `Security policy blocked payment: ${riskResult.reasons.join(' ')}`);
      completeStep(6);
      throw new Error(`Security policy blocked request: ${riskResult.reasons.join(' | ')}`);
    }

    // Step 6: Budget Policy Enforcement
    addStep('Checking budget policy & spending limits', `Enforcing maximum transaction ($${getBudgetPolicy().maxPerTransaction}) and daily limits...`);
    const budgetResult = evaluateBudget(selectedService, selectedService.pricePerRequest);
    completeStep(6, { allowed: budgetResult.allowed, remainingBudget: budgetResult.remainingDailyBudget, reasons: budgetResult.reasons });

    if (!budgetResult.allowed) {
      paymentStatus = 'blocked';
      addStep('Payment Blocked by Budget Engine', `Budget policy blocked payment: ${budgetResult.reasons.join(' ')}`);
      completeStep(7);
      throw new Error(`Budget policy blocked request: ${budgetResult.reasons.join(' | ')}`);
    }

    // Step 7: Executing Real x402 Paid Endpoint Call
   // Step 7: Execute the real x402 protected endpoint
addStep(
  'Executing x402 Paid Endpoint Request',
  `Calling ${selectedService.endpoint} via x402 protocol ($${selectedService.pricePerRequest} USDC)...`
);

paymentStatus = 'pending';

const paidResponse = await executeX402PaidRequest(selectedService.endpoint, {
  method: 'POST',
  body: { query: userRequest },
});

paymentStatus = 'settled';

addStep(
  'x402 Payment & Algorand Settlement',
  'HTTP 402 challenge was automatically handled by the x402 client. Payment was verified and settled on Algorand Testnet.'
);

completeStep(7, {
  protocol: paidResponse.payment?.protocol || 'x402',
  network: paidResponse.payment?.network || 'Algorand Testnet',
  asset: paidResponse.payment?.asset || 'USDC',
  transactionId: paidResponse.payment?.transactionId,
});

    transactionId = paidResponse.payment?.transactionId;

if (!transactionId) {
  throw new Error(
    'x402 request succeeded, but no Algorand transaction ID was returned. Settlement cannot be verified.'
  );
}

paymentStatus = 'settled';
recordSpending(selectedService.pricePerRequest);

    completeStep(9, {
      protocol: paidResponse.payment?.protocol || 'x402',
      network: paidResponse.payment?.network || 'Algorand Testnet',
      asset: paidResponse.payment?.asset || 'USDC',
      transactionId,
    });

    // Save Transaction to DB
    await createTransactionRecord({
      agentId,
      serviceId: selectedService._id,
      serviceName: selectedService.name,
      amount: selectedService.pricePerRequest,
      blockchainTransactionId: transactionId,
      network: selectedService.network,
      x402Status: '200 OK',
      settlementStatus: 'SETTLED',
      responseStatus: 200,
    });

    // Step 8: Synthesizing Agent Reasoning & Final Output
    addStep('Synthesizing research results & returning final answer', 'Received authenticated research payload. Formulating final comprehensive response...');
    finalResult = paidResponse.result;
    completeStep(10, { result: finalResult });

  } catch (error: any) {
    if (paymentStatus !== 'blocked') {
      paymentStatus = 'failed';
    }
    const currentStepIndex = steps.length;
    failStep(currentStepIndex, error.message || 'Workflow step failed.');
  }

  const runRecord: AgentRun = {
    _id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    agentId,
    userRequest,
    steps,
    selectedService,
    paymentStatus,
    result: finalResult,
    transactionId,
    startedAt,
    completedAt: new Date().toISOString(),
  };

  inMemoryRuns.unshift(runRecord);

  if (mongoose.connection.readyState === 1) {
    try {
      const { _id, ...docData } = runRecord;
      const runDoc = new AgentRunModel(docData);
      await runDoc.save();
    } catch (e: any) {
      console.warn('⚠️ Saved agent run to in-memory fallback store:', e.message);
    }
  }

  return runRecord;
}
