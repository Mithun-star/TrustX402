# TRUSTX — Autonomous Agent Trust & Payment Gateway

> **Tagline:** Trust before spend. Optimize before pay.

---

## Overview

**TRUSTX** is an intelligent trust, security risk, budget policy, and payment-routing layer built specifically for autonomous AI agents consuming machine-payable web APIs.

As AI agents increasingly gain authority to invoke external tools and pay per API call, they should not spend funds blindly. Before executing an on-chain transaction over the **x402 protocol**, TRUSTX evaluates service trust metrics, inspects security risk indicators, enforces agent budget constraints, and dynamically routes payment to the optimal provider.

---

## Why TRUSTX?

1. **Why Trust-Aware Payments for AI Agents?**
   AI agents can execute dozens of API calls autonomously. Without a pre-payment trust layer, agents risk spending funds on malicious, unreliable, or low-quality services. TRUSTX provides a transparent reputation score and multi-attribute decision matrix before any payment signature occurs.

2. **Why x402 Protocol?**
   The x402 payment standard leverages standard HTTP `402 Payment Required` status codes to allow instant, internet-native micropayments without mandatory user account creation, API key management, or subscription lock-in.

3. **Why Algorand & USDC ASA?**
   Algorand offers sub-second finality, micro-penny transaction fees, high throughput, and environmental efficiency. USDC ASA (`10458941` on Testnet) provides a stable, low-friction settlement asset for machine-to-machine micro-transactions.

---

## System Architecture

```mermaid
flowchart TD
    USER[User / Developer Prompt] --> REACT[React Web App Dashboard]
    REACT --> AGENT[AI Agent Service]
    AGENT --> TRUSTX[TRUSTX Gateway Core]

    subgraph TRUSTX Gateway
        REGISTRY[Service Registry]
        REPUTATION[Reputation Engine]
        RISK[Risk & Security Engine]
        BUDGET[Budget Policy Engine]
        ROUTER[Payment Router]
    end

    TRUSTX --> REGISTRY
    TRUSTX --> REPUTATION
    TRUSTX --> RISK
    TRUSTX --> BUDGET
    TRUSTX --> ROUTER

    ROUTER -->|Selected Endpoint| X402SERVICE[x402 Protected Service /api/research]
    X402SERVICE -->|HTTP 402 Payment Required| X402CLIENT[x402 Fetch Client]
    X402CLIENT -->|AVM Signed Payment Header| X402SERVICE
    X402SERVICE --> FACILITATOR[GoPlausible HTTP Facilitator]
    FACILITATOR --> ALGORAND[Algorand Testnet]
    ALGORAND --> USDC[USDC ASA 10458941 Settlement]
    ALGORAND --> RECEIPT[On-Chain Transaction ID]
    RECEIPT --> X402SERVICE
    X402SERVICE --> RESULT[Authenticated Payload]
    RESULT --> AGENT
    AGENT --> REACT
```

---

## Technology Stack (MERN)

- **MongoDB / Mongoose**: Stores service catalog metadata, agent run timelines, security event logs, and settlement transactions. Includes zero-config fallback to `mongodb-memory-server` for local development.
- **Express.js & Node.js**: REST API server hosting `@x402/express` middleware and TRUSTX engine modules.
- **React 18 & Vite**: Developer dashboard with live timeline visualizers, security test controls, budget controls, and transaction history.
- **TypeScript**: Shared type definitions across client and server.
- **Tailwind CSS & Lucide Icons**: Enterprise-grade UI design.
- **Blockchain**: Algorand Testnet via `@x402/avm` and `algosdk`.

---

## Core Engine Modules

### 1. Reputation Engine
Calculates a transparent service trust score (0–100):
$$\text{Score} = 30\% \text{ (Success Rate)} + 25\% \text{ (Tx History Log)} + 20\% \text{ (Availability)} + 15\% \text{ (Latency)} + 10\% \text{ (User Feedback)}$$
*Clearly labeled as "TRUSTX-generated reputation score".*

### 2. Risk Engine
Explainable security rule engine checking for:
- Prompt injection / malicious instruction patterns
- Low trust scores (<50)
- Price anomalies (micropayments > $0.50)
- Unregistered service destinations

### 3. Budget Policy Engine
Enforces financial guardrails:
- `dailyBudget`: Total USDC cap per day (e.g. $1.00)
- `maxPerTransaction`: Maximum single request cost (e.g. $0.10)
- `minimumTrustScore`: Minimum trust threshold (e.g. 50)
- `allowedCategories`: Category whitelist (`['research', 'data', 'compute', 'ai']`)

### 4. Payment Router
Dynamic multi-attribute decision matrix:
$$\text{Composite Score} = (0.35 \times \text{Trust}) + (0.25 \times \text{PriceScore}) + (0.20 \times \text{LatencyScore}) + (0.20 \times \text{Reliability})$$

---

## Quick Start & Local Setup

### 1. Installation
```bash
git clone https://github.com/your-username/TrustX402.git
cd TrustX402
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Parameters in `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=
FACILITATOR_URL=https://facilitator.goplausible.xyz
X402_NETWORK=algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=
USDC_ASSET_ID=10458941
PAYMENT_RECEIVER_ADDRESS=
AVM_MNEMONIC=
```

### 3. Running the Project
Build shared types and start backend + frontend concurrently:
```bash
npm run dev
```

- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`

---

## Testing & Verification

### Run Unit Tests
```bash
npm test
```
Runs unit tests for Reputation Engine, Risk Engine, Budget Policy, and Payment Router.

### Run End-to-End Test Suite
```bash
npm run test:e2e --workspace=server
```
Executes complete safe demo workflow (HTTP 402 -> AVM Sign -> Facilitator Settle -> Transaction ID) and unsafe demo workflow (Risk & Budget Block).

---

## API Endpoints

- `GET /api/health`: Health status & network parameters.
- `GET /api/services`: List discovered registry services.
- `GET /api/services/:id/reputation`: Get transparent trust score breakdown.
- `POST /api/security/check`: Evaluate prompt injection & risk rules.
- `POST /api/policy/check`: Evaluate budget limits.
- `POST /api/router/select`: Perform weighted service selection.
- `POST /api/agent/run`: Run autonomous agent workflow.
- `POST /api/research`: **x402-Protected Endpoint** ($0.03 USDC on Algorand Testnet).
- `GET /api/transactions`: List verified on-chain settlements.

---


