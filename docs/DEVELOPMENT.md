# Development Guide

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** & Docker Compose ([Download](https://docker.com/))
- **PostgreSQL** 15+ ([Download](https://postgresql.org/))
- **Redis** 7+ ([Download](https://redis.io/))
- **Foundry** ([Install](https://getfoundry.sh/))
- **Git** ([Download](https://git-scm.com/))

### Clone the Repository

```bash
git clone https://github.com/up2itnow/AgentNexus2.git AgentNexus2
cd AgentNexus2
```

### Project Structure

```
AgentNexus/
├── frontend/              # Next.js frontend application
├── backend/               # Node.js backend API
├── smart-contracts/       # Solidity smart contracts
├── agent-runtime/         # Docker agent execution
├── docs/                  # Documentation
├── docker-compose.yml     # Docker services
├── pnpm-workspace.yaml    # Monorepo configuration
└── package.json           # Root package.json
```

## Development Setup

### 1. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 2. Set Up Environment Variables

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_ENTITLEMENTS_ADDRESS=0x...
```

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentnexus
REDIS_URL=redis://localhost:6379
BASE_RPC_URL=https://sepolia.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key
```

**Smart Contracts** (`smart-contracts/.env`):
```bash
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_key
PRIVATE_KEY=your_private_key
```

### 3. Start Database Services

```bash
docker-compose up -d postgres redis
```

### 4. Run Database Migrations

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma generate
```

### 5. Deploy Smart Contracts (Testnet)

```bash
cd smart-contracts
forge build
forge test
forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
pnpm dev
# Server running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
# Application running on http://localhost:3000
```

## Development Workflow

### Frontend Development

**File Structure:**
```
frontend/src/
├── app/                    # Pages (App Router)
├── components/             # React components
├── hooks/                  # Custom hooks
├── lib/                    # Utilities
├── providers/              # Context providers
└── types/                  # TypeScript types
```

**Adding a New Page:**
1. Create folder in `app/`: `app/my-page/`
2. Add `page.tsx`: `export default function MyPage() { ... }`
3. Add to navigation if needed

**Adding a Component:**
1. Create file: `components/my-component/MyComponent.tsx`
2. Export component: `export function MyComponent() { ... }`
3. Add tests: `MyComponent.test.tsx`

**Running Tests:**
```bash
cd frontend
pnpm test           # Run tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage report
```

**Type Checking:**
```bash
pnpm type-check
```

**Linting:**
```bash
pnpm lint
pnpm lint:fix
```

### Backend Development

**File Structure:**
```
backend/src/
├── index.ts               # Express server
├── routes/                # API routes
├── services/              # Business logic
├── types/                 # Type definitions
├── utils/                 # Helper functions
└── prisma/                # Database schema
```

**Adding a New API Endpoint:**

1. Define route in `routes/`:
```typescript
// routes/agents.ts
router.get('/agents', agentController.list);
```

2. Add controller logic:
```typescript
// controllers/agentController.ts
export async function list(req, res) {
  const agents = await agentService.list(req.query);
  res.json(agents);
}
```

3. Implement service:
```typescript
// services/AgentService.ts
async list(filters: AgentFilters) {
  return await prisma.agent.findMany({ where: filters });
}
```

**Database Migrations:**
```bash
# Create migration
pnpm prisma migrate dev --name add_new_field

# Apply migrations
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset
```

**Prisma Studio** (Database GUI):
```bash
pnpm prisma studio
# Opens http://localhost:5555
```

### Smart Contract Development

**File Structure:**
```
smart-contracts/
├── src/                   # Contract source code
├── test/                  # Foundry tests
├── script/                # Deployment scripts
└── foundry.toml           # Foundry config
```

**Writing Tests:**
```solidity
// test/MyContract.t.sol
contract MyContractTest is Test {
    MyContract public myContract;

    function setUp() public {
        myContract = new MyContract();
    }

    function testFunction() public {
        // Test logic
    }
}
```

**Running Tests:**
```bash
forge test                 # Run all tests
forge test -vvv            # Verbose output
forge test --match-test testName  # Run specific test
forge coverage             # Coverage report
```

**Gas Profiling:**
```bash
forge test --gas-report
```

**Deploying Contracts:**
```bash
# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast

# Verify on Basescan
forge verify-contract <address> <contract> --chain base-sepolia
```

## Testing

### Unit Tests

**Frontend:**
```bash
cd frontend
pnpm test
```

**Backend:**
```bash
cd backend
pnpm test
```

**Smart Contracts:**
```bash
cd smart-contracts
forge test
```

### Integration Tests

```bash
# Start all services
docker-compose up -d

# Run integration tests
pnpm test:integration
```

### E2E Tests

```bash
cd frontend
pnpm playwright install
pnpm test:e2e
```

## Debugging

### Frontend Debugging

**VS Code Launch Configuration:**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Next.js: debug",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev"],
  "cwd": "${workspaceFolder}/frontend",
  "port": 9229,
  "console": "integratedTerminal"
}
```

**Browser DevTools:**
- React DevTools extension
- Redux DevTools (if using Redux)
- wagmi DevTools (for Web3)

### Backend Debugging

**VS Code Launch Configuration:**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Backend: debug",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev"],
  "cwd": "${workspaceFolder}/backend",
  "env": {
    "NODE_ENV": "development"
  }
}
```

**Logging:**
```typescript
import { logger } from './utils/logger';

logger.info('Message', { metadata });
logger.error('Error', { error });
```

### Smart Contract Debugging

**Foundry Debugger:**
```bash
forge test --debug testFunctionName
```

**Console Logging:**
```solidity
import "forge-std/console.sol";

console.log("Value:", value);
```

## Code Style

### TypeScript/JavaScript

We use ESLint and Prettier for code formatting.

**ESLint Configuration:**
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off"
  }
}
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100
}
```

**Run Formatting:**
```bash
pnpm format        # Format all files
pnpm lint:fix      # Fix linting issues
```

### Solidity

We follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html).

**Key Rules:**
- 4 spaces indentation
- Contract names in PascalCase
- Function names in camelCase
- Constants in UPPER_CASE
- Comments for all public functions

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user profile page
fix: resolve wallet connection issue
docs: update API documentation
refactor: simplify agent service logic
test: add tests for execution flow
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and commit
3. Push to remote: `git push origin feature/my-feature`
4. Create Pull Request on GitHub
5. Request review from team member
6. Address feedback
7. Merge after approval

## Performance Optimization

### Frontend

**Bundle Analysis:**
```bash
cd frontend
ANALYZE=true pnpm build
```

**Image Optimization:**
- Use Next.js `Image` component
- Implement lazy loading
- Use WebP format

**Code Splitting:**
- Dynamic imports for heavy components
- Route-based splitting (automatic with Next.js)

### Backend

**Database Optimization:**
- Add indexes for frequent queries
- Use connection pooling
- Implement query caching

**API Optimization:**
- Response compression (gzip)
- Rate limiting
- Request batching

## Security Best Practices

### Frontend

- Sanitize user inputs
- Use CSP headers
- Avoid XSS vulnerabilities
- Verify smart contract transactions

### Backend

- Validate all inputs (Zod schemas)
- Use parameterized queries
- Implement rate limiting
- Sanitize error messages

### Smart Contracts

- Follow checks-effects-interactions
- Use ReentrancyGuard
- Validate all inputs
- Comprehensive testing

## Common Issues

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart postgres
```

### Issue: "Module not found"

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Issue: "Smart contract deployment failed"

**Solution:**
- Check private key is funded
- Verify RPC URL is correct
- Check gas price settings

## Useful Commands

```bash
# Monorepo commands
pnpm install              # Install all dependencies
pnpm build               # Build all packages
pnpm test                # Test all packages
pnpm clean               # Clean all build artifacts

# Frontend
cd frontend
pnpm dev                 # Start dev server
pnpm build               # Production build
pnpm start               # Start production server

# Backend
cd backend
pnpm dev                 # Start dev server
pnpm prisma studio       # Open database GUI

# Smart Contracts
cd smart-contracts
forge build              # Compile contracts
forge test               # Run tests
forge fmt                # Format code
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Foundry Book](https://book.getfoundry.sh/)
- [wagmi Documentation](https://wagmi.sh/)
- [Base Documentation](https://docs.base.org/)

## Getting Help

- **GitHub Issues**: Report bugs
- **Discord**: Join our community
- **Stack Overflow**: Tag with `agentnexus`

