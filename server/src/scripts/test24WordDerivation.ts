import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateMnemonic, mnemonicToEntropy, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { peikertXHdWalletGenerator } from '@algorandfoundation/algokit-utils/crypto';
import { generateAddressWithSigners } from '@algorandfoundation/algokit-utils/transact';
import algosdk from 'algosdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const EXPECTED_PAYER_ADDRESS = 'ZULDAZZAIB472IVXTLGG43VQNURNQ3OFJ73WSC4N4BQP4HNDDPMPT7B2ZU';

async function testDerivation() {
  console.log('===========================================================');
  console.log('🔍 TESTING 24-WORD BIP-39 PERA UNIVERSAL WALLET DERIVATION');
  console.log('===========================================================');

  const rawMnemonic = (process.env.AVM_MNEMONIC || '').trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, ' ');

  if (!rawMnemonic) {
    console.error('❌ AVM_MNEMONIC is empty in .env');
    process.exit(1);
  }

  const words = rawMnemonic.split(' ');
  console.log(`Word Count: ${words.length}`);

  if (words.length !== 24) {
    console.error(`❌ Expected 24-word BIP-39 mnemonic, got ${words.length} words.`);
    process.exit(1);
  }

  const isValidBip39 = validateMnemonic(rawMnemonic, wordlist);
  console.log(`BIP-39 Checksum Valid: ${isValidBip39}`);

  if (!isValidBip39) {
    console.error('❌ Invalid BIP-39 mnemonic phrase (checksum failed).');
    process.exit(1);
  }

  let matchedAddress: string | null = null;
  let matchedSigner: any = null;

  // Strategy 1: Peikert HD Generator with Entropy
  try {
    const entropy = mnemonicToEntropy(rawMnemonic, wordlist);
    const wallet = await peikertXHdWalletGenerator(entropy);

    for (let accountIdx = 0; accountIdx < 5; accountIdx++) {
      for (let keyIdx = 0; keyIdx < 5; keyIdx++) {
        const acc = await wallet.accountGenerator(accountIdx, keyIdx);
        const signers = generateAddressWithSigners({
          ed25519Pubkey: acc.ed25519Pubkey,
          rawEd25519Signer: acc.rawEd25519Signer,
        });
        const addr = signers.addr.toString();
        if (addr === EXPECTED_PAYER_ADDRESS) {
          matchedAddress = addr;
          matchedSigner = signers;
          console.log(`\n✅ MATCH FOUND using Strategy 1 (Entropy Peikert HD) at account ${accountIdx}, index ${keyIdx}!`);
          break;
        }
      }
      if (matchedAddress) break;
    }
  } catch (e: any) {
    console.warn('Strategy 1 note:', e.message);
  }

  // Strategy 2: Peikert HD Generator with 32-byte seed from SeedSync
  if (!matchedAddress) {
    try {
      const seed64 = mnemonicToSeedSync(rawMnemonic);
      const seed32 = seed64.subarray(0, 32);
      const wallet = await peikertXHdWalletGenerator(seed32);

      for (let accountIdx = 0; accountIdx < 5; accountIdx++) {
        for (let keyIdx = 0; keyIdx < 5; keyIdx++) {
          const acc = await wallet.accountGenerator(accountIdx, keyIdx);
          const signers = generateAddressWithSigners({
            ed25519Pubkey: acc.ed25519Pubkey,
            rawEd25519Signer: acc.rawEd25519Signer,
          });
          const addr = signers.addr.toString();
          if (addr === EXPECTED_PAYER_ADDRESS) {
            matchedAddress = addr;
            matchedSigner = signers;
            console.log(`\n✅ MATCH FOUND using Strategy 2 (Seed32 Peikert HD) at account ${accountIdx}, index ${keyIdx}!`);
            break;
          }
        }
        if (matchedAddress) break;
      }
    } catch (e: any) {
      console.warn('Strategy 2 note:', e.message);
    }
  }

  // Strategy 3: Standard algosdk seed key (if 24 bytes seed mapped)
  if (!matchedAddress) {
    try {
      const entropy = mnemonicToEntropy(rawMnemonic, wordlist);
      // Create 32-byte key from 32-byte entropy
      const keyPair = algosdk.mnemonicToSecretKey(algosdk.secretKeyToMnemonic(entropy));
      const addr = keyPair.addr.toString();
      if (addr === EXPECTED_PAYER_ADDRESS) {
        matchedAddress = addr;
        console.log(`\n✅ MATCH FOUND using Strategy 3 (Direct Entropy Algo25 Mapping)!`);
      }
    } catch (e: any) {
      // Ignore
    }
  }

  if (matchedAddress) {
    console.log(`===========================================================`);
    console.log(`✅ VERIFICATION PASSED: Derived signing address matches ${EXPECTED_PAYER_ADDRESS}`);
    console.log(`===========================================================`);
  } else {
    // Derive the default index 0 address to show what address was generated
    const entropy = mnemonicToEntropy(rawMnemonic, wordlist);
    const wallet = await peikertXHdWalletGenerator(entropy);
    const defaultAcc = await wallet.accountGenerator(0, 0);
    const defaultSigners = generateAddressWithSigners({
      ed25519Pubkey: defaultAcc.ed25519Pubkey,
      rawEd25519Signer: defaultAcc.rawEd25519Signer,
    });
    const derivedAddr = defaultSigners.addr.toString();

    console.log(`\n===========================================================`);
    console.log(`⚠️ ADDRESS MISMATCH:`);
    console.log(`Derived Address from 24-word BIP-39 mnemonic: ${derivedAddr}`);
    console.log(`Configured PAYER_ADDRESS:                     ${EXPECTED_PAYER_ADDRESS}`);
    console.log(`The 24-word mnemonic in .env belongs to a different wallet than ${EXPECTED_PAYER_ADDRESS}.`);
    console.log(`===========================================================`);
  }
}

testDerivation();
