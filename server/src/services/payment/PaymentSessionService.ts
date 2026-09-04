import { PaymentSession, PaymentStatus, ServiceItem, RiskResult, BudgetCheckResult, ReputationResult, PaymentRequirements } from '@trustx/shared';

const inMemorySessions = new Map<string, PaymentSession>();

export async function createPaymentSession(params: {
  agentRunId?: string;
  userRequest: string;
  capability: string;
  selectedService: ServiceItem;
  paymentRequirements: PaymentRequirements;
  amount: number;
  currency?: string;
  network?: string;
  riskResult?: RiskResult;
  budgetCheck?: BudgetCheckResult;
  reputationReport?: ReputationResult;
}): Promise<PaymentSession> {
  const sessionId = `ps-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 minutes TTL

  const session: PaymentSession = {
    sessionId,
    agentRunId: params.agentRunId,
    userRequest: params.userRequest,
    capability: params.capability,
    selectedService: params.selectedService,
    paymentRequirements: params.paymentRequirements,
    amount: params.amount,
    currency: params.currency || 'USDC',
    network: params.network || 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    riskResult: params.riskResult,
    budgetCheck: params.budgetCheck,
    reputationReport: params.reputationReport,
    status: 'payment_required',
    createdAt: now.toISOString(),
    expiresAt,
  };

  inMemorySessions.set(sessionId, session);
  return session;
}

export async function getPaymentSession(sessionId: string): Promise<PaymentSession | null> {
  const session = inMemorySessions.get(sessionId);
  if (!session) return null;

  // Check expiration
  if (session.expiresAt && new Date() > new Date(session.expiresAt) && session.status === 'payment_required') {
    session.status = 'failed';
  }

  return session;
}

export async function updatePaymentSessionStatus(
  sessionId: string,
  status: PaymentStatus,
  extraData?: { transactionId?: string; result?: any }
): Promise<PaymentSession> {
  const session = await getPaymentSession(sessionId);
  if (!session) {
    throw new Error(`Payment session '${sessionId}' not found.`);
  }

  session.status = status;
  if (extraData?.transactionId) session.transactionId = extraData.transactionId;
  if (extraData?.result) session.result = extraData.result;

  inMemorySessions.set(sessionId, session);
  return session;
}
