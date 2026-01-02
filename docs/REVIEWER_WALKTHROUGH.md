# CCTP Proof: Reviewer Walkthrough

> **Time to verify: ~5 minutes**

## Quick Summary

AgentNexus demonstrates end-to-end CCTP (Cross-Chain Transfer Protocol) integration on **mainnet**, moving 1 USDC from Ethereum to Base with cryptographic attestation from Circle.

## Base Mainnet Screencasts

- [Entitlement purchase walkthrough](https://TODO.example.com/agentnexus-base-entitlement.mp4) — wallet connects, entitlement token minted, and BaseScan transaction confirmed. TODO: Replace with the final hosted recording link if mirrored elsewhere.
- [Agent invocation + fulfillment](https://TODO.example.com/agentnexus-base-invoke.mp4) — entitlement check passes, backend executes the agent container, and streaming logs/response are captured.
- [x402 + CCTP payment proof](https://TODO.example.com/agentnexus-base-x402-cctp.mp4) — 402 response shown, CCTP burn/mint/credit chain demonstrated, and Base receiver credit is verified.

---

## Verification Steps

### Step 1: Verify the Burn (Ethereum Mainnet)

**[View Burn Transaction](https://etherscan.io/tx/0x60d4ceb83736d9ad2b989c0e73593386bd4d90f35e0a2e8843a68193a4cf2b74)**

- ✅ 1.0 USDC burned on Ethereum
- ✅ `depositForBurn` called on Circle's TokenMessenger
- ✅ `MessageSent` event emitted by Circle's MessageTransmitter

### Step 2: Verify the Attestation (Circle Iris)

**[View Attestation](https://iris-api.circle.com/attestations/0x9e3cbbff4f14c95ede29a08faee8f9db925c4448fa592fa83a277820cedbcec6)**

- ✅ Circle produced a cryptographic attestation for the message hash
- ✅ Attestation returned from production Iris (not sandbox)

### Step 3: Verify the Mint (Base Mainnet)

**[View Mint Transaction](https://basescan.org/tx/0x858a3ab20a167952935e798a6b9630cf840de15f6bd2f09c45acd6bd843e095f)**

- ✅ `receiveMessage` called on Base MessageTransmitter
- ✅ 1.0 USDC minted directly to the receiver contract
- ✅ Non-custodial: funds held by contract, not EOA

### Step 4: Verify the Credit (Base Mainnet)

**[View Credit Transaction](https://basescan.org/tx/0x33c251f0c336baf6c6121878cbf8c0e09581adb30e4208b832bfb9f2f5c7c455)**

- ✅ `creditFromCctp` called on AgentNexusCctpReceiver
- ✅ Credit applied to beneficiary account
- ✅ Role-gated (CCTP_RELAYER_ROLE) for spoof-proofing

---

## Proof Artifact

**[View Full Proof JSON](./proofs/cctp-ethmainnet-to-basemainnet.json)**

```json
{
  "network": { "source": "ethereum-mainnet", "destination": "base-mainnet" },
  "cctp": { "amount": "1.0", "attestationReceived": true },
  "transactions": {
    "burn":   { "block": "24057271" },
    "mint":   { "block": "39743431" },
    "credit": { "block": "39751151" }
  }
}
```

---

## Trust Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         TRUST MODEL                             │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Permissionless Minting                                       │
│    Anyone can submit receiveMessage() to Circle's contract      │
│                                                                 │
│  ✓ Role-Gated Credit (V1, current)                              │
│    creditFromCctp() restricted to CCTP_RELAYER_ROLE             │
│    Prevents spoofed credits without on-chain proof              │
│    Roadmap: permissionless credit via atomic relay-and-credit   │
│                                                                 │
│  ✓ Non-Custodial                                                │
│    Funds flow: User → Circle → Circle → Receiver Contract       │
│    Relayer only pays gas, never touches funds                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    x402 + CCTP Flow (Mainnet)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ETHEREUM MAINNET                           BASE MAINNET            │
│   ─────────────────                          ────────────            │
│                                                                      │
│   ┌────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│   │   User     │───▶│ TokenMessenger  │    │  MessageTransmitter │  │
│   │  (Payer)   │    │ depositForBurn  │    │  receiveMessage     │  │
│   └────────────┘    └────────┬────────┘    └──────────┬──────────┘  │
│                              │                        │              │
│                              ▼                        ▼              │
│                     ┌────────────────┐      ┌─────────────────────┐ │
│                     │ Circle Iris    │      │ AgentNexusCctp      │ │
│                     │ (attestation)  │─────▶│ Receiver Contract   │ │
│                     └────────────────┘      │ creditFromCctp()    │ │
│                                             └─────────────────────┘ │
│                                                                      │
│   Legend:                                                            │
│   ───▶ USDC value transfer                                          │
│   ···▶ Message / attestation flow                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Addresses

| Entity | Address |
|--------|---------|
| Receiver Contract (Base) | `0xeCEE0ddcafED1cA856865a8Fee95E1859027cAe0` |
| Payer/Beneficiary | `0x2c9A89325E209c89bb06195761f93e298417b85e` |
| Relayer | `0x63909D52082d17f236110359855757e0ff7Ab49F` |

---

## Questions?

Open an issue for technical questions or verification assistance.
