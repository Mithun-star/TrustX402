import { ServiceItem, ReputationResult } from '@trustx/shared';

export function calculateReputationScore(service: Partial<ServiceItem>): ReputationResult {
  const successRate = service.successRate ?? 95;
  const transactionCount = service.transactionCount ?? 100;
  const availability = service.availability ?? 98;
  const latencyMs = service.averageLatencyMs ?? 300;

  // 1. Success Rate Component (30% weight, max 30)
  const successRateScore = (Math.min(successRate, 100) / 100) * 30;

  // 2. Transaction History Component (25% weight, logarithmic scale up to 1000 txs)
  const historyNorm = Math.min(Math.log10(Math.max(transactionCount, 1)) / 3, 1);
  const historyScore = historyNorm * 25;

  // 3. Availability Component (20% weight, max 20)
  const availabilityScore = (Math.min(availability, 100) / 100) * 20;

  // 4. Latency Component (15% weight, linear scale: <=100ms = 15, >=2000ms = 0)
  const latencyNorm = Math.max(0, 1 - Math.max(0, latencyMs - 100) / 1900);
  const latencyScore = latencyNorm * 15;

  // 5. User Feedback Component (10% weight, default proportional to success rate)
  const feedbackScore = (Math.min(successRate, 100) / 100) * 10;

  const totalTrustScore = Math.round(
    successRateScore + historyScore + availabilityScore + latencyScore + feedbackScore
  );

  return {
    serviceId: service._id?.toString() || 'unknown',
    serviceName: service.name,
    trustScore: Math.min(100, Math.max(0, totalTrustScore)),
    successRate,
    averageLatencyMs: latencyMs,
    transactionCount,
    breakdown: {
      successRateScore: Number(successRateScore.toFixed(1)),
      historyScore: Number(historyScore.toFixed(1)),
      availabilityScore: Number(availabilityScore.toFixed(1)),
      latencyScore: Number(latencyScore.toFixed(1)),
      feedbackScore: Number(feedbackScore.toFixed(1)),
    },
    label: 'TRUSTX-generated reputation score',
  };
}
