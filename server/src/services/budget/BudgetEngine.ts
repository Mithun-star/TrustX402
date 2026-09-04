import { BudgetPolicy, BudgetCheckResult, ServiceItem } from '@trustx/shared';

export const DEFAULT_BUDGET_POLICY: BudgetPolicy = {
  agentId: 'research-agent-1',
  dailyBudget: 1.00, // $1.00 USDC
  spentToday: 0.05, // $0.05 spent
  maxPerTransaction: 0.10, // $0.10 max per tx
  minimumTrustScore: 50,
  allowedCategories: ['research', 'data', 'compute', 'ai', 'weather', 'coding', 'architecture', 'cybersecurity', 'market-intelligence'],
};

let currentPolicy: BudgetPolicy = { ...DEFAULT_BUDGET_POLICY };

export function getBudgetPolicy(): BudgetPolicy {
  return { ...currentPolicy };
}

export function updateBudgetPolicy(newPolicy: Partial<BudgetPolicy>): BudgetPolicy {
  currentPolicy = { ...currentPolicy, ...newPolicy };
  return { ...currentPolicy };
}

export function recordSpending(amount: number): void {
  currentPolicy.spentToday = Number((currentPolicy.spentToday + amount).toFixed(4));
}

export function evaluateBudget(
  service: Partial<ServiceItem>,
  requestedAmount?: number
): BudgetCheckResult {
  const price = requestedAmount ?? service.pricePerRequest ?? 0;
  const trustScore = service.trustScore ?? 0;
  const category = service.category ?? 'research';
  const reasons: string[] = [];

  const remainingDailyBudget = Number((currentPolicy.dailyBudget - currentPolicy.spentToday).toFixed(4));

  // 1. Transaction limit check
  if (price > currentPolicy.maxPerTransaction) {
    reasons.push(
      `Requested amount ($${price.toFixed(2)}) exceeds maximum allowed per transaction ($${currentPolicy.maxPerTransaction.toFixed(2)}).`
    );
  }

  // 2. Remaining daily budget check
  if (price > remainingDailyBudget) {
    reasons.push(
      `Requested amount ($${price.toFixed(2)}) exceeds remaining daily budget ($${remainingDailyBudget.toFixed(2)}).`
    );
  }

  // 3. Minimum trust score check
  if (trustScore < currentPolicy.minimumTrustScore) {
    reasons.push(
      `Service trust score (${trustScore}) is below policy minimum requirement (${currentPolicy.minimumTrustScore}).`
    );
  }

  // 4. Allowed category check
  if (!currentPolicy.allowedCategories.includes(category.toLowerCase())) {
    reasons.push(
      `Service category '${category}' is not included in allowed agent categories [${currentPolicy.allowedCategories.join(', ')}].`
    );
  }

  const allowed = reasons.length === 0;

  return {
    allowed,
    decision: allowed ? 'ALLOW' : 'BLOCK',
    reasons: allowed ? ['Budget, price, trust score, and category policy checks passed.'] : reasons,
    remainingDailyBudget,
  };
}
