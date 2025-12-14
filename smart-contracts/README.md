# AgentNexus Smart Contracts

Solidity contracts for the AgentNexus platform, built with Foundry.

## Contracts

| Contract | Description |
|----------|-------------|
| `AgentNexusAccount` | ERC-4337 smart account for users |
| `AgentRegistry` | On-chain agent registration and metadata |
| `AgentNexusEscrow` | Payment escrow for agent purchases |
| `AgentNexusEntitlements` | ERC-1155 access tokens |

## Setup

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Format

```bash
forge fmt
```

### Deploy

```bash
# Base Sepolia
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast

# Base Mainnet
forge script script/Deploy.s.sol --rpc-url $BASE_MAINNET_RPC_URL --broadcast --verify
```

## Environment Variables

Create a `.env` file:

> **⚠️ Security Warning:** Always use a disposable deployer key. Never use a wallet that holds funds you are not willing to lose.

```bash
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
```

## Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC-4337 Spec](https://eips.ethereum.org/EIPS/eip-4337)

## License

Apache 2.0
