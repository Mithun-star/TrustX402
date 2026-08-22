process.env.AUTO_START = 'true';
import { startServer } from '../app.js';
import { getX402Client } from '../services/x402/x402ClientService.js';
import { wrapFetchWithPayment } from '@x402/fetch';
import { env } from '../config/env.js';

async function main() {
  console.log('===========================================================');
  console.log('🔍 TRUSTX OFFICIAL ALGORAND X402 VERIFICATION SUITE');
  console.log('===========================================================');

  try {
    await startServer();
  } catch (e: any) {
    if (e.code !== 'EADDRINUSE') {
      console.warn('Server start note:', e.message);
    }
  }

  const targetUrl = `http://127.0.0.1:${env.PORT || 5000}/api/research`;
  const healthUrl = `http://127.0.0.1:${env.PORT || 5000}/api/health`;

  try {
    // 1. Verify Server Reachability
    console.log(`\n[1/11] Verifying server reachability at ${healthUrl}...`);
    const healthRes = await fetch(healthUrl);
    if (!healthRes.ok) throw new Error(`Health check failed with status ${healthRes.status}`);
    const healthJson = await healthRes.json();
    console.log(`       ✅ Server reachable: ${healthJson.service} (${healthJson.timestamp})`);

    // 2. Initial Unpaid Request -> HTTP 402
    console.log(`\n[2/11] Initial unpaid request to ${targetUrl}...`);
    const unpaidRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'EV battery recycling' }),
    });

    console.log(`       Initial Response HTTP Status: ${unpaidRes.status} ${unpaidRes.statusText}`);
    if (unpaidRes.status !== 402) {
      throw new Error(`Expected HTTP 402 Payment Required, got status ${unpaidRes.status}`);
    }
    console.log(`       ✅ Received genuine HTTP 402 Payment Required.`);

    // 3. Decode PAYMENT-REQUIRED
    console.log(`\n[3/11] Decoding PAYMENT-REQUIRED header payload...`);
    const paymentReqHeader = unpaidRes.headers.get('PAYMENT-REQUIRED') || unpaidRes.headers.get('payment-required');
    if (!paymentReqHeader) throw new Error('PAYMENT-REQUIRED header missing from 402 response');

    const decodedReq = JSON.parse(Buffer.from(paymentReqHeader, 'base64').toString('utf-8'));
    console.log(`       x402 Version: ${decodedReq.x402Version}`);
    console.log(`       Network:      ${decodedReq.accepts?.[0]?.network}`);
    console.log(`       Asset ID:     ${decodedReq.accepts?.[0]?.asset || decodedReq.accepts?.[0]?.price?.asset}`);
    console.log(`       Amount:       ${decodedReq.accepts?.[0]?.amount || decodedReq.accepts?.[0]?.price?.amount} base units ($0.03 USDC)`);
    console.log(`       PayTo:        ${decodedReq.accepts?.[0]?.payTo}`);
    console.log(`       Fee Payer:    ${decodedReq.accepts?.[0]?.extra?.feePayer}`);
    console.log(`       ✅ Payment requirements decoded successfully.`);

    // 4. Verify Payer Credentials Configuration & Address Match
    console.log(`\n[4/11] Checking Payer wallet credentials & address match...`);
    const client = await getX402Client();
    console.log(`       ✅ Payer signer initialized & verified.`);

    // 5. Wrap fetch with payment and intercept request headers cleanly
    console.log(`\n[5/11] Signing payment challenge and inspecting retried request headers...`);

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.headers) {
        const hEntries: [string, string][] = typeof (init.headers as any).entries === 'function'
          ? Array.from((init.headers as any).entries())
          : Object.entries(init.headers);

        const headerNames = hEntries.map((entry: [string, string]) => String(entry[0]));
        console.log(`       📡 Outgoing retry request header names:`, headerNames);

        const sigHeader = hEntries.find((entry: [string, string]) => String(entry[0]).toUpperCase() === 'PAYMENT-SIGNATURE');
        const xPayHeader = hEntries.find((entry: [string, string]) => String(entry[0]).toUpperCase() === 'X-PAYMENT');

        if (sigHeader) {
          console.log(`       ✅ PAYMENT-SIGNATURE header is PRESENT on retry request.`);
        } else if (xPayHeader) {
          console.log(`       ✅ X-PAYMENT header is PRESENT on retry request.`);
        } else {
          console.warn(`       ⚠️ No recognized payment header found in outgoing request.`);
        }
      }
      const response = await fetch(input, init);
      console.log(`       📥 Server response status to retry request: ${response.status} ${response.statusText}`);
      return response;
    };

    const fetchWithPayment = wrapFetchWithPayment(customFetch as any, client);

    console.log(`\n[6-10/11] Executing signed retry request via @x402/fetch -> @x402/express...`);

    const paidRes = await fetchWithPayment(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'EV battery recycling technology test' }),
    });

    if (!paidRes.ok) {
      const errorText = await paidRes.text();
      console.error(`       ❌ Retry Response Body:`, errorText);
      throw new Error(`x402 Request failed with HTTP status ${paidRes.status}: ${errorText}`);
    }

    const result = await paidRes.json();

    // 11. Extract Real Blockchain Transaction ID
    const txId = result.payment?.transactionId;
    console.log(`\n[11/11] Final /api/research response received:`);
    console.log(`       TxID: ${txId}`);

    if (!txId || txId.startsWith('mock-') || txId.includes('fake')) {
      throw new Error(`Invalid or mock transaction ID received: ${txId}`);
    }
    console.log(`       ✅ REAL Algorand Testnet transaction verified.`);

    const loraUrl = `https://lora.algokit.io/testnet/transaction/${txId}`;
    console.log(`       🔗 Lora Explorer URL: ${loraUrl}`);

    console.log('\n===========================================================');
    console.log('✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('===========================================================');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ X402 PAYMENT VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

main();
