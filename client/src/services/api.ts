import { ServiceItem, ReputationResult, RiskResult, BudgetPolicy, RouterSelectionResult, AgentRun, TransactionRecord, SecurityEventRecord } from '@trustx/shared';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchServices(): Promise<ServiceItem[]> {
  const res = await fetch(`${API_BASE}/services`);
  const json = await res.json();
  return json.services || [];
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
