export interface ServiceItem {
  _id: string;
  name: string;
  description: string;
  endpoint: string;
  category: 'research' | 'data' | 'compute' | 'storage' | 'ai';
  pricePerRequest: number; // in USD / USDC
  currency: string;
  network: string;
  trustScore: number;
  successRate: number;
  averageLatencyMs: number;
  availability: number;
  transactionCount: number;
  status: 'active' | 'degraded' | 'offline';
  capabilities: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReputationResult {
  serviceId: string;
  serviceName?: string;
  trustScore: number;
  successRate: number;
  averageLatencyMs: number;
  transactionCount: number;
  breakdown: {
    successRateScore: number;
    historyScore: number;
    availabilityScore: number;
    latencyScore: number;
    feedbackScore: number;
  };
  label: string; // "TRUSTX-generated reputation score"
}

export interface RiskCheckRequest {
  agentId: string;
  serviceId: string;
  serviceName?: string;
  serviceCategory?: string;
  price?: number;
  userPrompt?: string;
  trustScore?: number;
}

export interface RiskResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: 'ALLOW' | 'BLOCK';
  reasons: string[];
}

export interface BudgetPolicy {
  agentId: string;
  dailyBudget: number;
  spentToday: number;
  maxPerTransaction: number;
  minimumTrustScore: number;
  allowedCategories: string[];
}

export interface BudgetCheckResult {
  allowed: boolean;
  decision: 'ALLOW' | 'BLOCK';
  reasons: string[];
  remainingDailyBudget: number;
}

export interface RouterWeights {
  trustWeight: number; // e.g. 0.35
  priceWeight: number; // e.g. 0.25
  latencyWeight: number; // e.g. 0.20
  reliabilityWeight: number; // e.g. 0.20
}

export interface RouterSelectionResult {
  selectedService: ServiceItem;
  score: number;
  rankings: Array<{
    serviceId: string;
    name: string;
    score: number;
    trustScore: number;
    price: number;
    latency: number;
    reliability: number;
  }>;
  reason: string;
}

export interface AgentRunStep {
  stepIndex: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  data?: any;
}

export interface AgentRun {
  _id: string;
  agentId: string;
  userRequest: string;
  steps: AgentRunStep[];
  selectedService?: Partial<ServiceItem>;
  paymentStatus: 'none' | 'pending' | 'signed' | 'settled' | 'blocked' | 'failed';
  result?: any;
  transactionId?: string;
  startedAt: string;
  completedAt?: string;
}

export interface TransactionRecord {
  _id: string;
  agentId: string;
  serviceId: string;
  serviceName?: string;
  amount: number;
  asset: string;
  network: string;
  x402Status: string;
  settlementStatus: string;
  blockchainTransactionId: string;
  payerAddress?: string;
  receiverAddress?: string;
  timestamp: string;
  responseStatus: number;
  explorerUrl?: string;
}

export interface SecurityEventRecord {
  _id: string;
  agentId: string;
  serviceId?: string;
  riskScore: number;
  riskLevel: string;
  decision: string;
  reasons: string[];
  userPrompt?: string;
  timestamp: string;
}

export interface X402PaymentResult {
  protocol: string;
  network: string;
  asset: string;
  transactionId: string;
  payerAddress?: string;
  receiverAddress?: string;
}

export interface ResearchApiResponse {
  success: boolean;
  result: {
    query: string;
    summary: string;
    keyFindings: string[];
    sources: string[];
  };
  payment: X402PaymentResult;
}
