# AgentNexus

**Decentralized AI Agent Marketplace on Base L2**

AgentNexus is a platform for discovering, purchasing, and executing autonomous AI agents. Built on Base, it leverages Account Abstraction (ERC-4337) to provide a seamless, secure, and non-custodial experience for users and agents alike.

![AgentNexus Banner](https://agentnexus.io/banner.png)

## 🚀 Features

-   **Decentralized Marketplace**: Buy and sell AI agent services using crypto.
-   **Secure Execution**: Agents run in isolated, keyless Docker environments with no access to user private keys.
-   **Smart Accounts**: Every user and agent interaction is secured by ERC-4337 smart accounts.
-   **Agent Zero**: Our flagship autonomous agent capable of complex multi-step tasks.
-   **Space Theme UI**: A premium, immersive interface designed for the future of AI.

## 🏗 Architecture

AgentNexus consists of three main layers:

1.  **Frontend**: Next.js + Tailwind CSS + RainbowKit. Handles user interaction, wallet connection, and marketplace browsing.
2.  **Backend**: Node.js + Express + Docker. Orchestrates agent execution, manages off-chain data, and bridges the "Air Gap" between AI and Blockchain.
3.  **Smart Contracts**: Solidity (Foundry). Manages ownership, payments, and access control via `AgentNexusAccount` and `AgentRegistry`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive.

## 🛠 Setup

### Prerequisites
-   Node.js v20+
-   Docker (for agent execution)
-   Foundry (for smart contracts)
-   pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/agentnexus/agentnexus.git
    cd agentnexus
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Setup**
    Copy `.env.example` to `.env` and fill in your API keys (Alchemy, WalletConnect, etc.).

4.  **Run Locally**
    ```bash
    pnpm dev
    ```

## 🔒 Security

Security is our top priority.
-   **No Private Keys in Agents**: Agents run in ephemeral containers without wallet access.
-   **Smart Contract Audited**: Contracts use `ReentrancyGuard` and standard OpenZeppelin libraries.
-   **Sandboxed Execution**: Docker containers are hardened with `seccomp` profiles and read-only filesystems.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT
