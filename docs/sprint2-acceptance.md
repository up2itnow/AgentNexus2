# Sprint 2 Acceptance Checklist

## Exit Criteria for "Credibility Hardening"

Complete all items below to truthfully claim:
> "This won't fall over under scrutiny."

---

## 1. CI/CD Active ✅

### Verification
```bash
# Check GitHub Actions status
# Visit: https://github.com/YOUR_ORG/agentnexus/actions
```

### Checklist
- [x] CI Suite workflow exists (`.github/workflows/ci.yml`)
- [x] Backend tests run on PR
- [x] Foundry tests run on PR
- [x] Docker build check runs
- [x] CI badges in README

### Evidence
- Screenshot of green CI badges in README
- Link to passing workflow run

---

## 2. Security Scans Visible ✅

### Verification
```bash
# View security scan results
# Visit: https://github.com/YOUR_ORG/agentnexus/security
```

### Checklist
- [x] CodeQL workflow (`.github/workflows/codeql.yml`)
- [x] Trivy container scans (`.github/workflows/security-scan.yml`)
- [x] Secrets scanning (`.github/workflows/secrets-scan.yml`)
- [x] Dependency audits

### Evidence
- Screenshot of security tab
- No critical vulnerabilities

---

## 3. Agent Runtime Constrained ✅

### Verification
```bash
# Check ExecutionService configuration
grep -A 10 "HostConfig" backend/src/services/ExecutionService.ts
```

### Checklist (all in ExecutionService.ts)
- [x] Memory limit: 512MB (`Memory: this.maxMemory`)
- [x] CPU quota: 50% (`CpuQuota: this.maxCpuQuota`)
- [x] Timeout: 5 min (`defaultTimeout: 300000`)
- [x] Non-root user (`User: '1000:1000'`)
- [x] Read-only rootfs (`ReadonlyRootfs: true`)
- [x] No network (`NetworkMode: 'none'`)
- [x] Seccomp profile (`SecurityOpt: [...seccomp...]`)
- [x] Drop all caps (`CapDrop: ['ALL']`)

### Evidence
- Code snippet from ExecutionService.ts
- Runtime config validator exists

---

## 4. Execution Receipts Available ✅

### Verification
```bash
# Fetch receipt via API
curl http://localhost:3001/api/receipts/{executionId}
```

### Checklist
- [x] `ExecutionReceipt` type defined
- [x] `ReceiptService` generates receipts
- [x] API endpoint: `GET /api/receipts/:id`
- [x] Receipt includes: ID, timestamp, agent, payment, status

### Evidence
- Sample receipt JSON response
- Screenshot of receipt for grant deck

---

## Sprint 2 Completion Summary

### Files Created
| File | Purpose |
|------|---------|
| `backend/src/types/ExecutionReceipt.ts` | Receipt type definitions |
| `backend/src/services/ReceiptService.ts` | Receipt generation |
| `backend/src/routes/receipts.ts` | Receipt API endpoints |
| `backend/src/utils/validateRuntimeConfig.ts` | Runtime config validator |

### Grant Language Unlocked
After completing all items:

1. **"CI active and enforced"** — Green badges visible
2. **"Security scans visible"** — CodeQL + Trivy running
3. **"Agent runtime constrained"** — Hardened Docker execution
4. **"Execution receipts available"** — API endpoint live

---

## Quick Verification Commands

```bash
# 1. Run backend tests
cd backend && pnpm test

# 2. Run linting
cd backend && pnpm lint

# 3. Run Foundry tests (if forge installed)
cd smart-contracts && forge test -vvv

# 4. Build Docker images
docker compose build

# 5. Generate Prisma client (resolves lint errors)
cd backend && pnpm prisma generate
```
