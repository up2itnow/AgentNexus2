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
3.  **Relayer Service** (Permissionless Minting, Role-Gated Credit V1):
    - Monitors source chain burn events.
    - Fetches attestations from Circle Iris API.
    - Submits `receiveMessage()` on Base (permissionless — anyone can do this).
    - Calls `AgentNexusCctpReceiver.creditFromCctp()` to apply credit (currently role-gated to `CCTP_RELAYER_ROLE` for spoof-proofing).

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

> [!NOTE]
> **Reference ID Derivation**: For on-chain compatibility and idempotency, string-based `referenceId`s (like UUIDs) are converted to `bytes32` using `keccak256(toBytes(referenceId))` before calling the `creditFromCctp` function. Use this hash when querying contract state for specific payments.

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
    REMOVED_RELAYER_PRIVATE_KEY
```

## Verification Status (v0.2.1)

### ✅ Verified: Receiver & Relayer Logic
The **Destination Chain (Base Sepolia)** infrastructure has been verified live.
- **Contract Deployed**: [`0x661a9903747E7634e459ac1fb30F51f84D6f4063`](https://sepolia.basescan.org/address/0x661a9903747E7634e459ac1fb30F51f84D6f4063)
- **Credit Logic**: Verified via Relayer simulation.
  - **Transaction**: [`0x725a2e69843c164466be67cf9f8cbd9f19d2b1a77705fcf4e45b85aa9cd81228`](https://sepolia.basescan.org/tx/0x725a2e69843c164466be67cf9f8cbd9f19d2b1a77705fcf4e45b85aa9cd81228)

### ✅ Mainnet Verification (Ethereum → Base)
**Full End-to-End Proof**: [cctp-ethmainnet-to-basemainnet.json](./proofs/cctp-ethmainnet-to-basemainnet.json)
- Verified non-custodial transit from Ethereum Mainnet to Base Mainnet Receiver.
- Confirmed Burn, Attestation, Mint, and Credit Application.

### ⚠️ Testnet Route Status
- **Ethereum Sepolia → Base Sepolia**: Supported, Verified.
- **Arbitrum/Optimism Sepolia**: Not configured in Circle Testnet (blocked by Circle).

OP/Arbitrum routes are fully supported architecturally and rely on Circle's mainnet configuration.

## Testnet Route Availability

CCTP testnet route availability is controlled by Circle's testnet deployment. Not all source→destination route combinations are configured on testnet.

**Known Limitations:**
- Arbitrum Sepolia → Base Sepolia: **Not configured** (TokenMinter `getLocalToken` returns zero)
- Optimism Sepolia → Base Sepolia: **Not configured** (TokenMinter `getLocalToken` returns zero)
- Ethereum Sepolia → Base Sepolia: **Supported** (verified)

If the TokenMinter remote mapping returns zero for a given route, `depositForBurn` will revert. This is a Circle testnet availability limitation, not an AgentNexus2 integration error.

The x402 client includes a route guard that checks this mapping before attempting to burn, providing a clear error message when a route is unavailable.

## No Custody / Trust Model

**AgentNexus2 does not custody user funds.** Funds settle via CCTP burn-and-mint and mint directly to the Base receiver contract.

- **Non-Custodial**: The Relay Service never holds user funds. Funds move directly from Circle's burn on the source chain to Circle's mint on the destination chain, landing in the Receiver Contract.
- **Permissionless Minting**: Anyone can submit `receiveMessage()` to Circle's MessageTransmitter. Our service does it for UX and pays the destination gas, but users are free to relay it themselves.
- **Role-Gated Credit Application**: Permissionless minting; credit application currently role-gated for spoof-proofing. The `creditFromCctp()` function on `AgentNexusCctpReceiver` is restricted to `CCTP_RELAYER_ROLE`.
- **Idempotency**: The `AgentNexusCctpReceiver` tracks `referenceId` (as `bytes32` hash) to prevent double-crediting.
- **Spend Policy**: The Client Adapter implements strict spend limits to prevent autonomous agents from draining wallets.

### Roadmap: Trustless Credit Application

We plan to implement **permissionless crediting** via atomic relay-and-credit with message-bound metadata (hooks), or via strict mint-to-beneficiary flows. The current `CCTP_RELAYER_ROLE` is a temporary measure to strictly enforce the connection between the CCTP mint event and the credit utilization, preventing front-running or credit spoofing.

## Mainnet Proof (Tiny Amount)

To demonstrate the architecture in a production environment without risking significant funds, we maintain a small-value proof of transit:

**[Mainnet Proof JSON](./proofs/cctp-ethmainnet-to-basemainnet.json)**

- **Source**: Ethereum Mainnet (Burn)
- **Destination**: Base Mainnet (Mint + Credit)
- **Amount**: 1.0 USDC (Hardware capped at 2.0 USDC in verification scripts)
- **Trust Model**: Non-custodial. Funds move Circle-to-Circle-to-Receiver. Relayer only pays gas.

### Transaction Chain (verified on-chain)

| Step | Chain | Explorer |
|------|-------|----------|
| **Burn** | Ethereum | [0x60d4ceb8...](https://etherscan.io/tx/0x60d4ceb83736d9ad2b989c0e73593386bd4d90f35e0a2e8843a68193a4cf2b74) |
| **Attestation** | Circle Iris | [View](https://iris-api.circle.com/attestations/0x9e3cbbff4f14c95ede29a08faee8f9db925c4448fa592fa83a277820cedbcec6) |
| **Mint** | Base | [0x858a3ab2...](https://basescan.org/tx/0x858a3ab20a167952935e798a6b9630cf840de15f6bd2f09c45acd6bd843e095f) |
| **Credit** | Base | [0x33c251f0...](https://basescan.org/tx/0x33c251f0c336baf6c6121878cbf8c0e09581adb30e4208b832bfb9f2f5c7c455) |

The generated proof artifact includes transaction hashes for the Burn, Mint, and Credit operations, linking the entire lifecycle.

> [!NOTE]
> **Testnet Route Availability**: Circle testnet may not configure all routes (e.g., Arbitrum/Optimism Sepolia → Base Sepolia may not be available). Mainnet proof (tiny amount) is used for grant verification.

> [!IMPORTANT]
> **Attestation Environments**: CCTP attestations are served from Circle's **production Iris** (`iris-api.circle.com`) for mainnet burns and from **sandbox Iris** (`iris-api-sandbox.circle.com`) for testnet burns. Polling the wrong environment will result in persistent 404 responses. The verification script automatically selects the correct endpoint based on source chain ID.

## Development

### Running Tests
```bash
npm test backend/tests/cctp-routes.test.ts
```

### Adding New Chains
1.  Update `backend/src/config/cctp.ts` with the new chain's Circle contract addresses.
2.  Update `backend/src/middleware/x402.ts` to include the new route option.
3.  Ensure RPC URL environment variable is added.
