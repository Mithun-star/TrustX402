import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import algosdk from 'algosdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, '../../../.env');
const serverEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath });

const EXPECTED_PAYER_ADDRESS = 'ZULDAZZAIB472IVXTLGG43VQNURNQ3OFJ73WSC4N4BQP4HNDDPMPT7B2ZU';

async function diagnose() {
  console.log('===========================================================');
  console.log('🔍 TRUSTX PAYER CREDENTIAL DIAGNOSTIC');
  console.log('===========================================================');
  console.log(`Root .env path:   ${rootEnvPath}`);
  console.log(`Server .env path: ${serverEnvPath}`);

  const rawMnemonic = process.env.AVM_MNEMONIC || '';

  if (!rawMnemonic || rawMnemonic.trim().length === 0) {
    console.log('\n❌ DIAGNOSTIC RESULT: AVM_MNEMONIC is empty or not set in .env file.');
    process.exit(1);
  }

  console.log(`\n✅ 1. AVM_MNEMONIC key exists in environment.`);

  // Safely clean without exposing string
  const cleaned = rawMnemonic.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, ' ');
  const words = cleaned.split(' ');

  console.log(`✅ 2. Word Count: ${words.length} words detected.`);

  let derivedAddress = '';
  let isValidFormat = false;

  if (words.length === 25) {
    try {
      const account = algosdk.mnemonicToSecretKey(cleaned);
      derivedAddress = account.addr.toString();
      isValidFormat = true;
      console.log(`✅ 3. Mnemonic safely parsed with algosdk.mnemonicToSecretKey()`);
    } catch (err: any) {
      console.log(`❌ 3. Failed to parse 25-word mnemonic with algosdk: ${err.message}`);
      process.exit(1);
    }
  } else {
    // Check if base64 key
    try {
      const buf = Buffer.from(cleaned, 'base64');
      if (buf.length === 64) {
        isValidFormat = true;
        console.log(`✅ 3. Base64 64-byte private key detected.`);
      } else {
        console.log(`❌ 3. String format is neither 25 words nor a 64-byte Base64 key.`);
        process.exit(1);
      }
    } catch {
      console.log(`❌ 3. Invalid key format.`);
      process.exit(1);
    }
  }

  if (derivedAddress) {
    console.log(`\n📌 Derived Public Address:  ${derivedAddress}`);
    console.log(`📌 Expected Payer Address: ${EXPECTED_PAYER_ADDRESS}`);

    if (derivedAddress === EXPECTED_PAYER_ADDRESS) {
      console.log(`\n===========================================================`);
      console.log(`✅ MATCH SUCCESSFUL: Derived address matches expected Payer Address!`);
      console.log(`===========================================================`);
    } else {
      console.log(`\n===========================================================`);
      console.log(`⚠️ MISMATCH WARNING: The configured AVM_MNEMONIC belongs to a different Algorand wallet address (${derivedAddress}) than expected (${EXPECTED_PAYER_ADDRESS}).`);
      console.log(`===========================================================`);
    }
  }
}

diagnose();
