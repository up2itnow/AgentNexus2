# Sandbox (Base Sepolia) Verification Demo

These commands walk through the sandbox flow end-to-end: entitlement purchase, agent invocation, and x402+CCTP proof replay using Base Sepolia endpoints.

## Prerequisites

- Node.js 20+, pnpm 8+
- Foundry (`cast`) installed for on-chain reads
- Access to a Base Sepolia RPC endpoint (`BASE_SEPOLIA_RPC_URL`)
- Environment variables set in `backend/.env` for testnet keys and relayer funding

## Boot the stack

```bash
pnpm install
ENABLE_X402=true ENABLE_CCTP_ROUTES=true pnpm dev
```

The `pnpm dev` script starts both frontend and backend. Wait for `ready - started server` in the frontend logs and `Listening on :3001` in the backend logs.

## 1) Buy a test entitlement (Base Sepolia)

```bash
# Replace with your wallet address
BUYER=0xYourSepoliaWallet
# Sample contract address from DEPLOYMENTS.md
ENTITLEMENTS=0x661a9903747E7634e459ac1fb30F51f84D6f4063

cast send --rpc-url "$BASE_SEPOLIA_RPC_URL" \
  --private-key $PRIVATE_KEY \
  $ENTITLEMENTS "mintToken(address,string)" $BUYER "sandbox-demo"
```

Verify the token exists:

```bash
cast call --rpc-url "$BASE_SEPOLIA_RPC_URL" \
  $ENTITLEMENTS "hasValidToken(address)" $BUYER
```

## 2) Invoke the agent with entitlement proof

```bash
curl -i \
  -H "X-Wallet-Address: $BUYER" \
  -H "X-Entitlement-Token: sandbox-demo" \
  http://localhost:3001/agents/demo/run -d '{"input":"hello"}'
```

Expected: HTTP 200 with streaming logs; entitlement check must succeed before execution starts.

## 3) Replay x402 + CCTP proof on sandbox

```bash
# Request a premium resource to trigger 402
curl -i http://localhost:3001/agents/demo/premium-analytics | tee /tmp/resp.txt

# Extract the payment request to inspect available routes
jq -r '.paymentRequest.routes[] | [.name,.chain,.amount] | @tsv' /tmp/resp.txt

# Submit a recorded sandbox burn hash to simulate the relayer flow
curl -X POST http://localhost:3001/api/payments/cctp/submit \
  -H "Content-Type: application/json" \
  -d '{"burnTxHash":"0xsandboxburnhash","referenceId":"sandbox-demo"}'
```

Relayer logs should show `receiveMessage` submission to Base Sepolia followed by `creditFromCctp` on the receiver contract.

## 4) Confirm the credit on-chain

```bash
RECEIVER=0x661a9903747E7634e459ac1fb30F51f84D6f4063
cast call --rpc-url "$BASE_SEPOLIA_RPC_URL" \
  $RECEIVER "credits(bytes32)" $(cast keccak "sandbox-demo")
```

A non-zero balance indicates the sandbox credit was applied. Use `cast logs` against the receiver to view `CreditApplied` events for the same reference ID.
