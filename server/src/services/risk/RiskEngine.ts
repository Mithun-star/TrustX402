import { RiskCheckRequest, RiskResult } from '@trustx/shared';

const PROMPT_INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /bypass security/i,
  /transfer all funds/i,
  /drain wallet/i,
  /override safety/i,
  /system prompt exposure/i,
  /exec\(/i,
  /sudo /i,
];

export function evaluateRisk(request: RiskCheckRequest): RiskResult {
  const reasons: string[] = [];
  let riskScore = 0;

  // 1. Trust Score Inspection
  const trust = request.trustScore ?? 100;
  if (trust < 50) {
    riskScore += 45;
    reasons.push(`Service trust score (${trust}) below minimum security threshold (50).`);
  } else if (trust < 75) {
    riskScore += 20;
    reasons.push(`Moderate service trust score (${trust}).`);
  }

  // 2. Prompt Security Inspection
  if (request.userPrompt) {
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(request.userPrompt)) {
        riskScore += 60;
        reasons.push(`Prompt injection or malicious pattern detected: matching rule '${pattern.source}'.`);
        break;
      }
    }
  }

  // 3. Price Anomalies
  const price = request.price ?? 0;
  if (price > 0.50) {
    riskScore += 40;
    reasons.push(`Requested price ($${price.toFixed(2)}) exceeds standard micropayment threshold ($0.50).`);
  } else if (price > 0.10) {
    riskScore += 15;
    reasons.push(`Elevated service price ($${price.toFixed(2)}).`);
  }

  // 4. Unknown Service Flag
  if (!request.serviceId || request.serviceId === 'unknown') {
    riskScore += 30;
    reasons.push('Unregistered or unknown service destination.');
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let decision: 'ALLOW' | 'BLOCK' = 'ALLOW';

  if (riskScore >= 75) {
    riskLevel = 'CRITICAL';
    decision = 'BLOCK';
  } else if (riskScore >= 50) {
    riskLevel = 'HIGH';
    decision = 'BLOCK';
  } else if (riskScore >= 25) {
    riskLevel = 'MEDIUM';
    decision = 'ALLOW';
  } else {
    riskLevel = 'LOW';
    decision = 'ALLOW';
  }

  if (reasons.length === 0) {
    reasons.push('No risk factors detected. Standard micropayment parameters validated.');
  }

  return {
    riskScore,
    riskLevel,
    decision,
    reasons,
  };
}
