import { env } from '../config/env.js';

async function test() {
  const url = `http://127.0.0.1:${env.PORT || 5000}/api/research`;
  console.log(`📡 Sending unpaid POST request to ${url}...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'EV battery recycling technologies' }),
  });

  console.log('\n--- RESPONSE STATUS ---');
  console.log(`HTTP/1.1 ${response.status} ${response.statusText}`);

  console.log('\n--- RESPONSE HEADERS ---');
  response.headers.forEach((val, key) => {
    console.log(`${key}: ${val}`);
  });

  console.log('\n--- RESPONSE BODY ---');
  const bodyText = await response.text();
  console.log(bodyText);

  const paymentReqHeader = response.headers.get('PAYMENT-REQUIRED') || response.headers.get('payment-required');
  if (paymentReqHeader) {
    console.log('\n--- DECODED PAYMENT-REQUIRED HEADER ---');
    try {
      const decoded = Buffer.from(paymentReqHeader, 'base64').toString('utf-8');
      console.log(JSON.stringify(JSON.parse(decoded), null, 2));
    } catch {
      console.log(paymentReqHeader);
    }
  }
}

test();
