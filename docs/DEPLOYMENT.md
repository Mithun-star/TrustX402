# TRUSTX — Deployment Guide

This guide provides step-by-step instructions for deploying the **TRUSTX** monorepo to production environments.

---

## 1. Prerequisites

- **Node.js**: v20+ or v22+
- **MongoDB**: MongoDB Atlas cluster or self-hosted MongoDB instance
- **Algorand Testnet Account**: Funded account with ALGO and opted into USDC ASA (`10458941`)
- **Hosting Services**:
  - Frontend: Vercel / Netlify / Cloudflare Pages
  - Backend: Render / Railway / Fly.io / AWS App Runner

---

## 2. Environment Variables Setup

Ensure the following variables are configured in your backend production environment:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/trustx?retryWrites=true&w=majority
AI_API_KEY=your_llm_api_key
FACILITATOR_URL=https://facilitator.goplausible.xyz
X402_NETWORK=algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=
USDC_ASSET_ID=10458941
PAYMENT_RECEIVER_ADDRESS=YOUR_ALGORAND_RECEIVER_ADDRESS
AVM_MNEMONIC=25_WORD_ALGORAND_MNEMONIC_OR_SECRET_KEY
```

---

## 3. Backend Deployment (Render / Railway)

1. Connect your GitHub repository to **Render** or **Railway**.
2. Set Root Directory to `server`.
3. Set Build Command:
   ```bash
   npm run build
   ```
4. Set Start Command:
   ```bash
   npm start
   ```
5. Add all required environment variables in the environment settings dashboard.

---

## 4. Frontend Deployment (Vercel)

1. Connect your GitHub repository to **Vercel**.
2. Set Framework Preset: **Vite**.
3. Set Root Directory to `client`.
4. Set Build Command:
   ```bash
   npm run build
   ```
5. Set Output Directory: `dist`.
6. Configure API rewrite in `vercel.json` if proxying requests to the backend:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-backend-url.onrender.com/api/:path*"
       }
     ]
   }
   ```

---

## 5. Mainnet Switching Instructions

To transition from Algorand Testnet to Algorand Mainnet:
1. Update `X402_NETWORK` to the Mainnet CAIP-2 identifier: `algorand:wGcA25Or5vMD1Jl8VTx3+nkUBb9V3avS`
2. Update `USDC_ASSET_ID` to Mainnet USDC ASA ID: `31566704`
3. Update `FACILITATOR_URL` to Mainnet GoPlausible Facilitator endpoint.
4. Fund your receiver and payer accounts on Algorand Mainnet.
