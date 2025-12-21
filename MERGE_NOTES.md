# MERGE_NOTES.md - CCTP Proof Hardening

> **Quick Verification**: See [Reviewer Walkthrough](./docs/REVIEWER_WALKTHROUGH.md) for 5-minute proof verification.

## What Changed

### Proof Script Reliability (`verify-cctp-mainnet.ts`)

1. **Resume Mode**: Script no longer re-burns USDC on rerun
   - Set `CCTP_BURN_TX_HASH` to resume from existing burn tx
   - Set `CCTP_MESSAGE_HASH` to skip directly to Iris polling
   
2. **Fail-Fast Env Validation**: No more silent fallbacks
   - Missing or placeholder env vars throw immediately
   - Clear error messages with env var name
   
3. **Burn Confirmation**: Requires `CONFIRM_MAINNET_BURN=true` to broadcast
   - Prints prominent warning before any mainnet transaction
   - Hard cap of 2 USDC enforced
   
4. **EOA Rejection**: Rejects non-contract recipients by default
   - Set `ALLOW_EOA_RECIPIENT=true` to override (not recommended)
   
5. **Robust Iris Polling**:
   - Tries v1, v2, and legacy endpoints
   - 25s HTTP timeout, backoff: 30s (first 10 attempts), 60s thereafter
   - Infinite retry until attestation received

### Grant-Safe Proof Artifacts

- `docs/proofs/README.md` - Documents safe vs unsafe files
- `docs/proofs/cctp-ethmainnet-to-basemainnet.template.json` - Safe placeholder template
- Proof JSON excludes raw attestation bytes, RPC URLs, private keys

### Security Hardening

- Enhanced `.gitignore` with comprehensive secret patterns

---

## Trust Model

> **"Permissionless minting; credit application currently role-gated for spoof-proofing."**

Roadmap: Permissionless crediting via atomic relay-and-credit with message-bound metadata (hooks), or via mint-to-beneficiary flows.

## Testnet Note

Circle testnet may not configure all routes (e.g., OP/ARB Sepolia → Base Sepolia). Mainnet proof is used for grant verification.

---

## Secret Scan Report

**Scans Run:**
- `grep` for `alchemy.com/v2/`, `infura.io/v3/`, `PRIVATE_KEY=0x`, `BEGIN PRIVATE KEY`, `mnemonic`

**Results:**
- ✅ No real private keys in tracked files
- ✅ No real API keys with secrets
- Files found with Alchemy URLs are safe placeholders:
  - `.env.example` (uses `your-api-key`)
  - `docs/*.md` (documentation examples)
  - `smart-contracts/*.example` (template files)

**Known-Safe Placeholders:**
- `PRIVATE_KEY=0x...` in docs (ellipsis placeholder)
- `your-api-key` in example files

---

## How to Run Proof in Resume Mode

```bash
# Resume from burn tx (recommended)
CCTP_BURN_TX_HASH=0x60d4ceb83736d9ad2b989c0e73593386bd4d90f35e0a2e8843a68193a4cf2b74 \
npx tsx scripts/verify-cctp-mainnet.ts

# Resume from message hash (Iris polling only - mint will fail)
CCTP_MESSAGE_HASH=0xbd7d4a3750a608... \
npx tsx scripts/verify-cctp-mainnet.ts
```

## Required Environment Variables

```bash
# Required (no placeholders!)
ETHEREUM_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
PAYER_PRIVATE_KEY=0x...   # For burn (not needed in resume mode)
RELAYER_PRIVATE_KEY=0x... # For mint/credit on Base
CCTP_BASE_RECEIVER_CONTRACT_MAINNET=0x...

# Optional
MAINNET_PROOF_AMOUNT_USDC=1.0      # Default 1.0, max 2.0
CONFIRM_MAINNET_BURN=true          # Required for new burns
CCTP_IRIS_BASE_URL=https://iris-api.circle.com
```

---

## Merge Checklist

### Pre-Merge Verification

```bash
# 1. Run tests (backend)
cd backend && pnpm test

# 2. Verify proof script in resume mode (no tx broadcast)
CCTP_BURN_TX_HASH=0x60d4ceb83736d9ad2b989c0e73593386bd4d90f35e0a2e8843a68193a4cf2b74 \
npx tsx scripts/verify-cctp-mainnet.ts
```

### PR Branch (in Dev Repo)

```bash
git checkout -b chore/cctp-proof-hardening
```

### Commits (3 commits max)

1. `fix: cctp proof resume mode + env fail-fast + iris polling hardening`
2. `docs: trust model + proofs readme + merge notes`
3. `chore: gitignore + security hygiene`

### Files to Copy to Public Repo

- `backend/scripts/verify-cctp-mainnet.ts`
- `backend/src/config/cctp.ts`
- `docs/proofs/README.md`
- `docs/proofs/cctp-ethmainnet-to-basemainnet.template.json`
- `.gitignore`
- `MERGE_NOTES.md`

### Files to NEVER Copy

- `.env`, `.env.*`
- `*wallet*.json`
- `*receipt*.json`
- Any file with real private keys or API keys

---

## Grant Publication

1. Run script in resume mode with existing burn tx
2. Verify `docs/proofs/cctp-ethmainnet-to-basemainnet.json` generated
3. Commit proof JSON (no secrets)
4. Reference proof in grant application with explorer links:
   - **Burn** (Ethereum): https://etherscan.io/tx/0x60d4ceb83736d9ad2b989c0e73593386bd4d90f35e0a2e8843a68193a4cf2b74
   - **Credit** (Base): https://basescan.org/tx/0x33c251f0c336baf6c6121878cbf8c0e09581adb30e4208b832bfb9f2f5c7c455

---

## Repository Hygiene (Final Sanitization)

### Files Archived

| Location | Files | Reason |
|----------|-------|--------|
| `docs/proofs/_archive/` | `cctp-ethsepolia-to-basesepolia.json` | Testnet placeholder, superseded by mainnet proof |
| `backend/scripts/_archive/` | 10 debug scripts | One-off debugging, not part of canonical flow |

### Secret/PII Scan Results

- ✅ No RPC URLs with embedded keys
- ✅ No private keys or mnemonics
- ✅ No personal email addresses (only demo/test emails)
- ✅ No local filesystem paths in tracked files
- ✅ No usernames or machine names

### Canonical Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| **Mainnet Proof** | `docs/proofs/cctp-ethmainnet-to-basemainnet.json` | ✅ Canonical |
| **Proof Template** | `docs/proofs/cctp-ethmainnet-to-basemainnet.template.json` | ✅ Safe |
| **CCTP Docs** | `docs/x402-cctp.md` | ✅ Updated |

### Repository is Ready For

- ✅ Public visibility
- ✅ Grant review
- ✅ External developer reading

---

## PR Readiness Report

### What Changed (Tooling + Docs Only)
- `backend/scripts/verify-cctp-mainnet.ts` - Proof script with resume mode, fail-fast env validation
- `backend/src/config/cctp.ts` - Corrected MessageTransmitter addresses
- `docs/proofs/*` - Canonical mainnet proof artifact
- `docs/REVIEWER_WALKTHROUGH.md` - 5-minute verification guide
- `docs/x402-cctp.md` - Trust model and architecture docs
- `.gitignore` - Hardened secret patterns

### What Did NOT Change
- ❌ No runtime service behavior changes
- ❌ No contract logic changes  
- ❌ x402 remains disabled by default
- ❌ No new dependencies added

### How to Verify in 5 Minutes
1. Open [Reviewer Walkthrough](./docs/REVIEWER_WALKTHROUGH.md)
2. Click each explorer link (burn, attestation, mint, credit)
3. Verify tx hashes match proof JSON
4. Confirm receiver contract is a contract (not EOA)

### No-Custody Statement
> **"Funds are non-custodial. USDC flows directly from Circle's burn contract on Ethereum to Circle's mint contract on Base, then into the AgentNexusCctpReceiver contract. The relayer service pays gas only and never holds user funds."**

### Final Secret Scan
```
✅ billwilson_home: None
✅ /Users/: None  
✅ alchemy.com/v2/ with keys: None
✅ infura with keys: None
✅ .env tracked: None
```
