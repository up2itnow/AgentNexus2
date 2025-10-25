# Specification Alignment: AgentNexus2 (Refined) vs PROJECT_SPEC

This document maps current repository components to PROJECT_SPEC core features and notes gaps.

## Core Platform Features
- F-001 Escrow (Smart Contract)
  - Repo: contracts/src/AgentNexusEscrow.sol (and smart-contracts/src/AgentNexusEscrow.sol)
  - Status: Implemented; roles, platform fee, deposit/release/refund flows.
- F-002 ERC-1155 Entitlements
  - Repo: contracts/src/AgentNexusAccount*.sol and smart-contracts/src/AgentNexusEntitlements.sol
  - Status: Implemented; mint/burn, non-transferable options, supply limits.
- F-003 ERC-4337 Account Abstraction Wallet
  - Repo: backend/src/services/WalletService.ts (integration scaffolding), docs/specs cover Alchemy AA SDK v3+.
  - Status: Planned/partially scaffolded; needs viem v2.5+ and AA SDK wiring end-to-end.
- F-004 Backend Orchestrator API
  - Repo: backend/src (controllers, services, routes, utils), jest tests present.
  - Status: Implemented (core), needs CI activation and full OpenAPI surfacing.
- F-005 Agent Runtime Environment
  - Repo: agent-runtime/* with Docker profiles, security, monitoring.
  - Status: Implemented baseline; enhance hardening profiles and health checks.
- F-006/007 Web Marketplace + Discovery
  - Repo: frontend (Next.js app, components, e2e specs).
  - Status: Implemented baseline; requires wiring to live APIs and AA flows.
- F-008 Payment Processing System
  - Repo: contracts + backend Payment/Wallet services.
  - Status: Implemented (on-chain) + orchestrator integration path; end-to-end tests recommended.

## Agent-Specific Features
- F-009/010 Agent Catalog (General + Crypto)
  - Repo: backend/agents scaffolding, frontend discovery UI.
  - Status: Catalog structure present; seed data/templates via prisma/seed-templates.ts.
- F-011 Hyperliquid Integration
  - Repo: backend integration stubs + docs; no full adapter committed.
  - Status: Pending MVP trading agent + risk checks.
- F-012 Aster DEX Integration
  - Repo: docs/plans; adapters pending.
  - Status: Pending chain-specific adapters and config.

## Compliance & Security
- F-015 Geographic Restriction System
  - Repo: backend/services/ComplianceService.ts (planned), docs.
  - Status: Implement middleware + IP geolocation provider; add tests.
- F-016 KYC Integration Framework
  - Repo: docs + schema placeholders, no vendor binding yet.
  - Status: Integrate mock provider in V1, real provider V1.5.
- F-017 Security Scanning Pipeline
  - Repo: .github/workflows/security-scan.yml (present), runtime security notes.
  - Status: Ensure Trivy, CodeQL, Hadolint jobs active in CI.
- F-018 User Authentication System
  - Repo: backend JWT + AA hybrid design; types and middleware structures.
  - Status: Implement AA-first auth + JWT fallbacks.

## Gaps Summary (Actionable)
- Wire AA SDK v3/Account Kit v4 end-to-end with viem >=2.5.0.
- Provide Base chain deployment configs (EntryPoint, Paymaster, RPCs) and Foundry scripts.
- Implement compliance middleware and configurable country lists.
- Ship MVP trading agents for Hyperliquid and Base (proxy/trial modes), with toggles.
- Turn on CI pipelines (tests, security, container build) and publish artifacts.

