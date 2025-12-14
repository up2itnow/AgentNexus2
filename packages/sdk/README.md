# @agentnexus/sdk

TypeScript SDK for the AgentNexus AI Agent Marketplace on Base.

## Installation

```bash
npm install @agentnexus/sdk ethers
# or
pnpm add @agentnexus/sdk ethers
```

## Quick Start

```typescript
import { AgentNexusClient, CHAIN_CONFIGS } from '@agentnexus/sdk';
import { ethers } from 'ethers';

// Initialize client (read-only)
const client = new AgentNexusClient(CHAIN_CONFIGS.baseSepolia);

// With signer for transactions
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const clientWithSigner = client.connect(signer);
```

## Usage

### Check Agent Access

```typescript
const hasAccess = await client.entitlements.hasAccess(
  '0xYourAddress',
  1 // tokenId
);
console.log('Has access:', hasAccess);
```

### Execute an Agent

```typescript
const execution = await client.agents.execute('agent-123', 'Hello, agent!');
console.log('Execution ID:', execution.id);
console.log('Status:', execution.status);
```

### Create A2A Pipeline

```typescript
// Create a 3-agent pipeline with parallel execution
const pipelineId = await client.pipelines.create(
  [
    { agentId: 1, developer: '0xDev1', paymentBps: 4000, stageIndex: 0 },
    { agentId: 2, developer: '0xDev2', paymentBps: 3000, stageIndex: 1 },
    { agentId: 3, developer: '0xDev3', paymentBps: 3000, stageIndex: 1 } // Parallel with agent 2
  ],
  '0xUSDC',
  3600 // 1 hour timeout
);

// Fund the pipeline
await client.pipelines.fund(pipelineId, ethers.parseUnits('100', 6));
```

## Chain Configurations

Pre-configured chains are available:

| Chain | Config Key |
|-------|-----------|
| Base Mainnet | `CHAIN_CONFIGS.base` |
| Base Sepolia | `CHAIN_CONFIGS.baseSepolia` |

## API Reference

### AgentNexusClient

Main client class with the following namespaces:

- `agents` - Agent discovery and execution
- `entitlements` - Access control and token management
- `payments` - Payment operations and escrow
- `pipelines` - A2A Protocol pipeline management

### Types

All TypeScript types are exported:

```typescript
import type { 
  Agent, 
  Pipeline, 
  PipelineStep,
  AgentNexusConfig 
} from '@agentnexus/sdk';
```

## License

Apache 2.0
