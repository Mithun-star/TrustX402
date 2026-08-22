import assert from 'node:assert';
import test, { describe } from 'node:test';
import algosdk from 'algosdk';
import { getX402Client } from '../services/x402/x402ClientService.js';
import { env } from '../config/env.js';

describe('x402 AVM Transaction Encoding & Asset ID Verification', () => {
  test('generated payment transaction contains ASA 10458941, amount 30000, and correct receiver', async () => {
    const client = await getX402Client();

    const networkKey = env.X402_NETWORK || 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';
    const receiverAddress = env.PAYMENT_RECEIVER_ADDRESS || 'N6Y4IYI4GTZJQLJNUSJS2UXWWTUQMKOMHQK3ZPUS5KGPREVZ5HJPCOQ5WA';

    const requirements = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact',
          network: networkKey,
          amount: '30000',
          asset: '10458941',
          payTo: receiverAddress,
          extra: { feePayer: 'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA' },
        },
      ],
    };

    const payload = await client.createPaymentPayload(requirements);
    assert.strictEqual(payload.x402Version, 2);

    const paymentGroup = payload.payload.paymentGroup;
    const paymentIndex = payload.payload.paymentIndex;

    assert.ok(Array.isArray(paymentGroup), 'paymentGroup must be an array');
    assert.ok(paymentIndex >= 0 && paymentIndex < paymentGroup.length, 'paymentIndex must be valid');

    const encodedTx = paymentGroup[paymentIndex];
    const txBytes = Buffer.from(encodedTx, 'base64');
    const stxn = algosdk.decodeSignedTransaction(txBytes);

    const txn = stxn.txn;
    assert.strictEqual(txn.type, 'axfer', 'Transaction type must be axfer (Asset Transfer)');

    const assetTransfer = (txn as any).assetTransfer;
    assert.ok(assetTransfer, 'Transaction must contain assetTransfer details');

    const assetIdBigInt = assetTransfer.assetIndex ?? assetTransfer.assetId ?? 0n;
    const assetIdStr = assetIdBigInt.toString();
    assert.strictEqual(assetIdStr, '10458941', 'xaid must equal 10458941 (USDC ASA)');

    const amountStr = assetTransfer.amount ? assetTransfer.amount.toString() : '0';
    assert.strictEqual(amountStr, '30000', 'Amount must equal 30000 base units ($0.03 USDC)');

    const receiverStr = assetTransfer.receiver ? assetTransfer.receiver.toString() : '';
    assert.strictEqual(receiverStr, receiverAddress, 'Receiver must match configured receiver address');
  });
});
