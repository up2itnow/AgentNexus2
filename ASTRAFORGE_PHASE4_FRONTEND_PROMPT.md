# AstraForge Phase 4: Frontend Development - Complete Prompt

**Project**: AgentNexus V1 - Decentralized AI Agent Marketplace  
**Phase**: 4 - React/Next.js Frontend Application  
**Current Progress**: Backend 100% complete (3 services, all tests passing)  
**Target**: Production-ready marketplace UI with Base L2 integration

---

## 🎯 **MISSION**

Build a beautiful, modern, user-friendly React/Next.js frontend for the AgentNexus marketplace. Users should be able to:
1. Browse AI agents (with filtering, search, categories)
2. View agent details (pricing, capabilities, reviews)
3. Connect wallet (MetaMask, WalletConnect via RainbowKit)
4. Purchase agents (via smart contract)
5. Execute agents (run AI tasks)
6. View execution history and results
7. Manage their profile and entitlements

---

## 📋 **CONTEXT: WHAT'S ALREADY BUILT**

### **✅ Backend (100% Complete)**
- **AgentService**: Agent CRUD, filtering, statistics
- **WalletService**: ERC-4337 wallets, gasless transactions
- **ExecutionService**: Docker-based agent execution
- **Smart Contracts**: Escrow + Entitlements (deployed on Base Sepolia)
- **Database**: Prisma schema with all models

### **✅ Tech Stack Chosen**
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Blockchain**: wagmi v2, viem v2, RainbowKit
- **State**: React Context + SWR for data fetching
- **Forms**: React Hook Form + Zod validation

### **Project Location**
`/Users/billwilson_home/Desktop/AgentNexus-V1/frontend/`

---

## 🏗️ **ARCHITECTURE REQUIREMENTS**

### **Directory Structure**
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Homepage (marketplace)
│   │   ├── agents/
│   │   │   ├── page.tsx       # Agent list
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Agent detail
│   │   │       └── execute/
│   │   │           └── page.tsx # Execution interface
│   │   ├── profile/
│   │   │   └── page.tsx       # User profile
│   │   └── api/               # API routes (proxy to backend)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── agent/             # Agent-specific components
│   │   ├── wallet/            # Wallet components
│   │   └── execution/         # Execution components
│   ├── lib/
│   │   ├── api.ts            # Backend API client
│   │   ├── contracts.ts      # Smart contract ABIs/addresses
│   │   └── utils.ts          # Utilities
│   ├── hooks/
│   │   ├── useAgents.ts      # Agent data hooks
│   │   ├── useWallet.ts      # Wallet hooks
│   │   └── useExecution.ts   # Execution hooks
│   ├── contexts/
│   │   └── Web3Provider.tsx  # Web3 context
│   └── types/
│       └── index.ts          # Frontend types
└── public/
    └── images/               # Agent images, logos
```

---

## 🎨 **DESIGN REQUIREMENTS**

### **Visual Style**
- **Modern, Clean, Professional** (like Stripe or Vercel)
- **Base L2 Branding**: Blue accents (#0052FF - Base blue)
- **Dark Mode Support**: Toggle between light/dark
- **Responsive**: Mobile-first, works on all devices
- **Accessibility**: WCAG 2.1 AA compliant

### **Key UI Components**

#### **1. Homepage / Marketplace**
```tsx
// Components needed:
- <Navbar /> - Logo, search, wallet connect, profile
- <HeroSection /> - Welcome message, CTA
- <AgentGrid /> - Card grid with agents
- <AgentCard /> - Agent preview (image, name, category, price, rating)
- <FilterSidebar /> - Category, price range, status filters
- <SearchBar /> - Fuzzy search with autocomplete
- <FeaturedAgents /> - Carousel of featured agents
```

#### **2. Agent Detail Page**
```tsx
// Components needed:
- <AgentHeader /> - Name, category, developer, price
- <AgentDescription /> - Full description, capabilities
- <AgentStats /> - Executions, success rate, avg time
- <AgentSchema /> - Input/output schema display
- <PurchaseButton /> - Connect wallet → approve token → purchase
- <ExecutionSection /> - If owned, show execution interface
- <ReviewsSection /> - User reviews and ratings
```

#### **3. Execution Interface**
```tsx
// Components needed:
- <ExecutionForm /> - Dynamic form based on agent's inputSchema
- <ExecuteButton /> - Trigger execution
- <ExecutionProgress /> - Real-time status (pending → running → completed)
- <ExecutionLogs /> - Live log streaming
- <ExecutionResult /> - Output display with JSON viewer
- <ExecutionHistory /> - Past executions table
```

#### **4. Profile Page**
```tsx
// Components needed:
- <ProfileHeader /> - Wallet address, ENS, avatar
- <EntitlementsList /> - Agents user owns
- <ExecutionHistory /> - All user executions
- <PurchaseHistory /> - All purchases
- <WalletInfo /> - Balance, network, disconnect
```

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **1. Web3 Setup (Priority 1)**

**File**: `src/contexts/Web3Provider.tsx`
```tsx
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';

const config = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http()
  },
  // Add connectors: MetaMask, WalletConnect, Coinbase Wallet
});

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**File**: `src/app/layout.tsx`
```tsx
import { Web3Provider } from '@/contexts/Web3Provider';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
```

### **2. API Client (Priority 2)**

**File**: `src/lib/api.ts`
```typescript
// Backend API client with error handling
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

export async function getAgents(filters: AgentFilters) {
  const response = await fetch(`${API_BASE}/api/agents?${buildQuery(filters)}`);
  if (!response.ok) throw new Error('Failed to fetch agents');
  return response.json();
}

export async function getAgent(id: string) {
  const response = await fetch(`${API_BASE}/api/agents/${id}`);
  if (!response.ok) throw new Error('Agent not found');
  return response.json();
}

export async function executeAgent(dto: ExecuteAgentDto) {
  const response = await fetch(`${API_BASE}/api/executions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto)
  });
  if (!response.ok) throw new Error('Execution failed');
  return response.json();
}

// Add more API methods...
```

### **3. Smart Contract Integration (Priority 3)**

**File**: `src/lib/contracts.ts`
```typescript
import { parseAbi } from 'viem';

export const CONTRACTS = {
  escrow: {
    address: process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`,
    abi: parseAbi([
      'function depositPayment(bytes32 paymentId, address developer, uint256 agentId, uint256 amount, address token) external payable',
      'function releasePayment(bytes32 paymentId) external',
      // ... rest of ABI
    ])
  },
  entitlements: {
    address: process.env.NEXT_PUBLIC_ENTITLEMENTS_ADDRESS as `0x${string}`,
    abi: parseAbi([
      'function mint(address to, uint256 agentId, uint256 executionLimit, uint256 expirationTime, bool transferrable) external',
      // ... rest of ABI
    ])
  }
};

// Hooks for contract interactions
export function usePurchaseAgent() {
  const { writeContract } = useWriteContract();
  
  return async (agent: Agent, userAddress: string) => {
    const paymentId = generatePaymentId(userAddress, agent.id);
    
    await writeContract({
      address: CONTRACTS.escrow.address,
      abi: CONTRACTS.escrow.abi,
      functionName: 'depositPayment',
      args: [paymentId, agent.developerWallet, agent.id, agent.price, '0x...'],
      value: agent.price
    });
  };
}
```

### **4. Key Components**

**File**: `src/components/agent/AgentCard.tsx`
```tsx
export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={agent.imageUrl} />
            <AvatarFallback>{agent.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold">{agent.name}</h3>
            <Badge>{agent.category}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{agent.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="font-bold">{formatEther(agent.price)} ETH</span>
          <Button asChild>
            <Link href={`/agents/${agent.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**File**: `src/components/wallet/ConnectButton.tsx`
```tsx
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        return (
          <div>
            {!mounted || !account ? (
              <Button onClick={openConnectModal}>Connect Wallet</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={openChainModal} variant="outline">
                  {chain?.name}
                </Button>
                <Button onClick={openAccountModal}>
                  {account.displayName}
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
```

**File**: `src/components/execution/ExecutionForm.tsx`
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function ExecutionForm({ agent, onSubmit }: ExecutionFormProps) {
  // Generate Zod schema from agent.inputSchema
  const schema = generateSchemaFromJsonSchema(agent.inputSchema);
  
  const form = useForm({
    resolver: zodResolver(schema)
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Dynamically generate form fields based on schema */}
        <DynamicFormFields schema={agent.inputSchema} control={form.control} />
        <Button type="submit">Execute Agent</Button>
      </form>
    </Form>
  );
}
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 4A: Foundation (30 min)**
- [ ] Setup Next.js project with TailwindCSS
- [ ] Install dependencies (wagmi, viem, RainbowKit, shadcn/ui)
- [ ] Create Web3Provider with Base L2 config
- [ ] Setup root layout with providers
- [ ] Create basic Navbar component

### **Phase 4B: Marketplace (45 min)**
- [ ] Create homepage with agent grid
- [ ] Implement AgentCard component
- [ ] Add FilterSidebar component
- [ ] Implement search functionality
- [ ] Add pagination

### **Phase 4C: Agent Detail (30 min)**
- [ ] Create agent detail page
- [ ] Implement AgentHeader component
- [ ] Add AgentStats display
- [ ] Create PurchaseButton with wallet integration

### **Phase 4D: Execution Interface (45 min)**
- [ ] Create execution page
- [ ] Implement dynamic ExecutionForm
- [ ] Add real-time execution monitoring
- [ ] Display execution logs and results
- [ ] Create execution history table

### **Phase 4E: Profile & Polish (30 min)**
- [ ] Create profile page
- [ ] Add entitlements list
- [ ] Implement execution history
- [ ] Add dark mode toggle
- [ ] Polish responsiveness

---

## ✅ **SUCCESS CRITERIA**

1. **✅ Visual Excellence** - Beautiful, modern UI that matches Base branding
2. **✅ Full Functionality** - All user flows work end-to-end
3. **✅ Wallet Integration** - Seamless Base L2 wallet connection
4. **✅ Smart Contract Interaction** - Purchase and mint working
5. **✅ Real-time Updates** - Live execution monitoring
6. **✅ TypeScript Clean** - Zero compilation errors
7. **✅ Responsive** - Works on mobile, tablet, desktop
8. **✅ Accessible** - Keyboard navigation, screen reader support

---

## 📦 **DEPENDENCIES TO INSTALL**

```bash
# In frontend directory
pnpm add next@14 react@18 react-dom@18
pnpm add wagmi viem @tanstack/react-query
pnpm add @rainbow-me/rainbowkit
pnpm add react-hook-form @hookform/resolvers zod
pnpm add swr
pnpm add tailwindcss postcss autoprefixer
pnpm add -D @types/react @types/node typescript

# shadcn/ui components (run as needed)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input form avatar badge
```

---

## 🎨 **DESIGN INSPIRATION**

- **Marketplace**: Uniswap, OpenSea (clean card grids)
- **Agent Detail**: Stripe Docs (clear information hierarchy)
- **Execution Interface**: Railway.app (real-time logs)
- **Overall Feel**: Vercel (modern, professional, fast)

---

## 🔒 **SECURITY REQUIREMENTS**

1. **Never expose private keys** - Always use wallet providers
2. **Validate all inputs** - Client-side AND server-side
3. **Sanitize user data** - Prevent XSS attacks
4. **Use environment variables** - For API keys and contract addresses
5. **Implement rate limiting** - On API routes
6. **Check network** - Ensure user is on Base/Base Sepolia

---

## 🎯 **5-LLM COLLABORATION INSTRUCTIONS**

### **Round 1: Proposal**
Each LLM should propose:
- Component structure approach
- State management strategy
- Web3 integration pattern
- UI/UX considerations

### **Round 2: Critique**
Review other proposals for:
- Performance implications
- Accessibility gaps
- Security concerns
- Code maintainability

### **Round 3: Synthesis**
Combine best ideas:
- Optimal component hierarchy
- Best practices from each proposal
- Unified code style

### **Round 4: Vote**
Vote on consensus solution (need 66% agreement)

### **Round 5: Implementation**
Generate production-ready code!

---

## 📝 **DELIVERABLES**

1. **Complete Next.js app** in `/frontend/`
2. **All components** documented with JSDoc
3. **README.md** with setup instructions
4. **TypeScript** compiling with zero errors
5. **Responsive** on all screen sizes
6. **Base L2 integration** working on testnet

---

## 🚀 **READY FOR ASTRAFORGE!**

This prompt is comprehensive and ready for the 5-LLM panel. Let them collaborate and build the frontend!

**Estimated Time**: 2-3 hours (with 5-LLM collaboration)  
**Complexity**: HIGH (but well-specified)  
**Confidence**: HIGH (clear requirements, proven tech stack)

Good luck, AstraForge! Make AgentNexus shine! ✨

