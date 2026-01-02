# Base Mainnet Verification Demo

Use this script to replay the production proof chain (entitlement, agent execution, x402+CCTP credit) against Base mainnet.
Run all commands from the repository root so relative paths resolve correctly.

## Prerequisites

- Base mainnet RPC URL exported as `BASE_RPC_URL` and the signing key as `PRIVATE_KEY`
- `cast`, `curl`, and `jq` installed
- Wallet funded with small amount of ETH+USDC for gas/fees
- Backend `.env` configured with `ENABLE_X402=true`, `ENABLE_CCTP_ROUTES=true`, and relayer key funded on Base

## Boot production-configured services

```bash
pnpm install
ENABLE_X402=true ENABLE_CCTP_ROUTES=true CCTP_DESTINATION=base pnpm dev
```

## 1) Purchase a live entitlement

```bash
BUYER=0xYourBaseWallet
ENTITLEMENTS=0x3c8f32F9cF41Dc255129d6Add447218053743b33

cast send --rpc-url "$BASE_RPC_URL" \
  --private-key $PRIVATE_KEY \
  $ENTITLEMENTS "mintToken(address,string)" $BUYER "mainnet-demo"

cast call --rpc-url "$BASE_RPC_URL" \
  $ENTITLEMENTS "hasValidToken(address)" $BUYER
```

## 2) Invoke an agent and capture the response proof

```bash
curl -i \
  -H "X-Wallet-Address: $BUYER" \
  -H "X-Entitlement-Token: mainnet-demo" \
  http://localhost:3001/agents/demo/run -d '{"input":"mainnet check"}' | tee /tmp/run.log
```

Look for a 200 response with execution logs streamed from the container.

## 3) Generate a 402 and pay via CCTP (Ethereum → Base)

```bash
# Trigger the paywall
curl -i http://localhost:3001/agents/demo/premium-analytics | tee /tmp/paywall.txt

# Extract the Base mainnet route
jq -r '.paymentRequest.routes[] | select(.chain=="base") | .paymentRequest' /tmp/paywall.txt > /tmp/payment-request.json

# Submit a previously recorded burn (from docs proof) to simulate end-to-end credit
curl -X POST http://localhost:3001/api/payments/cctp/submit \
  -H "Content-Type: application/json" \
  -d '{"burnTxHash":"0x60d4ceb83736d9ad2b989c0e73593386bd4d90f35e0a2e8843a68193a4cf2b74","referenceId":"mainnet-demo"}'
```

Monitor backend logs for `receiveMessage` and `creditFromCctp` confirmations.

## 4) Verify the on-chain credit and historical proof

```bash
RECEIVER=0xeCEE0ddcafED1cA856865a8Fee95E1859027cAe0
cast call --rpc-url "$BASE_RPC_URL" \
  $RECEIVER "credits(bytes32)" $(cast keccak "mainnet-demo")
```

For the canonical mainnet proof, download and inspect the JSON artifact included in this repo:

```bash
cat docs/proofs/cctp-ethmainnet-to-basemainnet.json | jq '.'
```

The JSON contains the burn, attestation, mint, and credit hashes used for grant verification.
