# AgentNexus Frontend

Next.js 14 application with React 19, TypeScript, and Tailwind CSS.

## Quick Start

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

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage (marketplace)
│   │   ├── agents/            # Agent detail pages
│   │   ├── profile/           # User profile
│   │   └── builder/           # Agent Builder
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

## Features

### Marketplace
- Browse and search agents
- Filter by category, price, popularity
- View agent details
- Purchase and execute agents

### Agent Builder
Three ways to create custom agents:

1. **Template Builder** - Select from pre-built templates, configure with forms
2. **Modular Builder** - Drag-and-drop modules, visual workflow composition
3. **Code Editor** - Full TypeScript/JavaScript code editor (Monaco)

### User Profile
- View purchase history
- Track execution history
- Manage custom agents

## API Integration

Set in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Testing

```bash
pnpm test              # Unit tests
pnpm playwright test   # E2E tests
pnpm type-check        # TypeScript validation
pnpm lint              # ESLint
```

## Dependencies

### Core
- Next.js 14 (App Router)
- React 19 + TypeScript
- Tailwind CSS

### Web3
- wagmi + viem
- RainbowKit
- Alchemy Account Abstraction SDK

### Builder
- @dnd-kit (drag and drop)
- @monaco-editor/react (code editor)

## Environment Variables

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Alchemy (Account Abstraction)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID=your_policy_id

# Chain IDs
NEXT_PUBLIC_CHAIN_ID=1
```

## Deployment

### Vercel
```bash
vercel
```

### Docker
```bash
docker build -t agentnexus-frontend .
docker run -p 3000:3000 agentnexus-frontend
```

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Module Not Found
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## License

Apache 2.0
