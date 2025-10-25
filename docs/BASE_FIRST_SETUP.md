# Base-First Setup (Testnet: Base Sepolia)

## 1. Contracts
- Copy `smart-contracts/env/.env.base.example` to `smart-contracts/env/.env.base` and fill variables.
- Run `smart-contracts/scripts/deploy-base.sh` after installing Foundry.
- Record deployed addresses and update backend `.env.base.example`.

## 2. Backend
- Copy `backend/.env.base.example` to `.env` with correct RPC_URL, EntryPoint, Paymaster, and contract addresses.
- Start: `npm ci && npm run build && npm start` (or via Docker).

## 3. Frontend
- Ensure the frontend uses Base chain RPCs and talks to backend API.
- Build: `pnpm install && pnpm build`.

## 4. CI
- CI workflows included: `ci.yml`, `codeql.yml`, `container-security.yml`.
- On PRs/Pushes, tests, builds, and scans run automatically.
