# AgentNexus

> [!IMPORTANT]
> **🟢 Live on Base Mainnet (December 2025)**
> 
> - **Escrow**: `0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC`
> - **Entitlements**: `0x3c8f32F9cF41Dc255129d6Add447218053743b33`
> 
> See [DEPLOYMENTS.md](./DEPLOYMENTS.md) for full details.

## What This Is

AgentNexus is a decentralized infrastructure platform for discovering, purchasing, and executing autonomous AI agents on Base L2. Built on Base, it leverages Account Abstraction (ERC-4337) to provide a seamless, secure, and non-custodial experience for users and agents alike.

The platform consists of three layers: a Next.js frontend for user interaction and marketplace browsing, a Node.js/Express backend that orchestrates agent execution in isolated Docker environments, and Solidity smart contracts (Foundry) that manage ownership, payments, and access control. See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive.

## Architecture Overview

![AgentNexus architecture diagram](./docs/architecture-overview.svg)

## 🚀 Features

This project is **NOT**:

- A consumer-facing AI app
- A trading platform or financial product
- A token launch or ICO
- A permissionless agent marketplace (agents require registration)
- A custodial wallet service (users control their own keys)
- A no-code AI builder

AgentNexus is **infrastructure software** intended for technically competent users who understand blockchain technology and smart contracts.

## Current Status

**Version**: v0.1.0 (Base Mainnet Launch)

**Deployment**: Live on Base Mainnet (December 2025)

See [STATUS.md](./STATUS.md) for detailed project status and [DEPLOYMENTS.md](./DEPLOYMENTS.md) for contract addresses.

| Component | Status |
|-----------|--------|
| Smart Contracts (`AgentNexusEscrow`, `AgentNexusEntitlements`) | ✅ Deployed to Base Mainnet |
| Account Abstraction (ERC-4337) | ✅ Implemented |
| Agent Execution Environment | ✅ Docker-based, sandboxed |
| Compliance Toggles | ✅ Implemented (disabled by default) |
| **CCTP Integration** | ✅ [Mainnet Proof](./docs/REVIEWER_WALKTHROUGH.md) |
| Frontend Marketplace | 🚧 In Development |

## Security & Scope Notes

### What Is Safe
- **No Private Keys in Agents**: Agents run in ephemeral containers without wallet access
- **Smart Contract Security**: Contracts use `ReentrancyGuard` and standard OpenZeppelin libraries
- **Sandboxed Execution**: Docker containers are hardened with `seccomp` profiles and read-only filesystems
- **Audit-Ready Logging**: Structured logging available (toggle-controlled)

### What Is Experimental
- **Compliance Features**: Geo/KYC toggles, agent category restrictions, and runtime isolation are implemented but disabled by default
- **Agent Zero**: Our flagship autonomous agent is functional but under active development

### What Is Out of Scope
- Consumer protection mechanisms (this is B2B infrastructure)
- Financial advice or trading guarantees
- Key recovery services

## Getting Started

> **Note**: We only provide support for the setup described below. Custom configurations or deployment scenarios are your responsibility.

### Prerequisites
- Node.js v20+
- Docker (for agent execution)
- Foundry (for smart contracts)
- pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/up2itnow/AgentNexus2.git
    cd AgentNexus2
    ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your API keys (Alchemy, WalletConnect, etc.).

4. **Run Locally**
   ```bash
   pnpm dev
   ```

For smart contract deployment, see the `smart-contracts/` directory README.

## x402 Payments (USDC on Base)

AgentNexus supports [x402](https://docs.cdp.coinbase.com/x402/welcome), an internet-native payment protocol for pay-per-request API access using USDC on Base.

### Paywalled Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /agents/:id/premium-analytics` | 0.05 USDC | Agent analytics with execution trends, revenue breakdown |
| `GET /agents/:id/detailed-metrics` | 0.02 USDC | Performance metrics, status distribution, duration analysis |
| `GET /agents/x402/status` | Free | Check x402 configuration |

### Configuration

```bash
# backend/.env
ENABLE_X402=true                              # Enable x402 payments
X402_NETWORK=base-sepolia                     # or "base" for mainnet
X402_PAYMENT_RECIPIENT=0xYourWalletAddress    # Receives payments
X402_MAX_PAYMENT_USDC=100                     # Safety limit per request
```

### Quick Test

```bash
# Request without payment → 402
curl -i http://localhost:3001/agents/test-id/premium-analytics
# HTTP/1.1 402 Payment Required
# X-Payment-Required: <base64-encoded payment request>

# After paying USDC and retrying with payment proof → 200
curl -i http://localhost:3001/agents/test-id/premium-analytics \
  -H "X-Payment: <base64-encoded payment payload>"
# HTTP/1.1 200 OK
```

### Verified on Base Sepolia

✅ **Transaction**: [`0x6c4907aa...`](https://sepolia.basescan.org/tx/0x6c4907aa22407b02fab523ed6b01fc533b7288493481f8318c255c1930938783) | Block 35126450 | 0.05 USDC

## x402 + CCTP (Cross-Chain Payments)

AgentNexus now supports funding via Circle CCTP from Arbitrum and Optimism.

### Usage
- Client requests regular premium resource.
- Paywall includes `cctp` routes for Arbitrum/Optimism.
- Client burns USDC on source chain and submits proof.
- Permissionless Relayer mints and credits on Base.

### Verification (v0.2.0)
✅ **Receiver Contract**: [`0x661a9903...`](https://sepolia.basescan.org/address/0x661a9903747E7634e459ac1fb30F51f84D6f4063) (Base Sepolia)
✅ **Mainnet Proof**: See [docs/proofs/cctp-ethmainnet-to-basemainnet.json](./docs/proofs/cctp-ethmainnet-to-basemainnet.json) for tiny-amount verification (Burn Eth -> Mint Base).
⚠️ **Testnet Routes**: Circle testnet limited to Ethereum->Base; Arb/OP routes restricted on testnet but active on mainnet.

### > > Status: Mainnet proof complete. Tooling and CI refinements in progress.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
