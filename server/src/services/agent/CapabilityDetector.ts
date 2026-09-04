import { CapabilityDetectionResult } from '@trustx/shared';

interface CapabilityRule {
  capability: string;
  keywords: string[];
  patterns: RegExp[];
  defaultReason: string;
}

const CAPABILITY_RULES: CapabilityRule[] = [
  {
    capability: 'ev_battery_research',
    keywords: ['ev', 'battery', 'recycling', 'ev battery', 'lithium', 'clean energy', 'cathode', 'hydrometallurgical', 'energy storage'],
    patterns: [/ev\s+battery/i, /battery\s+recycling/i, /lithium.*recycling/i, /battery/i, /recycling/i],
    defaultReason: 'The user prompt requests EV battery systems, lithium recycling, clean energy, or battery technology research.',
  },
  {
    capability: 'research',
    keywords: ['research', 'investigate', 'study', 'technology', 'market', 'trends', 'finding', 'state-of-the-art', 'paper', 'journal'],
    patterns: [/research/i, /investigate/i, /study/i, /trends/i],
    defaultReason: 'The user request calls for domain research, technical investigation, or trend analysis.',
  },
  {
    capability: 'sentiment_analysis',
    keywords: ['sentiment', 'reviews', 'customer feedback', 'opinion', 'satisfaction', 'ratings', 'nps', 'feedback'],
    patterns: [/sentiment/i, /customer\s+reviews/i, /opinion/i, /feedback/i],
    defaultReason: 'The request requires NLP sentiment analysis and customer feedback categorization.',
  },
  {
    capability: 'translation',
    keywords: ['translate', 'translation', 'japanese', 'hindi', 'spanish', 'french', 'german', 'mandarin', 'language', 'convert language'],
    patterns: [/translate/i, /into\s+(japanese|hindi|spanish|french|german|mandarin|chinese|english|italian)/i],
    defaultReason: 'The request requires multi-lingual text translation and linguistic adaptation.',
  },
  {
    capability: 'data_analysis',
    keywords: ['csv', 'data', 'analyze', 'analysis', 'anomalies', 'dataset', 'statistics', 'dataframe', 'metrics'],
    patterns: [/csv/i, /analyze\s+data/i, /data\s+analysis/i, /anomaly/i, /anomalies/i, /statistics/i],
    defaultReason: 'The request asks for data processing, CSV analysis, statistical inspection, or anomaly detection.',
  },
  {
    capability: 'image_generation',
    keywords: ['image', 'picture', 'photo', 'generate image', 'draw', 'render', 'futuristic', 'artwork', 'visual', 'illustration'],
    patterns: [/generate\s+image/i, /draw/i, /render/i, /picture/i, /artwork/i, /futuristic\s+city/i],
    defaultReason: 'The user prompt requests visual synthesis or generative image creation.',
  },
  {
    capability: 'summarization',
    keywords: ['summarize', 'summary', 'tldr', 'key points', 'condense', 'abstract', 'digest', 'shorten'],
    patterns: [/summarize/i, /summary/i, /tldr/i, /key\s+findings/i, /condense/i],
    defaultReason: 'The request specifies text summarization or extracting high-level findings.',
  },
  {
    capability: 'code_analysis',
    keywords: ['code', 'audit', 'smart contract', 'vulnerability', 'solidity', 'security review', 'bug', 'refactor', 'static analysis'],
    patterns: [/code/i, /audit/i, /vulnerability/i, /solidity/i, /smart\s+contract/i, /security\s+review/i],
    defaultReason: 'The user asks for software code inspection, vulnerability auditing, or security static analysis.',
  },
  {
    capability: 'document_conversion',
    keywords: ['convert', 'pdf', 'document', 'docx', 'markdown', 'format', 'export pdf'],
    patterns: [/convert.*pdf/i, /document\s+conversion/i, /export\s+to\s+pdf/i, /format\s+document/i],
    defaultReason: 'The request specifies file format conversion or document transformation.',
  },
  {
    capability: 'academic_search',
    keywords: ['academic', 'paper', 'journal', 'arxiv', 'ieee', 'scholar', 'citations', 'peer-reviewed'],
    patterns: [/academic/i, /arxiv/i, /journal/i, /peer-reviewed/i, /citations/i],
    defaultReason: 'The user prompt focuses on academic literature search and peer-reviewed citations.',
  },
  {
    capability: 'weather',
    keywords: ['weather', 'forecast', 'temperature', 'climate', 'rain', 'humidity'],
    patterns: [/weather/i, /forecast/i, /temperature/i, /climate/i],
    defaultReason: 'The user prompt asks for meteorology and weather forecast telemetry.',
  },
  {
    capability: 'content_generation',
    keywords: ['product description', 'blog', 'copywriting', 'write article', 'generate text', 'laptop description', 'marketing copy'],
    patterns: [/product\s+description/i, /blog\s+post/i, /write\s+an?\s+article/i, /copywriting/i],
    defaultReason: 'The prompt requires creative content generation or product copy drafting.',
  },
  {
    capability: 'computation',
    keywords: ['calculation', 'financial', 'roi', 'interest', 'compute', 'formula', 'algebra', 'math'],
    patterns: [/financial\s+calculation/i, /calculate/i, /compute/i, /roi/i, /interest\s+rate/i],
    defaultReason: 'The prompt specifies mathematical, financial, or computational evaluation.',
  },
];

export function detectCapability(userRequest: string): CapabilityDetectionResult {
  const normalized = userRequest.toLowerCase().trim();
  let bestMatch: CapabilityRule | null = null;
  let maxMatchedCount = 0;
  let matchedKeywords: string[] = [];

  for (const rule of CAPABILITY_RULES) {
    const hits: string[] = [];

    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        hits.push(kw);
      }
    }

    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        hits.push(`pattern:${pattern.source}`);
      }
    }

    if (hits.length > maxMatchedCount) {
      maxMatchedCount = hits.length;
      bestMatch = rule;
      matchedKeywords = hits;
    }
  }

  if (bestMatch && maxMatchedCount > 0) {
    const confidence = Math.min(0.95, 0.70 + maxMatchedCount * 0.08);
    return {
      capability: bestMatch.capability,
      confidence: Number(confidence.toFixed(2)),
      reason: bestMatch.defaultReason,
      keywordsMatched: matchedKeywords,
    };
  }

  // Fallback: Research capability if unspecified, but with general explanation
  return {
    capability: 'research',
    confidence: 0.60,
    reason: `Extracted fallback capability 'research' based on general informational query patterns in prompt: "${userRequest}".`,
    keywordsMatched: [],
  };
}
