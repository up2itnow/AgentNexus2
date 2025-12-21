# Archived Debug Scripts

## Why These Are Archived

During development, multiple exploratory and diagnostic scripts were created to validate CCTP behavior, environment configuration, and contract state across testnet and mainnet.

Once the canonical end-to-end verification flow was finalized and mainnet proof completed, these scripts were archived to:
- reduce surface area for confusion,
- ensure a single authoritative verification path,
- preserve historical context for future contributors.

---

These scripts were used during development and debugging. They are preserved here for reference but are not part of the canonical verification flow.

## Archived Files

| Script | Purpose |
|--------|---------|
| `check-base.ts` | Base chain contract checks |
| `check-message.ts` | Message bytes extraction debug |
| `check-paused.ts` | Contract pause state check |
| `checksum.ts` | Address checksum utility |
| `debug-cctp.ts` | CCTP debugging |
| `debug-env.ts` | Environment variable debug |
| `debug-state.ts` | Contract state debugging |
| `final-verify-cctp.ts` | Early verification attempt |
| `find-mint-tx.ts` | Mint transaction lookup |
| `verify-cctp-flow.ts` | Early flow verification |

## Canonical Scripts

Production scripts remain in `backend/scripts/`:
- `verify-cctp-mainnet.ts` - **Canonical** mainnet E2E proof script
- `verify-cctp-sepolia.ts` - Testnet verification
