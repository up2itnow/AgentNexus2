# AgentNexus Frontend

**Built with Next.js 14, React 19, TypeScript, and Tailwind CSS**

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage (marketplace)
│   │   ├── agents/            # Agent detail pages
│   │   ├── profile/           # User profile
│   │   └── builder/           # 🆕 Agent Builder (NEW!)
│   │       ├── page.tsx                  # Builder landing
│   │       ├── template/                 # Template builder
│   │       ├── modular/                  # Modular builder
│   │       ├── advanced/                 # Code editor
│   │       └── my-agents/                # Custom agents dashboard
│   ├── components/            # Reusable React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and API client
│   ├── types/                 # TypeScript type definitions
│   ├── providers/             # Context providers
│   └── styles/                # Global styles
├── public/                    # Static assets
├── e2e/                      # E2E tests (Playwright)
└── docs/                      # Documentation
```

---

## 🎨 Features

### **Marketplace**
- Browse and search agents
- Filter by category, price, popularity
- View agent details
- Purchase and execute agents

### **Agent Builder** (NEW! ✨)
Three ways to create custom agents:

1. **🟢 Beginner (Template Builder)**
   - Select from pre-built templates
   - Configure with simple forms
   - ~5 minutes to create

2. **🟡 Hybrid (Modular Builder)**
   - Drag-and-drop modules
   - Visual workflow composition
   - ~10 minutes to create

3. **🔴 Advanced (Code Editor)**
   - Full TypeScript/JavaScript code editor
   - Monaco editor (VS Code engine)
   - ~20 minutes to create

### **User Profile**
- View purchase history
- Track execution history
- Manage custom agents
- View statistics

---

## 🔌 API Integration

### **Backend URL**
Set in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### **API Endpoints**

#### Marketplace
```
GET    /api/agents              # List all agents
GET    /api/agents/:id          # Get agent details
POST   /api/executions          # Execute an agent
```

#### Builder
```
GET    /api/builder/templates          # List templates
GET    /api/builder/templates/:id      # Get template
GET    /api/builder/modules             # List modules
POST   /api/builder/generate            # Create agent
POST   /api/builder/preview             # Preview agent
GET    /api/builder/my-agents/:userId   # User's agents
PATCH  /api/builder/agents/:id          # Update agent
POST   /api/builder/agents/:id/deploy   # Deploy agent
DELETE /api/builder/agents/:id          # Delete agent
```

---

## 🧪 Testing

### **Unit Tests**
```bash
pnpm test
```

### **E2E Tests**
```bash
pnpm playwright test
```

### **Type Check**
```bash
pnpm type-check
```

### **Linting**
```bash
pnpm lint
```

---

## 📦 Dependencies

### **Core**
- **Next.js 14** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### **UI Components**
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **clsx** - Class name utility

### **Data Fetching**
- **SWR** - Data fetching hooks
- **Axios** - HTTP client
- **TanStack Query** - Server state

### **Forms & Validation**
- **react-hook-form** - Form handling
- **Zod** - Schema validation

### **Builder-Specific**
- **@dnd-kit** - Drag and drop
- **@monaco-editor/react** - Code editor

### **Web3**
- **wagmi** - Ethereum hooks
- **viem** - Ethereum client
- **@rainbow-me/rainbowkit** - Wallet UI
- **@alchemy/aa-alchemy** - Account abstraction

---

## 🎨 Styling

### **Tailwind CSS**
- Utility-first CSS framework
- Dark mode support
- Responsive design
- Custom color palette

### **Theme**
```typescript
// Colors
Primary: Blue (600)
Success: Green (600)
Warning: Yellow (600)
Error: Red (600)

// Difficulty Colors
Beginner: Green (🟢)
Intermediate: Yellow (🟡)
Advanced: Red (🔴)
```

---

## 🔐 Environment Variables

Create `.env.local`:

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Alchemy (Account Abstraction)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID=your_policy_id

# Chain IDs
NEXT_PUBLIC_CHAIN_ID=1  # Mainnet or testnet
```

---

## 📚 Documentation

- [Agent Builder Plan](../docs/agent-builder-frontend.plan.md) - Comprehensive implementation plan
- [Agent Builder Progress](../AGENT_BUILDER_PROGRESS.md) - Original progress report
- [API Documentation](../docs/API.md) - Backend API reference
- [Architecture](../docs/ARCHITECTURE.md) - System architecture

---

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
vercel
```

### **Docker**
```bash
docker build -t agentnexus-frontend .
docker run -p 3000:3000 agentnexus-frontend
```

### **Build Output**
```bash
pnpm build
# Output: .next/
```

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### **Module Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### **Type Errors**
```bash
# Check types
pnpm type-check

# Restart TypeScript server in VS Code
Cmd+Shift+P → "Restart TypeScript Server"
```

---

## 📈 Performance

### **Lighthouse Scores (Target)**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### **Optimization**
- Code splitting (Next.js automatic)
- Image optimization (next/image)
- Lazy loading components
- SWR caching
- Memoization (React.memo, useMemo)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

```bash
git checkout -b feature/my-feature
# Make changes
pnpm lint
pnpm type-check
pnpm test
git commit -m "feat: add amazing feature"
git push origin feature/my-feature
```

---

## 📝 License

MIT License - see LICENSE file

---

## 🔗 Links

- [Backend Repository](../backend)
- [Smart Contracts](../smart-contracts)
- [Documentation](../docs)

---

**Built with ❤️ for AgentNexus V1**

