process.env.AUTO_START = 'true';
import { startServer } from '../app.js';
import { env } from '../config/env.js';

async function test402() {
  console.log('===========================================================');
  console.log('🧪 TESTING UNPAID REQUEST TO POST /api/research');
  console.log('===========================================================');

  await startServer();

  const url = `http://127.0.0.1:${env.PORT}/api/research`;

  console.log(`📡 Sending unpaid POST request to ${url}...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'EV battery recycling technologies' }),
  });

  console.log(`\nRESPONSE STATUS: ${response.status} ${response.statusText}`);
  console.log('RESPONSE HEADERS:');
  response.headers.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });

  const bodyText = await response.text();
  console.log('\nRESPONSE BODY:', bodyText);

  const paymentRequiredHeader = response.headers.get('PAYMENT-REQUIRED') || response.headers.get('payment-required');

  if (response.status === 402 && paymentRequiredHeader) {
    console.log('\n===========================================================');
    console.log('✅ TEST PASSED: POST /api/research returned genuine HTTP 402 Payment Required!');
    console.log('===========================================================');
    
    // Decode base64 header
    try {
      const decodedJson = Buffer.from(paymentRequiredHeader, 'base64').toString('utf-8');
      console.log('DECODED PAYMENT-REQUIRED HEADER PAYLOAD:');
      console.log(JSON.stringify(JSON.parse(decodedJson), null, 2));
    } catch (e) {
      console.log('Raw header:', paymentRequiredHeader);
    }
    
    process.exit(0);
  } else {
    console.error('\n❌ TEST FAILED: Expected status 402 with PAYMENT-REQUIRED header.');
    process.exit(1);
  }
}

test402();
