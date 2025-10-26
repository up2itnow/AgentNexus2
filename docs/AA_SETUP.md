# Account Abstraction (AA) Setup

1. Env variables (backend/.env)
   - ALCHEMY_API_KEY
   - AA_CHAIN=base-sepolia|base
   - ENTRY_POINT_ADDRESS=0x...
   - PAYMASTER_POLICY_ID=...
   - PRIVATE_KEY (optional, testnet only)

2. Initialize at boot
   - WalletService will be constructed and its init() invoked in app bootstrap.

3. End-to-end
   - Implement purchase → escrow deposit → entitlement mint → execution once contracts are deployed; wire addresses via env.
