# AgentNexus Documentation

Welcome to the AgentNexus documentation! This directory contains comprehensive guides and references for developers, users, and contributors.

## 📚 Documentation Index

### Getting Started
- **[Main README](../README.md)** - Project overview and quick start
- **[Development Guide](./DEVELOPMENT.md)** - Set up your development environment
- **[Project Summary](../PROJECT_SUMMARY.md)** - Current status and roadmap

### Architecture & Design
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and component architecture
- **[Base Deployment Strategy](./BASE_DEPLOYMENT_STRATEGY.md)** - Why Base L2 and deployment plan

### API Reference
- **[API Documentation](./API.md)** - Complete API reference with examples
- **[Smart Contract Docs](../smart-contracts/DEPLOYMENT_GUIDE.md)** - Contract deployment guide

### Development
- **[Phase 1 Report](../PHASE_1_COMPLETION_REPORT.md)** - Foundation setup
- **[Phase 2 Report](../PHASE_2_COMPLETION_REPORT.md)** - Smart contracts
- **[Phase 3 Report](../PHASE_3_COMPLETION_REPORT.md)** - Backend services
- **[Phase 4A Report](../PHASE_4A_COMPLETION_REPORT.md)** - Frontend foundation
- **[Phase 4B Report](../PHASE_4B_COMPLETION_REPORT.md)** - Marketplace
- **[Phase 4C Report](../PHASE_4C_COMPLETION_REPORT.md)** - Agent detail & purchase
- **[Phase 4D Report](../PHASE_4D_COMPLETION_REPORT.md)** - Execution interface (TBD)
- **[Phase 4E Report](../PHASE_4E_COMPLETION_REPORT.md)** - Profile page (TBD)

## 🎯 Quick Links by Role

### For Developers

**Getting Started:**
1. Read the [Development Guide](./DEVELOPMENT.md)
2. Set up your environment
3. Run the application locally
4. Read [Architecture Overview](./ARCHITECTURE.md)

**Building Features:**
- Frontend: See `frontend/src/components/`
- Backend: See `backend/src/services/`
- Smart Contracts: See `smart-contracts/src/`

### For Users

**Using AgentNexus:**
1. Connect your wallet (MetaMask, WalletConnect, Coinbase Wallet)
2. Browse the marketplace
3. Purchase agents with ETH
4. Execute agents with your inputs
5. View results and download output

**Getting Help:**
- Discord: [Join our community](#)
- Twitter: [@AgentNexus](#)
- Email: support@agentnexus.io

### For Agent Creators

**Creating Agents:**
1. Build your agent (Docker container)
2. Test locally
3. Deploy to the marketplace
4. Set pricing and metadata
5. Earn from purchases (97.5% after platform fee)

**Resources:**
- Agent Development Guide (TBD)
- Docker Best Practices (TBD)
- Pricing Strategy Guide (TBD)

### For Contributors

**Contributing:**
1. Read the [Development Guide](./DEVELOPMENT.md)
2. Check open issues on GitHub
3. Fork the repository
4. Create a feature branch
5. Submit a pull request

**Code Standards:**
- TypeScript/JavaScript: ESLint + Prettier
- Solidity: Foundry + Style Guide
- Git: Conventional Commits

## 📖 Documentation by Topic

### Frontend

**Pages:**
- `/` - Marketplace with agent grid
- `/agents/[id]` - Agent detail page
- `/profile` - User dashboard

**Key Components:**
- `AgentGrid` - Responsive agent cards
- `ExecutionInterface` - Real-time execution
- `PurchaseButton` - Wallet integration
- `ProfileDashboard` - User stats

**Technologies:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- wagmi + RainbowKit
- TailwindCSS

### Backend

**API Endpoints:**
- `GET /api/agents` - List agents
- `POST /api/executions` - Execute agent
- `GET /api/users/:id/purchases` - User purchases

**Services:**
- **AgentService** - Agent management
- **WalletService** - Account abstraction
- **ExecutionService** - Docker execution

**Technologies:**
- Node.js 20 + Express
- Prisma ORM
- PostgreSQL + Redis

### Smart Contracts

**Contracts:**
- **AgentNexusEscrow** - Payment escrow
- **AgentNexusEntitlements** - ERC-1155 tokens

**Key Functions:**
- `depositPayment()` - Escrow payment
- `hasValidToken()` - Check access
- `releasePayment()` - Release to creator

**Technologies:**
- Solidity 0.8.24
- Foundry
- OpenZeppelin v5

## 🔗 External Resources

### Base L2
- [Base Documentation](https://docs.base.org/)
- [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- [Base Block Explorer](https://basescan.org/)

### Development Tools
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Foundry Book](https://book.getfoundry.sh/)
- [wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://rainbowkit.com/)

### Learning Resources
- [Ethereum Development](https://ethereum.org/en/developers/)
- [Solidity by Example](https://solidity-by-example.org/)
- [React Patterns](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🛠️ Common Tasks

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

### Building for Production

```bash
# Frontend
cd frontend && pnpm build

# Backend
cd backend && pnpm build
```

## 📊 Project Status

**Current Phase:** Phase 4 Complete (Frontend)  
**Next Phase:** Phase 5 (Agent Runtime)  
**Overall Progress:** 70% Complete

**Completed:**
- ✅ Phase 1: Foundation
- ✅ Phase 2: Smart Contracts
- ✅ Phase 3: Backend Services
- ✅ Phase 4: Frontend Application

**In Progress:**
- ⏳ Phase 5: Agent Runtime
- ⏳ Phase 6: Integration & Deployment

## 🤝 Getting Help

### Community Support
- **Discord**: [Join our server](#) - Real-time chat
- **GitHub Discussions**: Ask questions and share ideas
- **Twitter**: [@AgentNexus](#) - Updates and announcements

### Professional Support
- **Email**: support@agentnexus.io
- **Security Issues**: security@agentnexus.io
- **Business Inquiries**: hello@agentnexus.io

## 📝 Contributing to Docs

Found an error or want to improve the documentation?

1. Edit the relevant `.md` file
2. Submit a pull request
3. Tag with `documentation` label

**Documentation Style Guide:**
- Use clear, concise language
- Include code examples
- Add screenshots when helpful
- Keep formatting consistent

## 🔄 Version History

- **v1.0.0** (Current) - Initial release
  - Complete marketplace
  - Smart contract integration
  - Execution system
  - User profiles

## 📄 License

All documentation is licensed under MIT License.

---

**Need help?** Open an issue on [GitHub](https://github.com/yourusername/agentnexus/issues) or join our [Discord](#).

**Last Updated:** January 2025

