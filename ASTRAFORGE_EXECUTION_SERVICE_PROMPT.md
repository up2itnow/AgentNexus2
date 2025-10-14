# AstraForge 5-LLM Collaborative Task: ExecutionService Implementation

## 🎯 **MISSION**

Implement the **ExecutionService** for AgentNexus - a Docker-based agent execution engine that runs AI agents in secure, isolated containers.

---

## 📋 **CONTEXT**

**Project**: AgentNexus V1 - Decentralized AI Agent Marketplace on Base L2  
**Current Phase**: Phase 3 - Backend Core (60% complete)  
**Location**: `/Users/billwilson_home/Desktop/AgentNexus-V1/backend/src/services/`  
**Development Mode**: 5-LLM Collaborative Consensus

**Already Completed**:
✅ TypeScript type definitions (`backend/src/types/index.ts`)
✅ Blockchain utilities (`backend/src/utils/blockchain.ts`)
✅ AgentService - Agent CRUD operations
✅ WalletService - ERC-4337 account abstraction
✅ Prisma schema with all models
✅ Clean TypeScript compilation (zero errors)

---

## 🎯 **WHAT TO BUILD**

**File to Create**: `backend/src/services/ExecutionService.ts`

### **Core Responsibilities**

1. **Docker Container Management**
   - Spin up isolated containers for each agent execution
   - Configure resource limits (CPU, memory, timeout)
   - Handle container lifecycle (create, start, monitor, stop, cleanup)

2. **Agent Execution**
   - Validate user has purchased agent (check entitlements)
   - Validate input data against agent's input schema
   - Execute agent in Docker container
   - Capture output and validate against output schema
   - Calculate execution metrics (duration, resources used)

3. **State Management**
   - Track execution status (PENDING, RUNNING, COMPLETED, FAILED, TIMEOUT)
   - Store execution records in Prisma database
   - Update agent statistics (total executions, success rate)

4. **Error Handling & Security**
   - Sandbox execution environment
   - Enforce timeouts
   - Capture and sanitize error messages
   - Rate limiting per user

---

## 📦 **TECHNICAL REQUIREMENTS**

### **Dependencies Already Installed**
```json
{
  "dockerode": "^4.0.9",
  "bull": "^4.16.5",
  "ioredis": "^5.8.1",
  "@prisma/client": "^5.22.0"
}
```

### **Imports Needed**
```typescript
import { PrismaClient, Execution, ExecutionStatus } from '@prisma/client';
import Docker from 'dockerode';
import {
  ExecuteAgentDto,
  ExecutionDetails,
  ExecutionLog,
  DockerError,
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '../types';
```

### **Class Structure**
```typescript
export class ExecutionService {
  private docker: Docker;
  private defaultTimeout: number = 300000; // 5 minutes
  private maxMemory: number = 512 * 1024 * 1024; // 512MB
  private maxCpuQuota: number = 50000; // 50% of one CPU

  constructor(
    private prisma: PrismaClient,
    private agentService: AgentService,
    private walletService: WalletService
  ) {
    this.docker = new Docker();
  }

  // Methods to implement (see below)
}
```

---

## 🔧 **METHODS TO IMPLEMENT**

### **1. Execute Agent** (Main Entry Point)
```typescript
async executeAgent(
  userId: string,
  dto: ExecuteAgentDto
): Promise<Execution>
```
**Flow**:
1. Verify user has purchased agent (check Entitlement)
2. Get agent details (docker image, schemas)
3. Validate input data against agent's input schema
4. Create execution record in database (status: PENDING)
5. Execute in Docker container
6. Validate output data against agent's output schema
7. Update execution record (status: COMPLETED/FAILED)
8. Update agent statistics
9. Return execution result

### **2. Run in Docker Container**
```typescript
private async runInDocker(
  execution: Execution,
  agent: Agent,
  inputData: any
): Promise<{ output: any; logs: string[] }>
```
**Flow**:
1. Pull Docker image if not present
2. Create container with resource limits
3. Inject input data as environment variable or volume
4. Start container
5. Monitor execution with timeout
6. Capture stdout/stderr as logs
7. Extract output from container
8. Cleanup container
9. Return output and logs

### **3. Validate Input/Output**
```typescript
private validateInput(agent: Agent, inputData: any): void
private validateOutput(agent: Agent, outputData: any): void
```
**Flow**:
- Use agent's `inputSchema`/`outputSchema` (JSON Schema)
- Validate structure and types
- Throw `ValidationError` if invalid

### **4. Check Entitlement**
```typescript
private async checkEntitlement(
  userId: string,
  agentId: string
): Promise<boolean>
```
**Flow**:
1. Query Prisma for Entitlement record
2. Check if not expired
3. Check if has remaining uses (if applicable)
4. Return true/false

### **5. Get Execution Status**
```typescript
async getExecutionStatus(executionId: string): Promise<Execution>
```
Simple Prisma query with relations (agent, user, purchase)

### **6. Get Execution Logs**
```typescript
async getExecutionLogs(executionId: string): Promise<ExecutionLog[]>
```
Parse logs from execution record

### **7. Cancel Execution**
```typescript
async cancelExecution(
  executionId: string,
  userId: string
): Promise<void>
```
**Flow**:
1. Verify user owns execution
2. Stop Docker container
3. Update status to FAILED
4. Add cancellation log

### **8. List User Executions**
```typescript
async listUserExecutions(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ executions: Execution[]; total: number }>
```
Paginated list with filtering

---

## 🏗️ **DOCKER CONFIGURATION**

### **Container Resource Limits**
```typescript
const containerConfig = {
  Image: agent.dockerImage,
  Env: [`INPUT_DATA=${JSON.stringify(inputData)}`],
  HostConfig: {
    Memory: this.maxMemory, // 512MB
    MemorySwap: this.maxMemory, // No swap
    CpuQuota: this.maxCpuQuota, // 50% CPU
    NetworkMode: 'none', // No network access (security)
    AutoRemove: true // Cleanup after exit
  },
  Tty: false,
  AttachStdout: true,
  AttachStderr: true
};
```

### **Output Extraction**
Agents should write output to `/output/result.json` inside container.
Use Docker volumes or `docker cp` to extract.

---

## 🔒 **SECURITY REQUIREMENTS**

1. **No network access** for containers (`NetworkMode: 'none'`)
2. **Resource limits** enforced (CPU, memory, timeout)
3. **Input sanitization** before passing to container
4. **Output validation** before returning to user
5. **User isolation** - users can only access their own executions
6. **Entitlement verification** - always check purchase before execution

---

## 📊 **DATABASE UPDATES**

After successful execution:
```typescript
// Update Agent statistics
await this.agentService.incrementExecutions(agent.id, agent.price);

// Update Execution record
await this.prisma.execution.update({
  where: { id: execution.id },
  data: {
    status: 'COMPLETED',
    outputData: validatedOutput,
    logs: JSON.stringify(logs),
    duration: Date.now() - startTime,
    completedAt: new Date()
  }
});
```

---

## ✅ **SUCCESS CRITERIA**

1. ✅ TypeScript compiles with zero errors
2. ✅ All methods implemented with proper error handling
3. ✅ Comprehensive inline documentation (JSDoc)
4. ✅ Type-safe (no `any` without justification)
5. ✅ Security best practices followed
6. ✅ Integration with existing services (AgentService, WalletService)
7. ✅ Proper Prisma transactions where needed
8. ✅ Resource cleanup (Docker containers always removed)

---

## 🎨 **CODE STYLE**

- **Match existing services** (AgentService, WalletService style)
- **Use async/await** throughout
- **Descriptive variable names**
- **JSDoc comments** on all public methods
- **Error handling** with try/catch and custom error classes
- **Logging** for important operations

---

## 🚀 **5-LLM COLLABORATION PROCESS**

### **Round 1: Proposal** (Parallel)
Each LLM proposes their implementation approach:
- **Grok**: Focus on creative Docker patterns
- **Gemini**: Focus on technical correctness and error handling
- **Claude (you)**: Focus on clean architecture and type safety
- **LLM 4**: Focus on security and validation
- **LLM 5**: Focus on performance and resource management

### **Round 2: Critique**
Each LLM reviews the other proposals and identifies strengths/weaknesses

### **Round 3: Synthesis**
Combine the best ideas from all proposals into unified approach

### **Round 4: Vote**
Vote on consensus solution (need 66% agreement)

### **Round 5: Implementation**
Generate final code based on consensus

---

## 📁 **FILE STRUCTURE**

```
backend/src/services/
├── AgentService.ts         ✅ (246 lines, complete)
├── WalletService.ts        ✅ (244 lines, complete)
└── ExecutionService.ts     🔄 (YOUR TASK - ~300-400 lines)
```

---

## 🧪 **EXAMPLE USAGE**

```typescript
// In API route handler
const executionService = new ExecutionService(prisma, agentService, walletService);

const execution = await executionService.executeAgent(userId, {
  agentId: 'clx1234567890',
  purchaseId: 'clx0987654321',
  inputData: {
    symbol: 'ETH',
    timeframe: '1h',
    strategy: 'momentum'
  }
});

console.log('Execution:', execution.status, execution.outputData);
```

---

## 🎯 **YOUR GOAL**

Create a **production-ready**, **secure**, **well-documented** ExecutionService that:
1. Safely executes AI agents in Docker containers
2. Validates inputs and outputs
3. Tracks execution state in the database
4. Integrates seamlessly with existing services
5. Handles errors gracefully
6. Enforces security and resource limits

**Let the 5-LLM collaboration begin!** 🚀

---

## 📝 **ADDITIONAL NOTES**

- **Error messages should be user-friendly** (sanitize stack traces)
- **Use transactions** for database operations that span multiple tables
- **Test Docker connection** in constructor (throw clear error if Docker not available)
- **Consider future extensions**: Execution queuing, parallel execution, caching
- **Follow the pattern** established in AgentService and WalletService

Good luck! The quality of this service will directly impact the success of AgentNexus. 💪

