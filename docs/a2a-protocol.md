# Agent-to-Agent (A2A) Protocol Specification

## Overview

The AgentNexus A2A Protocol enables secure, composable inter-agent communication. Agents can call other agents to leverage specialized capabilities, creating powerful compound workflows.

**Public Good Potential**: This specification can be extracted as a standalone protocol for the broader AI agent ecosystem.

---

## Use Cases

1. **Trading + Analysis**: Paper Trader calls Summarizer for market analysis
2. **Multi-step Workflows**: Complex agent delegates subtasks
3. **Validation Chains**: Agents verify each other's outputs

---

## Protocol Design

### Message Format

```json
{
  "a2a_version": "1.0",
  "request_id": "uuid-v4",
  "timestamp": "ISO-8601",
  
  "caller": {
    "agent_id": "paper-trader",
    "execution_id": "exec-123"
  },
  
  "target": {
    "agent_id": "summarizer",
    "version": "1.0.0"
  },
  
  "payload": {
    "action": "ANALYZE",
    "data": { ... }
  },
  
  "options": {
    "timeout_ms": 5000,
    "priority": "normal"
  }
}
```

### Response Format

```json
{
  "a2a_version": "1.0",
  "request_id": "uuid-v4",
  "timestamp": "ISO-8601",
  
  "status": "SUCCESS" | "ERROR" | "TIMEOUT",
  
  "result": {
    "data": { ... },
    "confidence": 0.95
  },
  
  "metadata": {
    "execution_time_ms": 150,
    "tokens_used": 0
  }
}
```

---

## Security Model

### Trust Levels

| Level | Description | Requirements |
|-------|-------------|--------------|
| `INTERNAL` | Same-platform agents | Platform verification |
| `TRUSTED` | Whitelisted external | Registry + signature |
| `OPEN` | Any agent | Rate limits + escrow |

### Entitlement Flow

```
Caller Agent ──► A2A Gateway ──► Check Entitlements ──► Target Agent
                     │                    │
                     ▼                    ▼
              Payment Escrow        Access Token
```

---

## Implementation Reference

### Python (Agent Side)

```python
def call_agent(target_id: str, action: str, data: dict) -> dict:
    """Make A2A call to another agent."""
    request = {
        "a2a_version": "1.0",
        "request_id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "target": {"agent_id": target_id},
        "payload": {"action": action, "data": data}
    }
    
    # In-platform: direct call
    # Cross-platform: HTTP to A2A gateway
    response = a2a_gateway.execute(request)
    
    return response["result"]["data"]
```

### TypeScript (Backend Side)

```typescript
interface A2ARequest {
  a2a_version: string;
  request_id: string;
  caller: { agent_id: string; execution_id: string };
  target: { agent_id: string };
  payload: { action: string; data: unknown };
}

async function handleA2ARequest(req: A2ARequest): Promise<A2AResponse> {
  // 1. Validate caller entitlements
  // 2. Check target agent availability
  // 3. Execute target agent with payload
  // 4. Return response with metadata
}
```

---

## Grant Framing

### RetroPGF Eligibility

This protocol specification positions AgentNexus for:
- **Optimism RetroPGF**: Open protocol for agent interoperability
- **Base Grants**: Infrastructure for onchain AI agents
- **Gitcoin Grants**: Public good for AI ecosystem

### Key Claims

> "A2A Protocol enables composable AI agent workflows with trustless payment settlement."

> "AgentNexus contributes open standards for the emerging AI agent economy."

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial specification |

---

## Future Considerations

- Cross-chain agent calls via Wormhole/LayerZero
- Agent reputation scoring
- Decentralized agent registry
- Zero-knowledge proof of execution
