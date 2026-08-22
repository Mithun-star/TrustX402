import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { ExactAvmScheme } from '@x402/avm/exact/client';
import { toClientAvmSigner } from '@x402/avm';
import { validateMnemonic, mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { peikertXHdWalletGenerator } from '@algorandfoundation/algokit-utils/crypto';
import { generateAddressWithSigners, bytesForSigning, encodeSignedTransaction, decodeTransaction } from '@algorandfoundation/algokit-utils/transact';
import algosdk from 'algosdk';
import { env } from '../../config/env.js';

let cachedClient: any = null;

export async function createAvmSignerFromCredential(rawCredential: string) {
  const cleaned = rawCredential.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, ' ');
  const words = cleaned.split(' ');

  // 1. Handle 24-word BIP-39 Pera Universal Wallet mnemonic (ARC-0052 Peikert HD m/44'/283'/0'/0/0)
  if (words.length === 24) {
    if (!validateMnemonic(cleaned, wordlist)) {
      throw new Error('Invalid 24-word BIP-39 recovery phrase checksum.');
    }
    const entropy = mnemonicToEntropy(cleaned, wordlist);
    const wallet = await peikertXHdWalletGenerator(entropy);
    const account = await wallet.accountGenerator(0, 0);
    const algokitSigners = generateAddressWithSigners({
      ed25519Pubkey: account.ed25519Pubkey,
      rawEd25519Signer: account.rawEd25519Signer,
    });

    const address = algokitSigners.addr.toString();

    return {
      address,
      signTransactions: async (txns: Uint8Array[], indexesToSign?: number[]) => {
        return Promise.all(
          txns.map(async (txn, i) => {
            if (indexesToSign && !indexesToSign.includes(i)) return null;

            const decoded = decodeTransaction(txn);
            const msgToSign = bytesForSigning.transaction(decoded);
            const sig = await account.rawEd25519Signer(msgToSign);

            return encodeSignedTransaction({ txn: decoded, sig });
          })
        );
      },
    };
  }

  // 2. Handle 25-word Legacy Algo25 account mnemonic
  if (words.length === 25) {
    const account = algosdk.mnemonicToSecretKey(cleaned);
    const base64Key = Buffer.from(account.sk).toString('base64');
    return toClientAvmSigner(base64Key);
  }

  // 3. Handle Base64 64-byte key string
  const base64Buf = Buffer.from(cleaned, 'base64');
  if (base64Buf.length === 64) {
    return toClientAvmSigner(cleaned);
  }

  // 4. Handle Hex string (64 bytes / 128 chars or 32 bytes / 64 chars)
  if (/^[0-9a-fA-F]+$/.test(cleaned)) {
    const hexBuf = Buffer.from(cleaned, 'hex');
    if (hexBuf.length === 64) {
      return toClientAvmSigner(hexBuf.toString('base64'));
    }
    if (hexBuf.length === 32) {
      const keys = algosdk.mnemonicToSecretKey(algosdk.secretKeyToMnemonic(hexBuf));
      return toClientAvmSigner(Buffer.from(keys.sk).toString('base64'));
    }
  }

  throw new Error('AVM credential in .env must be a valid AVM_PRIVATE_KEY (Base64/Hex key) or AVM_MNEMONIC (24/25 words).');
}

export async function createAvmSignerFromMnemonic(rawEnvValue: string) {
  return createAvmSignerFromCredential(rawEnvValue);
}

export async function getX402Client() {
  if (cachedClient) return cachedClient;

  const credential = env.AVM_PRIVATE_KEY || env.AVM_MNEMONIC;

  if (!credential || credential.trim().length === 0) {
    throw new Error('Neither AVM_PRIVATE_KEY nor AVM_MNEMONIC environment variable is configured in .env.');
  }

  const signer = await createAvmSignerFromCredential(credential);
  const expectedAddress = env.PAYMENT_PAYER_ADDRESS || 'ZULDAZZAIB472IVXTLGG43VQNURNQ3OFJ73WSC4N4BQP4HNDDPMPT7B2ZU';

  // CRITICAL SAFETY CHECK: Verify derived signer address equals configured Payer address before settlement
  if (signer.address !== expectedAddress) {
    throw new Error(
      `CRITICAL SAFETY CHECK FAILED: Derived signer address (${signer.address}) does not match expected Payer address (${expectedAddress}). Settlement aborted to prevent unauthorized spending or failed challenge.`
    );
  }

  console.log(`✅ Verified Payer signer address matches expected: ${signer.address}`);

  const networkKey = env.X402_NETWORK as `${string}:${string}`;
  const caip2ShortKey = 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe' as `${string}:${string}`;

  cachedClient = new x402Client()
    .register(networkKey, new ExactAvmScheme(signer as any))
    .register(caip2ShortKey, new ExactAvmScheme(signer as any));

  return cachedClient;
}

export async function executeX402PaidRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const client = await getX402Client();
  const fetchWithPayment = wrapFetchWithPayment(fetch as any, client);

  const requestOptions: RequestInit = {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (options.body) {
    requestOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  console.log(`🚀 [x402 Client] Dispatching request via @x402/fetch to ${url}...`);
  const response = await fetchWithPayment(url, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`x402 Request failed with HTTP status ${response.status}: ${errorText}`);
  }

  const jsonResult = await response.json();
  console.log(`✅ [x402 Client] Paid request succeeded! TxID: ${jsonResult.payment?.transactionId || 'N/A'}`);
  return jsonResult;
}
