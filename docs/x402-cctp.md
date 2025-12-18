# AgentNexus x402 + CCTP Integration

## Overview

This integration enables **non-custodial, cross-chain USDC funding routes** for AgentNexus agents. It leverages the **x402 Payment Protocol** for discovery and **Circle CCTP (Cross-Chain Transfer Protocol)** for settlement.

**Supported Routes:**
- **Arbitrum One** → Base
- **Optimism** → Base

All settlements occur on **Base**, directly into the agent's account or the specified receiver contract.

## Architecture

The system consists of three main components:

1.  **x402 Middleware**: Generates HTTP 402 responses with multiple payment options (Base Direct, Arbitrum CCTP, Optimism CCTP).
2.  **Client Adapter (Agent)**: Pays by burning USDC on the source chain (Arbitrum/Optimism) via Circle's `TokenMessenger`.
3.  **Permissionless Relayer**: 
    - Monitors source chain burn events.
    - Fetches attestations from Circle Iris API.
    - Submits mint transactions to Base.
    - Credits the `AgentNexusCctpReceiver` contract.

### Flow

1.  **Request**: Client requests simple `GET /premium-resource`.
2.  **402 Response**: Server responds with `402 Payment Required` containing a `paymentRequest` with `routes`:
    - Route A: Base Direct Transfer (Standard x402)
    - Route B: CCTP from Arbitrum
    - Route C: CCTP from Optimism
3.  **Burn**: Client selects Route B, calls `TokenMessenger.depositForBurn()` on Arbitrum.
4.  **Submit**: Client POSTs the burn transaction hash to `/api/payments/cctp/submit`.
5.  **Relay & Mint**: Server's Relayer Service:
    - Verifies burn on Arbitrum.
    - Gets attestation from Circle.
    - Calls `MessageTransmitter.receiveMessage()` on Base.
    - Calls `AgentNexusCctpReceiver.creditFromCctp()` on Base.
6.  **Fulfillment**: AgentNexus Receiver confirms payment via `CreditApplied` event, and the original resource request can be retried with the payment proof.

## Configuration

To enable CCTP routes, configure the following environment variables in `.env`:

```env
# Enable CCTP Features
ENABLE_CCTP_ROUTES=true
ENABLE_CCTP_RELAYER=true

# Circle Iris API (Attestation Service)
CCTP_IRIS_BASE_URL=https://iris-api.circle.com

# Destination Configuration
CCTP_DESTINATION=base
CCTP_BASE_RECEIVER_CONTRACT=0x... (Deployed Receiver Address)

# Relayer Wallet (Needs Base ETH for gas)
RELAYER_PRIVATE_KEY=0x...
```

## Security & Trust Assumptions

- **Non-Custodial**: The Relay Service never holds user funds. It only possesses the authority to relay the mint message. Funds move directly from Circle's Burn to Circle's Mint to the Receiver Contract.
- **Permissionless**: Anybody can relay the message. Our service does it for UX and pays the destination gas, but the user is free to relay it themselves if our service is down.
- **Idempotency**: The `AgentNexusCctpReceiver` tracks `referenceId` to prevent double-crediting.
- **Spend Policy**: The Client Adapter implements strict spend limits to prevent autonomous agents from draining wallets.

## Development

### Running Tests
```bash
npm test backend/tests/cctp-routes.test.ts
```

### Adding New Chains
1.  Update `backend/src/config/cctp.ts` with the new chain's Circle contract addresses.
2.  Update `backend/src/middleware/x402.ts` to include the new route option.
3.  Ensure RPC URL environment variable is added.
