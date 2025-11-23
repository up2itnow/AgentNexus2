# AgentNexus Architecture

## System Overview

AgentNexus is a hybrid decentralized application (dApp) that combines on-chain security with off-chain AI computation.

```mermaid
graph TD
    User[User] -->|Connects Wallet| Frontend[Next.js Frontend]
    Frontend -->|Reads/Writes| Blockchain[Base L2 Blockchain]
    Frontend -->|Requests Execution| Backend[Node.js Backend]
    
    subgraph "On-Chain Layer"
        Blockchain --> Registry[AgentRegistry Contract]
        Blockchain --> Account[AgentNexusAccount (Smart Wallet)]
    end
    
    subgraph "Off-Chain Layer"
        Backend --> DB[(PostgreSQL)]
        Backend --> Docker[Docker Execution Engine]
        Docker --> Agent[AI Agent Container]
    end
```

## Core Components

### 1. Smart Accounts (ERC-4337)
We use Account Abstraction to give every user and agent a smart wallet.
-   **Contract**: `AgentNexusAccount.sol`
-   **Features**: Keyless recovery (planned), batched transactions, sponsored gas.

### 2. Execution Engine
The backend orchestrates agent execution securely.
-   **Isolation**: Agents run in Docker containers with no network access (except whitelisted APIs).
-   **Resource Limits**: CPU and RAM are strictly capped.
-   **Sanitization**: All inputs and outputs are sanitized to prevent injection attacks.

### 3. The "Air Gap"
To protect user funds, there is a strict separation between the AI execution environment and the blockchain wallet.
-   **Agents** cannot sign transactions.
-   **Agents** cannot access private keys.
-   **Agents** can only propose actions via the backend, which requires user approval (or pre-approved session keys).

## Data Flow: Agent Execution

1.  **Purchase**: User buys access to an agent (on-chain transaction).
2.  **Request**: User sends input data to Backend.
3.  **Verification**: Backend checks on-chain entitlement.
4.  **Execution**: Backend spins up Docker container with agent code.
5.  **Output**: Agent processes data and returns result.
6.  **Settlement**: Backend updates usage stats; if micro-payment is needed, it's processed via the Smart Account.
