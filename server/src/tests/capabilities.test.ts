import assert from 'node:assert';
import test, { describe } from 'node:test';
import { detectCapability } from '../services/agent/CapabilityDetector.js';
import { findServicesByCapability, registerNewService } from '../services/registry/ServiceRegistry.js';
import { createPaymentSession, updatePaymentSessionStatus, getPaymentSession } from '../services/payment/PaymentSessionService.js';

describe('Capability Detection & Payment Session Unit Tests', () => {
  test('EV battery recycling request maps to ev_battery_research capability', () => {
    const res = detectCapability('Research the best technologies for EV battery recycling.');
    assert.strictEqual(res.capability, 'ev_battery_research');
    assert.ok(res.confidence >= 0.7);
  });

  test('Sentiment analysis request maps to sentiment_analysis capability', () => {
    const res = detectCapability('Analyze sentiment of these customer reviews');
    assert.strictEqual(res.capability, 'sentiment_analysis');
    assert.ok(res.confidence >= 0.7);
  });

  test('Translation request maps to translation capability', () => {
    const res = detectCapability('Translate this paragraph into Japanese');
    assert.strictEqual(res.capability, 'translation');
    assert.ok(res.confidence >= 0.7);
  });

  test('Data analysis request maps to data_analysis capability', () => {
    const res = detectCapability('Analyze this CSV dataset for anomalies');
    assert.strictEqual(res.capability, 'data_analysis');
    assert.ok(res.confidence >= 0.7);
  });

  test('Image generation request maps to image_generation capability', () => {
    const res = detectCapability('Generate an image of a futuristic city');
    assert.strictEqual(res.capability, 'image_generation');
    assert.ok(res.confidence >= 0.7);
  });

  test('Service discovery returns only ev_battery_research providers for EV battery queries', async () => {
    const services = await findServicesByCapability('ev_battery_research');
    assert.ok(services.length > 0, 'Must find at least one EV battery research service');
    assert.ok(
      services.every((s) => !s.name.includes('Sentiment')),
      'EV battery research candidate services MUST NOT contain Sentiment Analytics API'
    );
  });

  test('Service discovery returns Sentiment Analytics Pro for sentiment queries', async () => {
    const services = await findServicesByCapability('sentiment_analysis');
    assert.ok(services.length > 0, 'Must find sentiment service');
    assert.ok(
      services.some((s) => s.name.includes('Sentiment')),
      'Sentiment discovery must return Sentiment Analytics Pro'
    );
    assert.ok(
      services.every((s) => !s.name.includes('Research Core')),
      'Sentiment candidate services MUST NOT contain EV research providers'
    );
  });

  test('Registering a new service allows dynamic capability discovery', async () => {
    const newService = await registerNewService({
      name: 'Quantum Analysis Engine Unit Test Service',
      description: 'Quantum statistics calculation engine',
      endpoint: 'http://127.0.0.1:5000/api/research',
      category: 'compute',
      capabilities: ['quantum_computing', 'quantum_statistics'],
      pricePerRequest: 0.05,
    });

    assert.ok(newService._id);
    const discovered = await findServicesByCapability('quantum_statistics');
    assert.ok(discovered.some((s) => s.name === newService.name));
  });

  test('createPaymentSession and updatePaymentSessionStatus update status correctly', async () => {
    const session = await createPaymentSession({
      userRequest: 'Analyze dataset for anomalies',
      capability: 'data_analysis',
      selectedService: {
        _id: 'test-1',
        name: 'Test Service',
        description: 'Test Service Description',
        endpoint: 'http://127.0.0.1:5000/api/research',
        category: 'research',
        pricePerRequest: 0.03,
        currency: 'USDC',
        network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
        trustScore: 90,
        successRate: 99,
        averageLatencyMs: 200,
        availability: 99.9,
        transactionCount: 100,
        status: 'active',
        capabilities: ['research'],
      },
      paymentRequirements: {
        network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
        asset: '10458941',
        amount: 30000,
        payTo: 'N6Y4IYI4GTZJQLJNUSJS2UXWWTUQMKOMHQK3ZPUS5KGPREVZ5HJPCOQ5WA',
      },
      amount: 0.03,
    });

    assert.ok(session.sessionId);
    assert.strictEqual(session.status, 'payment_required');

    const updated = await updatePaymentSessionStatus(session.sessionId, 'settled', { transactionId: 'tx-12345' });
    assert.strictEqual(updated.status, 'settled');
    assert.strictEqual(updated.transactionId, 'tx-12345');

    const fetched = await getPaymentSession(session.sessionId);
    assert.strictEqual(fetched?.status, 'settled');
  });
});
