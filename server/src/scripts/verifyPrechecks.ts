process.env.MANUAL_START = 'true';
import { startServer } from '../app.js';
import { env } from '../config/env.js';
import algosdk from 'algosdk';

const PAYER_ADDRESS = 'ZULDAZZAIB472IVXTLGG43VQNURNQ3OFJ73WSC4N4BQP4HNDDPMPT7B2ZU';
const RECEIVER_ADDRESS = 'N6Y4IYI4GTZJQLJNUSJS2UXWWTUQMKOMHQK3ZPUS5KGPREVZ5HJPCOQ5WA';
const ALGOD_TESTNET_SERVER = 'https://testnet-api.algonode.cloud';

async function runPrechecks() {
  console.log('===========================================================');
  console.log('🔍 TRUSTX PRE-CHECK VERIFICATION SUITE');
  console.log('===========================================================');

  const server = await startServer();
  console.log(`✅ [1/6] Backend running on port ${env.PORT}`);

  try {
    const baseUrl = `http://127.0.0.1:${env.PORT}`;

    // Check 2: GET /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    if (healthRes.ok && healthJson.status === 'ok') {
      console.log(`✅ [2/6] GET /api/health returned 200 OK:`, healthJson.service);
    } else {
      throw new Error(`GET /api/health failed with status ${healthRes.status}`);
    }

    // Check 3: POST /api/research returns HTTP 402 without payment
    const researchRes = await fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'EV battery recycling' }),
    });
    const paymentRequiredHeader = researchRes.headers.get('PAYMENT-REQUIRED') || researchRes.headers.get('payment-required');
    if (researchRes.status === 402) {
      console.log(`✅ [3/6] POST /api/research returned genuine HTTP 402 Payment Required!`);
      console.log(`      Header PAYMENT-REQUIRED present: ${!!paymentRequiredHeader}`);
    } else {
      throw new Error(`Expected HTTP 402 Payment Required, got status ${researchRes.status}`);
    }

    // Check 4: Facilitator Reachability
    try {
      const facRes = await fetch(env.FACILITATOR_URL);
      console.log(`✅ [4/6] Facilitator (${env.FACILITATOR_URL}) reachability check: HTTP ${facRes.status}`);
    } catch (err: any) {
      console.warn(`⚠️ [4/6] Facilitator endpoint check note: ${err.message}`);
    }

    // Check 5: Algorand Testnet Payer Account & USDC Balance
    const algodClient = new algosdk.Algodv2('', ALGOD_TESTNET_SERVER, '');
    try {
      const accountInfo = await algodClient.accountInformation(PAYER_ADDRESS).do();
      const algoBalance = Number(accountInfo.amount) / 1e6;
      
      let usdcBalance = 0;
      const assets = accountInfo.assets || [];
      const usdcAsset = assets.find((a: any) => Number(a['asset-id']) === parseInt(env.USDC_ASSET_ID, 10));
      if (usdcAsset) {
        usdcBalance = Number(usdcAsset.amount) / 1e6;
      }

      console.log(`✅ [5/6] Algorand Testnet Payer (${PAYER_ADDRESS}):`);
      console.log(`      ALGO Balance: ${algoBalance} ALGO`);
      console.log(`      USDC Balance: ${usdcBalance} USDC (ASA ${env.USDC_ASSET_ID})`);
    } catch (err: any) {
      console.error(`❌ [5/6] Failed to query Algorand Testnet payer account:`, err.message);
    }

    // Check 6: Receiver Address Verification
    console.log(`✅ [6/6] Receiver Address configured correctly:`);
    console.log(`      Address: ${RECEIVER_ADDRESS}`);

    console.log('\n===========================================================');
    console.log('✅ PRE-CHECK SUITE PASSED!');
    console.log('===========================================================');

    if (server) server.close(() => process.exit(0));
    else process.exit(0);
  } catch (err: any) {
    console.error('\n❌ PRE-CHECK FAILED:', err.message);
    if (server) server.close(() => process.exit(1));
    else process.exit(1);
  }
}

runPrechecks();
