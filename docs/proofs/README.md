# CCTP Proof Artifacts

This directory contains grant-safe proof artifacts demonstrating the CCTP integration.

## Safe to Commit

- `cctp-ethmainnet-to-basemainnet.json` - Mainnet proof (tx hashes, amounts, timestamps)

## NEVER Commit

These outputs may be generated locally but **MUST NOT** be committed:

- `*wallet*.json` - Wallet export files
- `*receipt*.json` - Raw transaction receipts with potentially sensitive data
- Files containing private keys, RPC URLs, or API keys

## Proof JSON Structure

The proof JSON contains only grant-safe, non-sensitive data:

```json
{
  "proofType": "CCTP E2E Verification",
  "timestamp": "ISO timestamp",
  "chains": {
    "source": "Ethereum Mainnet (chainId 1)",
    "destination": "Base Mainnet (chainId 8453)"
  },
  "cctp": {
    "amount": "1.0",
    "messageHash": "0x...",
    "attestationReceived": true
  },
  "transactions": {
    "burn": { "hash": "0x...", "block": "...", "explorer": "https://..." },
    "mint": { "hash": "0x...", "block": "...", "explorer": "https://..." },
    "credit": { "hash": "0x...", "block": "...", "explorer": "https://..." }
  }
}
```

## Verification

All transaction hashes can be verified on their respective block explorers:
- Ethereum: https://etherscan.io
- Base: https://basescan.org
