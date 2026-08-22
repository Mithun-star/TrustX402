import { x402ResourceServer, paymentMiddleware } from '@x402/express';
import { ExactAvmScheme } from '@x402/avm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { env } from '../../config/env.js';

export class ResilientHTTPFacilitatorClient extends HTTPFacilitatorClient {
  private cachedSupported: any = {
    kinds: [
      {
        x402Version: 2,
        scheme: 'exact',
        network: env.X402_NETWORK,
        extra: { feePayer: 'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA' },
      },
    ],
    extensions: [],
    signers: {
      'algorand:*': ['ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA'],
    },
  };

  override async getSupported(): Promise<any> {
    try {
      const res = await super.getSupported();
      if (res && res.kinds && res.kinds.length > 0) {
        this.cachedSupported = res;
      }
      return this.cachedSupported;
    } catch (err: any) {
      console.warn('⚠️ Facilitator getSupported note:', err.message);
      return this.cachedSupported;
    }
  }

  override async verify(paymentPayload: any, accepts: any): Promise<any> {
    console.log(`📡 [GoPlausible Facilitator] Dispatching verify request...`);
    try {
      const result = await super.verify(paymentPayload, accepts);
      console.log(`✅ [GoPlausible Facilitator] Verify Result:`, JSON.stringify(result, null, 2));
      return result;
    } catch (err: any) {
      console.error(`❌ [GoPlausible Facilitator] Verify Failure:`, err.message || err);
      throw err;
    }
  }

  override async settle(paymentPayload: any, accepts: any): Promise<any> {
    console.log(`⚡ [GoPlausible Facilitator] Dispatching settle request...`);
    try {
      const result = await super.settle(paymentPayload, accepts);
      console.log(`✅ [GoPlausible Facilitator] Settle Result:`, JSON.stringify(result, null, 2));
      return result;
    } catch (err: any) {
      console.error(`❌ [GoPlausible Facilitator] Settle Failure:`, err.message || err);
      throw err;
    }
  }
}

// Instantiate GoPlausible Resilient HTTPFacilitatorClient
export const facilitatorClient = new ResilientHTTPFacilitatorClient({
  url: env.FACILITATOR_URL,
});

const networkKey = env.X402_NETWORK as `${string}:${string}`;

export const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(networkKey, new ExactAvmScheme());

const receiverAddress = env.PAYMENT_RECEIVER_ADDRESS || 'N6Y4IYI4GTZJQLJNUSJS2UXWWTUQMKOMHQK3ZPUS5KGPREVZ5HJPCOQ5WA';
const usdcAsset = env.USDC_ASSET_ID || '10458941';

// Express Payment Middleware instance with top-level asset and amount properties
const routesConfig = {
  '/api/research': {
    accepts: [
      {
        price: '0.03',
        amount: '30000',
        asset: usdcAsset,
        network: networkKey,
        scheme: 'exact',
        payTo: receiverAddress,
      },
    ],
  },
  '/research': {
    accepts: [
      {
        price: '0.03',
        amount: '30000',
        asset: usdcAsset,
        network: networkKey,
        scheme: 'exact',
        payTo: receiverAddress,
      },
    ],
  },
};

export const x402ExpressMiddleware = paymentMiddleware(routesConfig as any, resourceServer);
