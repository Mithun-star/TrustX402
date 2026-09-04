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
import { env } from '../../config/env.js';

const inMemoryRuns: AgentRun[] = [];

interface IntentAnalysis {
  intent: string;
  capability: string;
  isFollowUp: boolean;
  isRationaleQuery: boolean;
}

async function analyzeUserIntent(
  userRequest: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<IntentAnalysis> {
  const reqLower = userRequest.toLowerCase().trim();

  const isRationaleQuery =
    reqLower.includes('why did you select') ||
    reqLower.includes('why this service') ||
    reqLower.includes('why select') ||
    reqLower.includes('routing rationale');

  const isFollowUp =
    !!history &&
    history.length > 0 &&
    (reqLower.startsWith('what about') ||
      reqLower.startsWith('why') ||
      reqLower.startsWith('how about') ||
      reqLower.startsWith('which companies') ||
      reqLower.startsWith('the cost') ||
      reqLower.length < 35);

  // If AI_API_KEY is configured in env, attempt LLM-assisted intent classification via REST
  if (env.AI_API_KEY) {
    try {
      const llmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.AI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this user request in a multi-capability AI Agent gateway. Output ONLY JSON: {"capability": "...", "intent": "..."}. Request: "${userRequest}"`,
                },
              ],
            },
          ],
        }),
      });

      if (llmRes.ok) {
        const llmData = await llmRes.json();
        const rawText = llmData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.capability && parsed.intent) {
            return {
              intent: parsed.intent,
              capability: parsed.capability.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
              isFollowUp,
              isRationaleQuery,
            };
          }
        }
      }
    } catch (e: any) {
      // Fallback to rule-based parser on network or API key error
    }
  }

  // Rule-based Natural Language Understanding (NLU) & Intent Categorization
  let capability = 'research';
  let intent = 'General Research & Analysis';

  if (reqLower.includes('weather') || reqLower.includes('forecast') || reqLower.includes('climate')) {
    capability = 'weather';
    intent = 'Real-time Weather & Climate Intelligence';
  } else if (reqLower.includes('data') || reqLower.includes('dataset') || reqLower.includes('analytics') || reqLower.includes('analyze')) {
    capability = 'data-analysis';
    intent = 'Data Processing & Advanced Analytics';
  } else if (reqLower.includes('code') || reqLower.includes('coding') || reqLower.includes('developer') || reqLower.includes('programming')) {
    capability = 'coding';
    intent = 'AI Code Generation & Engineering Tools';
  } else if (reqLower.includes('architecture') || reqLower.includes('database') || reqLower.includes('compare mongodb') || reqLower.includes('cloud')) {
    capability = 'architecture';
    intent = 'System Architecture & Database Comparison';
  } else if (reqLower.includes('security') || reqLower.includes('cybersecurity') || reqLower.includes('vulnerability')) {
    capability = 'cybersecurity';
    intent = 'Cybersecurity Audit & Threat Intelligence';
  } else if (reqLower.includes('image') || reqLower.includes('generate image') || reqLower.includes('vision')) {
    capability = 'image-generation';
    intent = 'Generative AI Media & Computer Vision';
  } else if (reqLower.includes('market') || reqLower.includes('company') || reqLower.includes('startup') || reqLower.includes('cost')) {
    capability = 'market-intelligence';
    intent = 'Market Intelligence & Commercial Analysis';
  } else if (reqLower.includes('battery') || reqLower.includes('ev') || reqLower.includes('recycling')) {
    capability = 'ev_battery_research';
    intent = 'EV Battery Systems & Clean Energy Technology';
  }

  if (isFollowUp && history && history.length > 0) {
    const lastTopic = history[history.length - 1].content;
    intent = `Conversational Follow-up on Context (${lastTopic.substring(0, 30)}...)`;
  }

  return { intent, capability, isFollowUp, isRationaleQuery };
}

export async function runAgentWorkflow(
  userRequest: string,
  targetServiceId?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AgentRun> {
  const agentId = 'autonomous-agent-1';
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
    const analysis = await analyzeUserIntent(userRequest, conversationHistory);
    addStep(
      'Understanding request & capability identification',
      `Parsed prompt: "${userRequest}". Intent: ${analysis.intent}. Capability: '${analysis.capability}'.`
    );
    completeStep(1, { intent: analysis.intent, capability: analysis.capability, isFollowUp: analysis.isFollowUp });

    // Step 2: Discovering Available Services
    addStep('Discovering candidate services', `Querying TRUSTX Service Registry for capability '${analysis.capability}'...`);
    let candidateServices = await findServicesByCapability(analysis.capability);

    if (targetServiceId) {
      const specific = candidateServices.find((s) => s._id === targetServiceId || s.name.includes(targetServiceId));
      if (specific) {
        candidateServices = [specific];
      }
    }

    completeStep(2, { candidateCount: candidateServices.length, candidates: candidateServices.map((s) => s.name) });

    if (candidateServices.length === 0) {
      throw new Error(`No candidate services found for capability '${analysis.capability}'.`);
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

    transactionId = paidResponse.payment?.transactionId;

    if (!transactionId) {
      throw new Error(
        'x402 request succeeded, but no Algorand transaction ID was returned. Settlement cannot be verified.'
      );
    }

    recordSpending(selectedService.pricePerRequest);

    completeStep(7, {
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

    // Step 8: Synthesizing Conversational Response & Rationale Output
    addStep('Synthesizing response & returning chatbot output', 'Formulating natural-language response and routing rationale...');

    let conversationalSummary = paidResponse.result?.summary || `Executed analysis for prompt: "${userRequest}".`;

    if (analysis.isRationaleQuery) {
      conversationalSummary = `I selected '${selectedService.name}' based on the TRUSTX Payment Router decision matrix: Trust Score (${selectedService.trustScore}/100, 35% weight), Price ($${selectedService.pricePerRequest} USDC, 25% weight), Latency (${selectedService.averageLatencyMs}ms, 20% weight), and Reliability (${selectedService.availability}%, 20% weight). The Security Risk Engine and Budget Engine both evaluated and ALLOWED the request.`;
    } else if (analysis.isFollowUp) {
      conversationalSummary = `[Conversational Follow-up]\nRegarding "${userRequest}": ${conversationalSummary}`;
    }

    finalResult = {
      query: userRequest,
      intent: analysis.intent,
      capability: analysis.capability,
      summary: conversationalSummary,
      keyFindings: paidResponse.result?.keyFindings || [
        `Provider: ${selectedService.name} (${selectedService.companyName || 'Verified Provider Labs'})`,
        `TRUSTX Governance Score: ${selectedService.trustScore}/100`,
        `Real Algorand Settlement: TxID ${transactionId}`,
      ],
      sources: paidResponse.result?.sources || [selectedService.name, 'TRUSTX Autonomous Gateway'],
      routingRationale: routeResult.reason,
    };

    completeStep(8, { result: finalResult });

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
    conversationHistory,
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
