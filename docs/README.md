# AgentNexus Documentation

This directory contains technical documentation for developers and contributors.

## Documentation Index

### Getting Started
- [Main README](../README.md) - Project overview, status, and scope
- [Development Guide](./DEVELOPMENT.md) - Set up your development environment

### Architecture & Design
- [Architecture Overview](./ARCHITECTURE.md) - System design and component architecture
- [Base Deployment Strategy](./BASE_DEPLOYMENT_STRATEGY.md) - L2 deployment plan

### API Reference
- [API Documentation](./API.md) - Complete API reference with examples
- [Smart Contract Docs](../smart-contracts/DEPLOYMENT_GUIDE.md) - Contract deployment guide

## Project Structure

| Component | Location | Description |
|-----------|----------|-------------|
| Frontend | `frontend/src/` | Next.js App Router application |
| Backend | `backend/src/` | Node.js + Express services |
| Smart Contracts | `smart-contracts/src/` | Solidity contracts (Foundry) |
| Agent Runtime | `agent-runtime/` | Docker execution environment |

## Common Tasks

### Running Tests

```bash
# Frontend
cd frontend && pnpm test

# Backend
cd backend && pnpm test

# Smart Contracts
cd smart-contracts && forge test
```

### Deploying Contracts

```bash
cd smart-contracts
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

### Database Migrations

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma generate
```

## Contributing to Docs

1. Edit the relevant `.md` file
2. Submit a pull request
3. Tag with `documentation` label

## License

MIT
