import {
  ServiceItem,
  ReputationResult,
  RiskResult,
  BudgetPolicy,
  RouterSelectionResult,
  AgentRun,
  TransactionRecord,
  SecurityEventRecord,
  PaymentSession,
  ServiceRegistrationPayload,
} from '@trustx/shared';

const getApiBase = () => {
  const envBase = (import.meta as any).env?.VITE_API_BASE;
  if (envBase) return envBase;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  return 'https://trustx402.onrender.com/api';
};

const API_BASE = getApiBase();

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchServices(filters?: { capability?: string; category?: string }): Promise<ServiceItem[]> {
  const queryParams = new URLSearchParams();
  if (filters?.capability) queryParams.set('capability', filters.capability);
  if (filters?.category) queryParams.set('category', filters.category);

  const url = `${API_BASE}/services${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.services || [];
}

export async function registerNewService(data: ServiceRegistrationPayload): Promise<ServiceItem> {
  const res = await fetch(`${API_BASE}/services/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to register service.');
  }
  return json.service;
}

export async function fetchReputation(serviceId: string): Promise<ReputationResult> {
  const res = await fetch(`${API_BASE}/services/${serviceId}/reputation`);
  const json = await res.json();
  return json.reputation;
}

export async function checkSecurityRisk(data: any): Promise<RiskResult> {
  const res = await fetch(`${API_BASE}/security/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.riskResult;
}

export async function fetchSecurityEvents(): Promise<SecurityEventRecord[]> {
  const res = await fetch(`${API_BASE}/security/events`);
  const json = await res.json();
  return json.events || [];
}

export async function fetchBudgetPolicy(): Promise<BudgetPolicy> {
  const res = await fetch(`${API_BASE}/policy`);
  const json = await res.json();
  return json.policy;
}

export async function updateBudgetPolicyApi(policy: Partial<BudgetPolicy>): Promise<BudgetPolicy> {
  const res = await fetch(`${API_BASE}/policy/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policy),
  });
  const json = await res.json();
  return json.policy;
}

export async function selectRoute(weights?: any): Promise<RouterSelectionResult> {
  const res = await fetch(`${API_BASE}/router/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights }),
  });
  const json = await res.json();
  return json.result;
}

export async function prepareAgent(
  userRequest: string,
  targetServiceId?: string
): Promise<{ agentRun: AgentRun; paymentSession?: PaymentSession }> {
  const res = await fetch(`${API_BASE}/agent/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userRequest, targetServiceId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Agent preparation failed');
  }
  return { agentRun: json.agentRun, paymentSession: json.paymentSession };
}

export async function confirmPayment(
  paymentSessionId: string,
  options: { signedPaymentPayload?: any; useBackendSigner?: boolean } = {}
): Promise<{ success: boolean; transactionId: string; result: any; paymentSession: PaymentSession }> {
  const res = await fetch(`${API_BASE}/payment/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentSessionId,
      signedPaymentPayload: options.signedPaymentPayload,
      useBackendSigner: options.useBackendSigner,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Payment confirmation failed');
  }
  return json;
}

export async function cancelPayment(paymentSessionId: string): Promise<PaymentSession> {
  const res = await fetch(`${API_BASE}/payment/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentSessionId }),
  });
  const json = await res.json();
  return json.paymentSession;
}

export async function runAgent(userRequest: string, targetServiceId?: string): Promise<AgentRun> {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userRequest, targetServiceId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Agent run failed');
  }
  return json.agentRun;
}

export async function fetchTransactions(): Promise<TransactionRecord[]> {
  const res = await fetch(`${API_BASE}/transactions`);
  const json = await res.json();
  return json.transactions || [];
}
