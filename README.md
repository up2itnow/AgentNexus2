# AgentNexus

[![CI Suite](https://github.com/up2itnow/AgentNexus2/actions/workflows/ci.yml/badge.svg)](https://github.com/up2itnow/AgentNexus2/actions/workflows/ci.yml)
[![CodeQL](https://github.com/up2itnow/AgentNexus2/actions/workflows/codeql.yml/badge.svg)](https://github.com/up2itnow/AgentNexus2/actions/workflows/codeql.yml)
[![Security Scan](https://github.com/up2itnow/AgentNexus2/actions/workflows/security-scan.yml/badge.svg)](https://github.com/up2itnow/AgentNexus2/actions/workflows/security-scan.yml)

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

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
