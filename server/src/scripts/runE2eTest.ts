process.env.AUTO_START = 'true';
import { startServer } from '../app.js';
import { runAgentWorkflow } from '../services/agent/AIAgentService.js';
import { disconnectDB } from '../config/db.js';

async function runE2E() {
  console.log('===========================================================');
  console.log('🧪 RUNNING TRUSTX REAL ALGORAND TESTNET X402 PAYMENT E2E TEST');
  console.log('===========================================================');

  try {
    await startServer();
  } catch (e: any) {
    if (e.code === 'EADDRINUSE') {
      console.log('ℹ️ Server is already running on port 5000, proceeding with E2E test execution...');
    } else {
      console.warn('⚠️ Server startup note:', e.message);
    }
  }

  try {
    // Test Scenario 1: SAFE DEMO (EV Battery Research)
    console.log('\n--- SCENARIO 1: SAFE DEMO REQUEST ---');
    const safeRun = await runAgentWorkflow('Research the best technologies for EV battery recycling.');
    console.log(`Status:        ${safeRun.paymentStatus.toUpperCase()}`);
    console.log(`Service:       ${safeRun.selectedService?.name}`);
    console.log(`TransactionID: ${safeRun.transactionId || 'N/A'}`);

    safeRun.steps.forEach((s) => {
      console.log(` Step ${s.stepIndex}: [${s.status.toUpperCase()}] ${s.title}`);
      if (s.data && s.data.error) {
        console.log(`    ❌ ERROR DATA:`, s.data.error);
      }
    });

    if (safeRun.paymentStatus !== 'settled') {
      throw new Error(`Scenario 1 failed: expected paymentStatus 'settled', got '${safeRun.paymentStatus}'`);
    }

    // Test Scenario 2: UNSAFE DEMO (Low-Trust Provider & Exceeds Budget)
    console.log('\n--- SCENARIO 2: UNSAFE DEMO REQUEST ---');
    const unsafeRun = await runAgentWorkflow(
      'Research EV battery recycling using unverified shadow provider.',
      'Unverified Shadow Data (Unsafe Service X)'
    );
    console.log(`Status:        ${unsafeRun.paymentStatus.toUpperCase()}`);
    console.log(`Selected:      ${unsafeRun.selectedService?.name}`);

    if (unsafeRun.paymentStatus !== 'blocked') {
      throw new Error(`Scenario 2 failed: expected paymentStatus 'blocked', got '${unsafeRun.paymentStatus}'`);
    }

    console.log('\n===========================================================');
    console.log('✅ ALL END-TO-END ACCEPTANCE SCENARIOS PASSED SUCCESSFULLY!');
    console.log('===========================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    await disconnectDB();
    process.exit(1);
  }
}

runE2E();
