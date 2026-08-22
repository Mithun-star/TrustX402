import assert from 'node:assert';
import test, { describe } from 'node:test';
import algosdk from 'algosdk';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { createAvmSignerFromCredential, getX402Client } from '../services/x402/x402ClientService.js';
import { env } from '../config/env.js';

describe('AVM Credential & Key Conversion Unit Tests', () => {
  test('supports AVM_PRIVATE_KEY Base64 64-byte key derivation', async () => {
    const acc = algosdk.generateAccount();
    const base64Key = Buffer.from(acc.sk).toString('base64');

    const signer = await createAvmSignerFromCredential(base64Key);
    assert.strictEqual(signer.address, acc.addr.toString(), 'Signer address must match generated account address');
    assert.strictEqual(typeof signer.signTransactions, 'function');
  });

  test('supports 24-word BIP-39 Pera Universal Wallet derivation', async () => {
    const bip39Mnemonic = generateMnemonic(wordlist, 256);
    assert.strictEqual(bip39Mnemonic.split(' ').length, 24);

    const signer = await createAvmSignerFromCredential(bip39Mnemonic);
    assert.ok(signer.address, 'Signer must have a valid Algorand address string');
    assert.strictEqual(typeof signer.signTransactions, 'function');
  });

  test('supports 25-word Legacy Algo25 mnemonic derivation', async () => {
    const acc = algosdk.generateAccount();
    const algo25Mnemonic = algosdk.secretKeyToMnemonic(acc.sk);
    assert.strictEqual(algo25Mnemonic.split(' ').length, 25);

    const signer = await createAvmSignerFromCredential(algo25Mnemonic);
    assert.strictEqual(signer.address, acc.addr.toString());
    assert.strictEqual(typeof signer.signTransactions, 'function');
  });

  test('aborts if derived signer address does not match expected Payer address', async () => {
    const dummyAcc = algosdk.generateAccount();
    const dummyKey = Buffer.from(dummyAcc.sk).toString('base64');
    
    // Save original env values
    const origKey = env.AVM_PRIVATE_KEY;
    const origMnem = env.AVM_MNEMONIC;
    const origAddr = env.PAYMENT_PAYER_ADDRESS;

    try {
      env.AVM_PRIVATE_KEY = dummyKey;
      env.AVM_MNEMONIC = '';
      env.PAYMENT_PAYER_ADDRESS = 'SOME_UNMATCHED_EXPECTED_PAYER_ADDRESS_STRING';

      await assert.rejects(
        async () => {
          await getX402Client();
        },
        (err: any) => {
          return err.message.includes('CRITICAL SAFETY CHECK FAILED');
        },
        'Must reject with CRITICAL SAFETY CHECK FAILED when addresses mismatch'
      );
    } finally {
      // Restore original env values
      env.AVM_PRIVATE_KEY = origKey;
      env.AVM_MNEMONIC = origMnem;
      env.PAYMENT_PAYER_ADDRESS = origAddr;
    }
  });
});
