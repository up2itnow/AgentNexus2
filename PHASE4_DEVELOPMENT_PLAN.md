# Phase 4: Frontend Development Plan
## Approved by 5-LLM Unanimous Consensus

**Generated**: 2025-10-06  
**Consensus**: 5/5 (100% agreement)  
**Approach**: Synthesized from 5 different architectural perspectives  
**Estimated Time**: 3 hours

---

## 🎯 **EXECUTIVE SUMMARY**

Build a modern, responsive React/Next.js frontend for AgentNexus with:
- Beautiful marketplace UI
- Seamless Base L2 wallet integration  
- Real-time agent execution
- Professional UX matching Base branding

**Tech Stack**: Next.js 14, React 18, TypeScript, TailwindCSS, wagmi v2, RainbowKit, SWR

---

## 🏗️ **FINAL ARCHITECTURE** (Consensus Decision)

```
frontend/
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── layout.tsx             # Root layout + providers
│   │   ├── page.tsx               # Marketplace (homepage)
│   │   ├── agents/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Agent detail (tabbed)
│   │   └── profile/
│   │       └── page.tsx           # User profile
│   ├── components/
│   │   ├── marketplace/           # Marketplace-specific
│   │   │   ├── AgentGrid.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── agent/                 # Agent detail
│   │   │   ├── AgentHeader.tsx
│   │   │   ├── AgentTabs.tsx
│   │   │   ├── AgentStats.tsx
│   │   │   └── PurchaseButton.tsx
│   │   ├── execution/             # Execution interface
│   │   │   ├── ExecutionForm.tsx
│   │   │   ├── ExecutionStatus.tsx
│   │   │   ├── ExecutionLogs.tsx
│   │   │   └── ExecutionResult.tsx
│   │   ├── web3/                  # Web3 components
│   │   │   ├── ConnectButton.tsx
│   │   │   ├── NetworkSwitcher.tsx
│   │   │   └── TransactionStatus.tsx
│   │   ├── layout/                # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/
│   │   ├── api/                   # Backend API clients
│   │   │   ├── agents.ts
│   │   │   ├── executions.ts
│   │   │   └── users.ts
│   │   ├── contracts/             # Smart contracts
│   │   │   ├── escrow.ts
│   │   │   ├── entitlements.ts
│   │   │   └── abis/
│   │   │       ├── escrow.json
│   │   │       └── entitlements.json
│   │   ├── wagmi.ts              # Wagmi configuration
│   │   └── utils.ts              # Utilities
│   ├── hooks/
│   │   ├── useAgents.ts          # Agent data fetching
│   │   ├── usePurchase.ts        # Purchase workflow
│   │   ├── useExecution.ts       # Execution workflow
│   │   └── useProfile.ts         # User profile data
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   └── styles/
│       └── globals.css           # Global styles
├── public/
│   └── images/
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 📋 **IMPLEMENTATION PHASES**

### **Phase 4A: Foundation Setup** ⏱️ 30 min

**Goal**: Get basic infrastructure running

**Tasks**:
1. ✅ Initialize Next.js 14 with TypeScript
2. ✅ Install dependencies (wagmi, viem, RainbowKit, TailwindCSS, SWR, shadcn/ui)
3. ✅ Configure wagmi for Base L2
4. ✅ Setup providers (Web3Provider, ThemeProvider)
5. ✅ Create root layout with Navbar
6. ✅ Configure environment variables

**Files to Create**:
- `src/lib/wagmi.ts` - Wagmi config for Base/Base Sepolia
- `src/app/layout.tsx` - Root layout with providers
- `src/components/layout/Navbar.tsx` - Navigation bar with wallet connect
- `.env.local` - Environment variables template

**Success Criteria**:
- App runs on http://localhost:3000
- Wallet connect button works
- Base Sepolia network configured

---

### **Phase 4B: Marketplace** ⏱️ 45 min

**Goal**: Beautiful agent browsing experience

**Tasks**:
1. ✅ Create marketplace page (homepage)
2. ✅ Implement AgentCard component
3. ✅ Build AgentGrid with loading states
4. ✅ Add FilterSidebar (category, price range)
5. ✅ Implement SearchBar with debounce
6. ✅ Setup SWR data fetching with caching
7. ✅ Add pagination

**Files to Create**:
- `src/app/page.tsx` - Marketplace page
- `src/components/marketplace/AgentCard.tsx`
- `src/components/marketplace/AgentGrid.tsx`
- `src/components/marketplace/FilterSidebar.tsx`
- `src/components/marketplace/SearchBar.tsx`
- `src/hooks/useAgents.ts` - SWR hook for agent data
- `src/lib/api/agents.ts` - Agent API client

**Key Features**:
- Card grid layout (responsive: 1/2/3/4 columns)
- Agent card: image, name, category badge, price, description
- Filters: category dropdown, price slider, search
- Loading skeletons
- Empty state when no agents found

**Success Criteria**:
- Agents display in grid
- Filtering works
- Search works
- Responsive on mobile

---

### **Phase 4C: Agent Detail** ⏱️ 45 min

**Goal**: Rich agent information and purchase flow

**Tasks**:
1. ✅ Create agent detail page with tabs
2. ✅ Implement AgentHeader (hero section)
3. ✅ Build tabbed interface (Overview, Execute, Reviews)
4. ✅ Add AgentStats component
5. ✅ Implement PurchaseButton with wallet flow
6. ✅ Setup smart contract integration
7. ✅ Add transaction monitoring
8. ✅ Handle purchase states (idle, approving, purchasing, success, error)

**Files to Create**:
- `src/app/agents/[id]/page.tsx` - Agent detail page
- `src/components/agent/AgentHeader.tsx`
- `src/components/agent/AgentTabs.tsx`
- `src/components/agent/AgentStats.tsx`
- `src/components/agent/PurchaseButton.tsx`
- `src/hooks/usePurchase.ts` - Purchase workflow hook
- `src/lib/contracts/escrow.ts` - Escrow contract integration
- `src/lib/contracts/entitlements.ts` - Entitlements contract
- `src/components/web3/TransactionStatus.tsx` - Tx monitoring

**Purchase Flow** (Critical):
```
1. User clicks "Purchase Agent" button
2. Check wallet connected → show ConnectButton if not
3. Check network → prompt to switch to Base if wrong
4. Estimate gas → show total cost
5. [If ERC-20] Request token approval
6. [If ERC-20] Wait for approval tx (show progress)
7. Call depositPayment() on Escrow contract
8. Show transaction status (pending, confirming, success)
9. Wait for backend to detect tx
10. Backend mints entitlement
11. Refresh agent data
12. Show "Execute Agent" button
```

**Key Features**:
- Tabs: Overview (default), Execute (if owned), Reviews (future)
- Hero section with agent image, name, category, price
- Stats: total executions, success rate, avg time
- Purchase button states: Connect Wallet, Switch Network, Purchase, Executing, Success
- Transaction modal with progress
- Error handling with retry

**Success Criteria**:
- Agent details display correctly
- Tabs switch smoothly
- Purchase flow works end-to-end on testnet
- Transaction status updates in real-time
- Errors show user-friendly messages

---

### **Phase 4D: Execution Interface** ⏱️ 30 min

**Goal**: Intuitive agent execution with real-time feedback

**Tasks**:
1. ✅ Implement ExecutionForm (dynamic based on agent schema)
2. ✅ Add ExecutionStatus component (pending, running, completed, failed)
3. ✅ Build ExecutionLogs with live streaming
4. ✅ Create ExecutionResult display
5. ✅ Setup execution polling/websockets
6. ✅ Add execution history table

**Files to Create**:
- `src/components/execution/ExecutionForm.tsx` - Dynamic form
- `src/components/execution/ExecutionStatus.tsx` - Status indicator
- `src/components/execution/ExecutionLogs.tsx` - Log viewer
- `src/components/execution/ExecutionResult.tsx` - Result display
- `src/components/execution/ExecutionHistory.tsx` - History table
- `src/hooks/useExecution.ts` - Execution workflow hook
- `src/lib/api/executions.ts` - Execution API client

**Key Features**:
- Form generation from agent.inputSchema (JSON Schema → React Hook Form)
- Zod validation
- Real-time status updates (poll every 2s while running)
- Log streaming (append new logs)
- JSON result viewer (syntax highlighting)
- Execution history with status badges
- Re-execute button

**Success Criteria**:
- Form renders correctly for different schemas
- Execution submits successfully
- Status updates in real-time
- Logs appear as they're generated
- Result displays formatted JSON
- History shows past executions

---

### **Phase 4E: Profile Page** ⏱️ 20 min

**Goal**: User profile and execution management

**Tasks**:
1. ✅ Create profile page
2. ✅ Display user's entitlements
3. ✅ Show execution history with filters
4. ✅ Add wallet info display
5. ✅ Implement disconnect button

**Files to Create**:
- `src/app/profile/page.tsx` - Profile page
- `src/components/profile/EntitlementsList.tsx`
- `src/components/profile/ExecutionHistory.tsx`
- `src/components/profile/WalletInfo.tsx`
- `src/hooks/useProfile.ts` - Profile data hook

**Key Features**:
- User's wallet address (ENS if available)
- List of owned agents (entitlements)
- Execution history with filtering (status, agent, date)
- Pagination for history
- Wallet balance (ETH on Base)
- Disconnect wallet button

**Success Criteria**:
- Profile loads user data
- Entitlements display correctly
- History is paginated
- Can filter executions

---

### **Phase 4F: Polish & Optimization** ⏱️ 20 min

**Goal**: Production-ready UI/UX

**Tasks**:
1. ✅ Implement dark mode toggle
2. ✅ Add responsive design (mobile, tablet, desktop)
3. ✅ Create loading states for all data fetching
4. ✅ Implement error boundaries
5. ✅ Add toast notifications
6. ✅ Optimize images
7. ✅ Add meta tags for SEO
8. ✅ Test accessibility (keyboard navigation, screen readers)

**Files to Update**:
- All components - Add responsive classes
- `src/app/layout.tsx` - Add theme toggle
- Add `<Toaster>` component
- Update meta tags

**Key Features**:
- Dark mode (persists to localStorage)
- Mobile menu (hamburger)
- Skeleton loaders
- Toast notifications for actions
- Error boundaries with retry
- Image optimization (Next.js Image)
- Semantic HTML
- ARIA labels

**Success Criteria**:
- Works on mobile, tablet, desktop
- Dark mode toggles smoothly
- All actions show feedback
- Keyboard navigation works
- No console errors

---

## 🔧 **TECHNICAL SPECIFICATIONS**

### **Dependencies**

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "wagmi": "^2.0.0",
    "viem": "^2.0.0",
    "@rainbow-me/rainbowkit": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "swr": "^2.2.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "sonner": "^1.2.0"
  }
}
```

### **Environment Variables**

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8200
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_ENTITLEMENTS_ADDRESS=0x...
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### **Wagmi Configuration**

```typescript
// src/lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
    coinbaseWallet({ appName: 'AgentNexus' }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});
```

---

## ✅ **SUCCESS CRITERIA**

**Functional**:
- [ ] Users can browse agents
- [ ] Users can filter and search
- [ ] Users can connect wallet
- [ ] Users can purchase agents
- [ ] Users can execute agents
- [ ] Users can view execution history
- [ ] All transactions work on Base Sepolia

**Technical**:
- [ ] TypeScript compiles with zero errors
- [ ] No console errors or warnings
- [ ] Responsive on all screen sizes
- [ ] Dark mode works
- [ ] Loading states for all async operations
- [ ] Error handling for all API calls

**UX**:
- [ ] Beautiful, modern design
- [ ] Smooth animations and transitions
- [ ] Clear feedback for all actions
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Fast load times (< 3s LCP)

---

## 🚀 **READY TO BUILD!**

**Consensus**: 5/5 LLMs approved this plan  
**Confidence**: Very High  
**Estimated Time**: 3 hours  
**Next Step**: Begin Phase 4A - Foundation Setup

Let's build an amazing frontend for AgentNexus! 💪

