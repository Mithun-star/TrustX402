import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory and server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  FACILITATOR_URL: process.env.FACILITATOR_URL || 'https://facilitator.goplausible.xyz',
  X402_NETWORK: process.env.X402_NETWORK || 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  USDC_ASSET_ID: process.env.USDC_ASSET_ID || '10458941',
  PAYMENT_RECEIVER_ADDRESS: process.env.PAYMENT_RECEIVER_ADDRESS || 'N6Y4IYI4GTZJQLJNUSJS2UXWWTUQMKOMHQK3ZPUS5KGPREVZ5HJPCOQ5WA',
  PAYMENT_PAYER_ADDRESS: process.env.PAYMENT_PAYER_ADDRESS || 'ZULDAZZAIB472IVXTLGG43VQNURNQ3OFJ73WSC4N4BQP4HNDDPMPT7B2ZU',
  AVM_MNEMONIC: process.env.AVM_MNEMONIC || '',
  AVM_PRIVATE_KEY: process.env.AVM_PRIVATE_KEY || '',
};
