import { ServiceItem, RouterWeights, RouterSelectionResult } from '@trustx/shared';

export const DEFAULT_ROUTER_WEIGHTS: RouterWeights = {
  trustWeight: 0.35,
  priceWeight: 0.25,
  latencyWeight: 0.20,
  reliabilityWeight: 0.20,
};

export function selectOptimalService(
  candidates: ServiceItem[],
  customWeights: Partial<RouterWeights> = {}
): RouterSelectionResult {
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidate services provided for routing selection.');
  }

  const weights: RouterWeights = {
    ...DEFAULT_ROUTER_WEIGHTS,
    ...customWeights,
  };

  const rankings = candidates.map((service) => {
    const trust = service.trustScore ?? 50;
    const price = service.pricePerRequest ?? 0.05;
    const latency = service.averageLatencyMs ?? 500;
    const reliability = service.successRate ?? 90;

    // Normalizations (0 to 100)
    const trustNorm = Math.min(100, Math.max(0, trust));
    // Price norm: $0.00 = 100 score, >=$0.10 = 0 score
    const priceNorm = Math.min(100, Math.max(0, 100 * (1 - price / 0.10)));
    // Latency norm: <=100ms = 100 score, >=1000ms = 0 score
    const latencyNorm = Math.min(100, Math.max(0, 100 * (1 - Math.max(0, latency - 100) / 900)));
    const reliabilityNorm = Math.min(100, Math.max(0, reliability));

    const compositeScore = Number(
      (
        trustNorm * weights.trustWeight +
        priceNorm * weights.priceWeight +
        latencyNorm * weights.latencyWeight +
        reliabilityNorm * weights.reliabilityWeight
      ).toFixed(2)
    );

    return {
      serviceId: service._id?.toString() || service.name,
      name: service.name,
      score: compositeScore,
      trustScore: trust,
      price,
      latency,
      reliability,
      service,
    };
  });

  // Sort descending by composite score
  rankings.sort((a, b) => b.score - a.score);

  const winner = rankings[0];

  return {
    selectedService: winner.service,
    score: winner.score,
    rankings: rankings.map(({ service, ...rest }) => rest),
    reason: `Selected '${winner.name}' based on optimal combined weighted score (${winner.score}/100) considering Trust (${(weights.trustWeight * 100)}%), Price (${(weights.priceWeight * 100)}%), Latency (${(weights.latencyWeight * 100)}%), and Reliability (${(weights.reliabilityWeight * 100)}%).`,
  };
}
