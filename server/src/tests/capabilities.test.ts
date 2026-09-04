import assert from 'node:assert';
import test, { describe } from 'node:test';
import { detectCapability } from '../services/agent/CapabilityDetector.js';
import { findServicesByCapability, registerService } from '../services/registry/ServiceRegistry.js';
import { prepareAgentWorkflow, confirmAndExecutePaymentSession } from '../services/agent/AIAgentService.js';
import { getPaymentSession, updatePaymentSessionStatus } from '../services/payment/PaymentSessionService.js';

describe('Capability Detection & Payment Session Unit Tests', () => {
  test('Research request maps to research capability', () => {
    const res = detectCapability('Research the latest EV battery recycling technologies');
    assert.strictEqual(res.capability, 'research');
    assert.ok(res.confidence >= 0.7);
  });

  test('Translation request maps to translation capability', () => {
    const res = detectCapability('Translate this paragraph into Japanese');
    assert.strictEqual(res.capability, 'translation');
    assert.ok(res.confidence >= 0.7);
  });

  test('Data analysis request maps to data_analysis capability', () => {
    const res = detectCapability('Analyze this CSV and identify anomalies');
    assert.strictEqual(res.capability, 'data_analysis');
    assert.ok(res.confidence >= 0.7);
  });

  test('Image generation request maps to image_generation capability', () => {
    const res = detectCapability('Generate an image of a futuristic city');
    assert.strictEqual(res.capability, 'image_generation');
    assert.ok(res.confidence >= 0.7);
  });

  test('Service discovery returns matching services for capability', async () => {
    const services = await findServicesByCapability('translation');
    assert.ok(services.length > 0, 'Must find at least one translation service');
    assert.strictEqual(services[0].name, 'Translation Nexus');
  });

  test('Registering a new service allows dynamic capability discovery', async () => {
    const newService = await registerService({
      name: 'Quantum Analysis Engine Unit Test Service',
      description: 'Quantum statistics calculation engine',
      endpoint: 'http://127.0.0.1:5000/api/data-analysis',
      category: 'compute',
      capabilities: ['quantum_computing', 'quantum_statistics'],
      pricePerRequest: 0.05,
      provider: 'Quantum Corp',
    });

    assert.ok(newService._id);
    const discovered = await findServicesByCapability('quantum_statistics');
    assert.ok(discovered.some((s) => s.name === newService.name));
  });

  test('prepareAgentWorkflow creates a payment session requiring user confirmation', async () => {
    const prepared = await prepareAgentWorkflow('Translate hello world into Japanese');
    assert.ok(prepared.agentRun);
    assert.strictEqual(prepared.agentRun.paymentStatus, 'payment_required');
    assert.ok(prepared.paymentSession);
    assert.strictEqual(prepared.paymentSession.status, 'payment_required');
    assert.strictEqual(prepared.paymentSession.amount, 0.02);
  });

  test('User session cancellation sets status to cancelled', async () => {
    const prepared = await prepareAgentWorkflow('Analyze dataset for anomalies');
    assert.ok(prepared.paymentSession);
    const cancelled = await updatePaymentSessionStatus(prepared.paymentSession.sessionId, 'cancelled');
    assert.strictEqual(cancelled.status, 'cancelled');

    await assert.rejects(
      async () => {
        await confirmAndExecutePaymentSession(prepared.paymentSession!.sessionId);
      },
      (err: any) => err.message.includes('cancelled')
    );
  });
});
