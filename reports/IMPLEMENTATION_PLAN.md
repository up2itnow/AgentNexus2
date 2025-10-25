# Implementation Plan (Approved)

- CI/CD Activation
  - GitHub Actions for unit tests, Foundry tests, Docker builds, CodeQL, Trivy, Hadolint.
- Base-First Configuration
  - Env templates created for backend and smart-contracts.
  - Foundry script for Base deployments.
- AA SDK Wiring (Next commits)
  - Lock viem >= 2.5.0 and AA SDK packages in backend.
  - Implement end-to-end purchase → mint → execute flow.
- Runtime Hardening & Compliance (Next commits)
  - Container security options in Dockerfiles, geofencing middleware, mock KYC.
- MVP Trading Agents (Next commits)
  - Hyperliquid reference agent and Base-chain perp proxy agent.
