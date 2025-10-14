# 🏗️ Agent Builder Frontend - Implementation Plan

**Project:** AgentNexus V1  
**Feature:** Build Your Own Agent - Frontend Implementation  
**Created:** October 10, 2025  
**Status:** Ready for Implementation  

---

## 📋 Executive Summary

Comprehensive frontend implementation for the Agent Builder feature, enabling users to create custom AI agents through **three distinct methods**:

1. **🟢 Beginner (Template)** - Pre-configured templates with simple form-based configuration
2. **🟡 Hybrid (Modular)** - Visual drag-and-drop interface for combining modules
3. **🔴 Advanced (Custom Code)** - Full code editor with TypeScript/JavaScript support

**Backend Status:** ✅ Complete (API routes, services, database)  
**Frontend Status:** ⏳ Types & hooks complete, UI components needed  
**Estimated Effort:** 15-20 components, ~2,500 lines of code, 6-8 hours

---

## 🎯 Project Context

### Current State
- ✅ Database schema with AgentTemplate, CustomAgent, AgentModule models
- ✅ 5 pre-built templates seeded (BEGINNER to ADVANCED)
- ✅ 13 reusable modules across 5 categories
- ✅ AgentGeneratorService with pricing, validation, deployment
- ✅ 8 API endpoints (`/api/builder/*`)
- ✅ TypeScript types (`types/builder.ts`)
- ✅ SWR hooks (`hooks/useBuilder.ts`)
- ❌ **UI Components needed**

### Technical Stack
- **Framework:** Next.js 14 with App Router
- **UI Library:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **State:** React hooks + SWR for data fetching
- **Drag & Drop:** @dnd-kit/core
- **Code Editor:** @monaco-editor/react
- **Forms:** react-hook-form + zod validation

---

## 🏗️ Architecture Overview

### Page Structure
```
/builder                          # Landing page (method selection)
/builder/template                 # Method 1: Template builder
/builder/template/[templateId]    # Template configuration
/builder/modular                  # Method 2: Modular builder
/builder/advanced                 # Method 3: Code editor
/builder/preview/[agentId]        # Preview custom agent
/builder/my-agents                # User's custom agents dashboard
```

### Component Hierarchy
```
app/
└── builder/
    ├── page.tsx                  # Method selection landing
    ├── template/
    │   ├── page.tsx              # Template grid
    │   └── [id]/
    │       └── page.tsx          # Configure template
    ├── modular/
    │   └── page.tsx              # Drag-drop builder
    ├── advanced/
    │   └── page.tsx              # Code editor
    ├── my-agents/
    │   └── page.tsx              # Custom agents dashboard
    └── components/               # Builder-specific components
        ├── MethodSelector.tsx
        ├── TemplateCard.tsx
        ├── TemplateGrid.tsx
        ├── ConfigForm.tsx
        ├── ModuleLibrary.tsx
        ├── ModuleCard.tsx
        ├── BuilderCanvas.tsx
        ├── ModuleNode.tsx
        ├── ConnectionLine.tsx
        ├── CodeEditor.tsx
        ├── PreviewPanel.tsx
        ├── PriceCalculator.tsx
        ├── DeployModal.tsx
        └── AgentPreview.tsx
```

---

## 📐 Component Specifications

### 1. Landing Page: Method Selection

**File:** `/app/builder/page.tsx`

**Purpose:** Allow users to choose their preferred building method

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  🤖 Build Your Own AI Agent                              │
│  Choose your creation method based on your skill level   │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  🟢         │  │  🟡         │  │  🔴         │      │
│  │  BEGINNER   │  │  HYBRID     │  │  ADVANCED   │      │
│  │             │  │             │  │             │      │
│  │  Templates  │  │  Modular    │  │  Code       │      │
│  │  ~5 min     │  │  ~10 min    │  │  ~20 min    │      │
│  │             │  │             │  │             │      │
│  │  [Start] →  │  │  [Start] →  │  │  [Start] →  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                           │
│  📊 My Custom Agents (3)          [View All] →           │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- 3 cards for each method with:
  - Icon/color coding
  - Name and description
  - Estimated time
  - Difficulty indicator
  - "Start" button
- Quick link to user's custom agents
- Stats: number of templates/modules available

**Props:** None (top-level page)

**State:** None (navigation only)

---

### 2. Method 1: Template Builder (Beginner)

#### 2.1 Template Grid

**File:** `/app/builder/template/page.tsx`

**Purpose:** Display available templates for selection

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Methods     Templates (5)                     │
│                                                           │
│  Filter: [All ▼] [Difficulty ▼] [Category ▼]            │
│                                                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ 🟢 Beginner │  │ 🟢 Beginner │  │ 🟡 Inter   │         │
│  │            │  │            │  │            │         │
│  │ Price      │  │ Social     │  │ DEX Trading│         │
│  │ Tracker    │  │ Sentiment  │  │ Signals    │         │
│  │            │  │            │  │            │         │
│  │ $1.50      │  │ $2.00      │  │ $4.50      │         │
│  │ Used: 42   │  │ Used: 28   │  │ Used: 15   │         │
│  │ [Select] → │  │ [Select] → │  │ [Select] → │         │
│  └────────────┘  └────────────┘  └────────────┘         │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- Grid of template cards (responsive: 1-3 cols)
- Each card shows:
  - Difficulty badge
  - Template name
  - Short description
  - Base price
  - Usage count
  - "Select" button
- Filters: difficulty, category, search
- Empty state if no templates match

**Data:** `useTemplates()` hook

**Components:**
- `TemplateGrid` - Container
- `TemplateCard` - Individual card
- `TemplateFilters` - Filter controls

#### 2.2 Template Configuration

**File:** `/app/builder/template/[id]/page.tsx`

**Purpose:** Configure selected template with dynamic form

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Templates                                     │
│                                                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │                 │  │  Configure Template          │  │
│  │  Price Tracker  │  │                              │  │
│  │                 │  │  Name:                       │  │
│  │  Track crypto   │  │  [My Price Bot         ]     │  │
│  │  prices and     │  │                              │  │
│  │  send alerts    │  │  Description:                │  │
│  │                 │  │  [Track ETH and BTC...]      │  │
│  │  Features:      │  │                              │  │
│  │  • Price alerts │  │  Symbols (comma-separated):  │  │
│  │  • Multi-token  │  │  [ETH, BTC, SOL        ]     │  │
│  │  • Customizable │  │                              │  │
│  │                 │  │  Alert Threshold (%):        │  │
│  │  Base: $1.50    │  │  [5                    ]     │  │
│  │                 │  │                              │  │
│  └─────────────────┘  │  Alert Method:               │  │
│                       │  ⦿ Discord                   │  │
│                       │  ○ Email                     │  │
│                       │  ○ Telegram                  │  │
│                       │                              │  │
│                       │  [Preview]  [Create Agent →] │  │
│                       └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- Left panel: Template info (read-only)
  - Name, description
  - Feature list
  - Base price
  - Difficulty badge
- Right panel: Dynamic configuration form
  - Generated from `template.configSchema` (JSON Schema)
  - Form fields: text, number, select, checkbox, radio
  - Validation with error messages
  - "Preview" button (shows preview modal)
  - "Create Agent" button (generates and navigates)
- Real-time price calculation

**Data:** 
- `useTemplate(id)` for template details
- `useGenerateAgent()` for creation
- `usePreviewAgent()` for preview

**Components:**
- `TemplateDetail` - Left panel
- `ConfigForm` - Dynamic form renderer
- `PreviewModal` - Preview popup

**Form Handling:**
```typescript
// Using react-hook-form + zod
const schema = useMemo(() => {
  return jsonSchemaToZod(template.configSchema);
}, [template]);

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: template.defaultConfig,
});

const onSubmit = async (data: any) => {
  await generateAgent({
    buildMethod: 'TEMPLATE',
    templateId: template.id,
    templateConfig: data,
    name: data.name,
    description: data.description,
    category: template.category,
  });
};
```

---

### 3. Method 2: Hybrid Modular Builder

**File:** `/app/builder/modular/page.tsx`

**Purpose:** Visual drag-and-drop interface for combining modules

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Methods     Modular Builder                   │
│                                                           │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │ Module       │  │  Canvas                          │ │
│  │ Library      │  │                                  │ │
│  │              │  │  ┌─────────┐                    │ │
│  │ 📡 Data      │  │  │ Twitter │                    │ │
│  │ ├─ Twitter   │  │  │  API    │──────┐             │ │
│  │ ├─ DEX Data  │  │  └─────────┘      │             │ │
│  │ ├─ Price     │  │                   ▼             │ │
│  │ └─ On-Chain  │  │              ┌─────────┐        │ │
│  │              │  │              │Sentiment│        │ │
│  │ 📊 Analysis  │  │              │Analysis │─────┐  │ │
│  │ ├─ Sentiment │  │              └─────────┘     │  │ │
│  │ ├─ Technical │  │                             ▼  │ │
│  │ └─ Volume    │  │                        ┌────────┐│
│  │              │  │                        │ Alert  ││
│  │ ⏰ Triggers  │  │                        │Action  ││
│  │ ├─ Price     │  │                        └────────┘│
│  │ ├─ Time      │  │                                  │ │
│  │ └─ Event     │  │  [Add Module]  Est: $4.20       │ │
│  │              │  └──────────────────────────────────┘ │
│  │ 🎯 Actions   │  │                                    │
│  │ ├─ Alert     │  │  ┌──────────────────────────────┐ │
│  │ ├─ Report    │  │  │ Module Configuration         │ │
│  │ └─ Trade     │  │  │                              │ │
│  │              │  │  │ Twitter API Module           │ │
│  │ 🔧 Utility   │  │  │                              │ │
│  │ └─ Formatter │  │  │ Keywords: [crypto, web3]     │ │
│  │              │  │  │ Limit: [100            ]     │ │
│  └──────────────┘  │  │                              │ │
│                    │  │ [Save]  [Remove]             │ │
│                    │  └──────────────────────────────┘ │
│                                                         │
│  [Clear]  [Preview]  [Create Agent →]                  │
└──────────────────────────────────────────────────────────┘
```

**Features:**

**Module Library (Left Sidebar):**
- Categorized list of all modules
- Drag-and-drop to canvas
- Search/filter modules
- Show module cost and difficulty
- Collapsed/expanded categories

**Builder Canvas (Center):**
- Drop zone for modules
- Visual nodes for each added module
- Connection lines showing data flow
- Click node to configure
- Remove module button
- Auto-layout or manual positioning
- Zoom/pan controls
- Validation warnings (missing dependencies)

**Configuration Panel (Right/Bottom):**
- Appears when module selected
- Dynamic form based on `module.configSchema`
- Shows module dependencies
- Save/cancel buttons

**Bottom Bar:**
- Module count
- Total estimated price
- "Clear All" button
- "Preview" button
- "Create Agent" primary button

**Technical Implementation:**

Using `@dnd-kit/core` for drag-and-drop:

```typescript
'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useModules } from '@/hooks/useBuilder';

export default function ModularBuilderPage() {
  const { modules } = useModules();
  const [selectedModules, setSelectedModules] = useState<AgentModule[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, any>>({});

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === 'canvas') {
      const module = modules.find(m => m.id === active.id);
      if (module) {
        setSelectedModules(prev => [...prev, module]);
      }
    }
  };

  const estimatedPrice = useMemo(() => {
    return calculateModularPrice(selectedModules);
  }, [selectedModules]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen">
        <ModuleLibrary modules={modules} />
        <BuilderCanvas 
          modules={selectedModules}
          onSelectNode={setSelectedNode}
          onRemoveModule={removeModule}
        />
        {selectedNode && (
          <ConfigPanel
            module={selectedModules.find(m => m.id === selectedNode)!}
            config={configs[selectedNode]}
            onSave={(cfg) => setConfigs(prev => ({ ...prev, [selectedNode]: cfg }))}
          />
        )}
      </div>
      <BottomBar price={estimatedPrice} onPreview={...} onCreate={...} />
    </DndContext>
  );
}
```

**Data:**
- `useModules()` for all modules
- `useGenerateAgent()` for creation
- Local state for canvas layout

**Components:**
- `ModuleLibrary` - Sidebar with draggable modules
- `ModuleCard` - Draggable module item
- `BuilderCanvas` - Drop zone with visual nodes
- `ModuleNode` - Visual representation of module
- `ConnectionLine` - SVG lines between modules
- `ConfigPanel` - Right panel for configuration
- `BottomBar` - Actions and price

---

### 4. Method 3: Advanced Code Editor

**File:** `/app/builder/advanced/page.tsx`

**Purpose:** Full code editor for custom agent development

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Methods     Advanced Builder                  │
│                                                           │
│  [Template: None ▼]  [Language: TypeScript ▼]           │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │  1  import { Agent } from '@agentnexus/runtime';    ││
│  │  2                                                   ││
│  │  3  export class MyCustomAgent extends Agent {      ││
│  │  4    async execute(input: any) {                   ││
│  │  5      // Your custom logic here                   ││
│  │  6      return { result: "Hello World" };           ││
│  │  7    }                                              ││
│  │  8  }                                                ││
│  │  9                                                   ││
│  │ 10  export const config = {                         ││
│  │ 11    name: "My Custom Agent",                      ││
│  │ 12    description: "Does cool things",              ││
│  │ 13    category: "GENERAL",                          ││
│  │ 14  };                                               ││
│  │ ~                                                    ││
│  └──────────────────────────────────────────────────────┘│
│                                                           │
│  ✅ No errors  |  ⚠️ 2 warnings  |  Lines: 14            │
│                                                           │
│  ┌────────────┐  ┌────────────────────────────────────┐ │
│  │ Snippets   │  │ Console Output                     │ │
│  │            │  │                                    │ │
│  │ • Agent    │  │ > Validating code...               │ │
│  │ • API Call │  │ ✅ Syntax valid                    │ │
│  │ • Webhook  │  │ ⚠️ Missing error handling          │ │
│  │ • Cron Job │  │                                    │ │
│  └────────────┘  └────────────────────────────────────┘ │
│                                                           │
│  [Validate]  [Test Run]  [Create Agent →]                │
└──────────────────────────────────────────────────────────┘
```

**Features:**

**Code Editor:**
- Monaco Editor (VS Code engine)
- Syntax highlighting (TypeScript/JavaScript)
- Auto-completion
- Error/warning squiggles
- Line numbers
- Minimap
- Theme: dark/light

**Top Bar:**
- Template selector (optional starting point)
- Language selector (TypeScript/JavaScript)
- File name input

**Bottom Left - Snippets:**
- Common code snippets
- Click to insert
- Categories: agent templates, API calls, webhooks, etc.

**Bottom Right - Console:**
- Real-time validation output
- Test run results
- Errors/warnings list

**Bottom Actions:**
- "Validate" - Check code syntax
- "Test Run" - Execute in sandbox
- "Create Agent" - Generate Docker image

**Technical Implementation:**

Using `@monaco-editor/react`:

```typescript
'use client';

import Editor from '@monaco-editor/react';
import { useState } from 'react';

const DEFAULT_CODE = `import { Agent } from '@agentnexus/runtime';

export class MyCustomAgent extends Agent {
  async execute(input: any) {
    // Your custom logic here
    return { result: "Hello World" };
  }
}

export const config = {
  name: "My Custom Agent",
  description: "Does cool things",
  category: "GENERAL",
};`;

export default function AdvancedBuilderPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      // Call backend validation endpoint
      const result = await fetch('/api/builder/validate', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      const { errors, warnings } = await result.json();
      setErrors(errors);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreate = async () => {
    await generateAgent({
      buildMethod: 'CUSTOM',
      customCode: code,
      name: extractNameFromCode(code),
      description: extractDescriptionFromCode(code),
      category: extractCategoryFromCode(code),
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <Editor
        height="60%"
        defaultLanguage="typescript"
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
        }}
      />
      <StatusBar errors={errors} />
      <div className="flex">
        <SnippetsPanel onInsert={(snippet) => setCode(code + snippet)} />
        <ConsoleOutput errors={errors} />
      </div>
      <Actions onValidate={handleValidate} onCreate={handleCreate} />
    </div>
  );
}
```

**Data:**
- Local state for code
- `useGenerateAgent()` for creation
- Backend validation endpoint

**Components:**
- `CodeEditor` - Monaco wrapper
- `SnippetsPanel` - Code snippets
- `ConsoleOutput` - Validation output
- `StatusBar` - Error count, line count
- `Actions` - Bottom buttons

---

### 5. Shared Components

These components are used across multiple builder methods:

#### 5.1 Preview Panel

**File:** `/app/builder/components/PreviewPanel.tsx`

**Purpose:** Show preview of agent before creation

**Props:**
```typescript
interface PreviewPanelProps {
  agent: {
    name: string;
    description: string;
    category: AgentCategory;
    price: number;
    inputSchema: any;
    outputSchema: any;
  };
  onClose: () => void;
  onConfirm: () => void;
}
```

**Features:**
- Modal overlay
- Agent name, description
- Category badge
- Estimated price
- Input/output schema preview (collapsible)
- "Back" and "Confirm & Create" buttons

#### 5.2 Price Calculator

**File:** `/app/builder/components/PriceCalculator.tsx`

**Purpose:** Real-time price display with breakdown

**Props:**
```typescript
interface PriceCalculatorProps {
  buildMethod: BuildMethod;
  basePrice: number;
  modules?: AgentModule[];
  complexity?: number;
}
```

**Features:**
- Base price
- Module costs (for Hybrid)
- Complexity multiplier
- Total price (large, highlighted)
- Breakdown tooltip on hover

**UI:**
```
┌─────────────────┐
│ Estimated Price │
│                 │
│     $4.20       │
│                 │
│ 💡 Breakdown:   │
│ Base: $2.00     │
│ Modules: $2.00  │
│ Multiplier: 1.1x│
└─────────────────┘
```

#### 5.3 Deploy Modal

**File:** `/app/builder/components/DeployModal.tsx`

**Purpose:** Deploy custom agent to marketplace

**Props:**
```typescript
interface DeployModalProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features:**
- Confirmation dialog
- Terms of service checkbox
- "Deploy" button (connects wallet)
- Progress indicator during deployment
- Success/error states

**Flow:**
1. User clicks "Deploy"
2. Modal shows: "Deploy [Agent Name] to Marketplace?"
3. User confirms
4. Triggers smart contract registration
5. Shows success → redirects to agent page

#### 5.4 Agent Preview Card

**File:** `/app/builder/components/AgentPreview.tsx`

**Purpose:** Preview card for custom agents

**Props:**
```typescript
interface AgentPreviewProps {
  agent: CustomAgent;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeploy?: () => void;
}
```

**Features:**
- Agent name, description
- Build method badge
- Deployed status
- Creation date
- Actions: Edit, Delete, Deploy (if not deployed)

---

### 6. My Custom Agents Dashboard

**File:** `/app/builder/my-agents/page.tsx`

**Purpose:** View and manage user's custom agents

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Builder     My Custom Agents                  │
│                                                           │
│  [All ▼] [Deployed ▼] [Build Method ▼]    Search: [   ] │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🟢 My Price Bot                        [Edit] [×]  │  │
│  │ Template-based • Created Oct 10, 2025              │  │
│  │ ✅ Deployed • Price: $1.50                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🟡 Custom Sentiment Analyzer           [Edit] [×]  │  │
│  │ Hybrid-based • Created Oct 9, 2025                 │  │
│  │ ⏳ Draft • Price: $4.20          [Deploy →]        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔴 Advanced Trading Bot                [Edit] [×]  │  │
│  │ Custom code • Created Oct 8, 2025                  │  │
│  │ ✅ Deployed • Price: $10.00                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  [Create New Agent]                                      │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- List of user's custom agents
- Filter by: status, build method, date
- Search by name
- Each card shows:
  - Name
  - Build method
  - Creation date
  - Deployed status
  - Price
  - Edit button (navigates to builder)
  - Delete button (confirmation)
  - Deploy button (if draft)
- "Create New Agent" button → builder landing

**Data:** `useMyCustomAgents(userId)`

---

## 🔄 User Flows

### Flow 1: Beginner (Template) - 5 Minutes

```
1. Click "Start" on BEGINNER card
   ↓
2. View template grid, browse options
   ↓
3. Click "Select" on "Price Tracker"
   ↓
4. Fill configuration form:
   - Name: "My ETH Alert Bot"
   - Symbols: "ETH, BTC"
   - Threshold: 5%
   - Alert: Discord
   ↓
5. Click "Preview" → see agent preview modal
   ↓
6. Click "Create Agent" → agent generated
   ↓
7. Success! Redirect to agent detail page
   ↓
8. Optional: Click "Deploy to Marketplace"
```

### Flow 2: Hybrid (Modular) - 10 Minutes

```
1. Click "Start" on HYBRID card
   ↓
2. Drag "Twitter API" module to canvas
   ↓
3. Click module → configure (keywords, limit)
   ↓
4. Drag "Sentiment Analysis" module
   ↓
5. System auto-connects modules (data flow)
   ↓
6. Drag "Alert Action" module
   ↓
7. Configure alert settings
   ↓
8. See price update: $4.20
   ↓
9. Click "Preview" → validate configuration
   ↓
10. Click "Create Agent" → agent generated
    ↓
11. Success! Redirect to agent detail
```

### Flow 3: Advanced (Custom Code) - 20 Minutes

```
1. Click "Start" on ADVANCED card
   ↓
2. Select base template (optional) or start blank
   ↓
3. Write custom TypeScript code:
   - Import libraries
   - Define agent class
   - Implement execute() method
   - Export config
   ↓
4. Click "Validate" → check syntax
   ↓
5. Fix any errors/warnings
   ↓
6. Click "Test Run" → sandbox execution
   ↓
7. Review console output
   ↓
8. Click "Create Agent" → build Docker image
   ↓
9. Success! Redirect to agent detail
```

---

## 🎨 Design System

### Color Coding

```typescript
const METHOD_COLORS = {
  TEMPLATE: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: '🟢',
  },
  HYBRID: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    icon: '🟡',
  },
  CUSTOM: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    icon: '🔴',
  },
};

const DIFFICULTY_COLORS = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
  ADVANCED: 'bg-orange-100 text-orange-800',
  EXPERT: 'bg-red-100 text-red-800',
};
```

### Typography

- Headings: `font-bold text-2xl` (page titles)
- Subheadings: `font-semibold text-lg` (section headers)
- Body: `text-base` (descriptions)
- Captions: `text-sm text-gray-600` (metadata)
- Buttons: `font-medium` (primary actions)

### Spacing

- Page padding: `p-6`
- Card spacing: `space-y-4`
- Form fields: `space-y-3`
- Button groups: `space-x-2`

### Shadows & Borders

- Cards: `rounded-lg border shadow-sm hover:shadow-md`
- Modals: `rounded-xl shadow-2xl`
- Buttons: `rounded-md`
- Inputs: `rounded-md border-gray-300`

---

## 🔌 API Integration

### Endpoints Used

```typescript
// From backend/src/routes/builder.ts

GET    /api/builder/templates          → useTemplates()
GET    /api/builder/templates/:id      → useTemplate(id)
GET    /api/builder/modules             → useModules()
POST   /api/builder/generate            → useGenerateAgent()
POST   /api/builder/preview             → usePreviewAgent()
GET    /api/builder/my-agents/:userId   → useMyCustomAgents(userId)
PATCH  /api/builder/agents/:id          → useUpdateAgent()
POST   /api/builder/agents/:id/deploy   → useDeployAgent()
```

### Request/Response Examples

#### Generate Agent (Template)

```typescript
// Request
POST /api/builder/generate
{
  "buildMethod": "TEMPLATE",
  "templateId": "template_price_tracker",
  "templateConfig": {
    "name": "My ETH Bot",
    "symbols": ["ETH", "BTC"],
    "threshold": 5,
    "alertMethod": "discord"
  },
  "name": "My ETH Bot",
  "description": "Tracks ETH and BTC prices",
  "category": "CRYPTO"
}

// Response
{
  "success": true,
  "customAgentId": "agent_123",
  "agentId": "agent_456",
  "estimatedPrice": 1.50,
  "message": "Agent created successfully"
}
```

#### Generate Agent (Hybrid)

```typescript
// Request
POST /api/builder/generate
{
  "buildMethod": "HYBRID",
  "moduleIds": [
    "module_twitter_api",
    "module_sentiment_analysis",
    "module_alert_action"
  ],
  "moduleConfigs": {
    "module_twitter_api": {
      "keywords": ["crypto", "web3"],
      "limit": 100
    },
    "module_sentiment_analysis": {
      "sentiment": "positive"
    },
    "module_alert_action": {
      "channel": "discord"
    }
  },
  "name": "Sentiment Bot",
  "description": "Monitors crypto sentiment",
  "category": "SOCIAL"
}

// Response
{
  "success": true,
  "customAgentId": "agent_789",
  "agentId": "agent_012",
  "estimatedPrice": 4.20
}
```

---

## 📦 Dependencies

### New Packages Needed

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.0.8",
    "@dnd-kit/sortable": "^7.0.2",
    "@dnd-kit/utilities": "^3.2.1",
    "@monaco-editor/react": "^4.6.0",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "json-schema-to-zod": "^2.0.0"
  },
  "devDependencies": {
    "@types/react-beautiful-dnd": "^13.1.6"
  }
}
```

### Already Available

- Next.js 14
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui components
- SWR (data fetching)
- wagmi (wallet connection)

---

## ✅ Implementation Checklist

### Phase 1: Foundation (1-2 hours)

- [ ] Install new dependencies (`@dnd-kit`, `@monaco-editor/react`, `react-hook-form`, `zod`)
- [ ] Create folder structure: `/app/builder/*`
- [ ] Create shared types (if needed beyond `types/builder.ts`)
- [ ] Set up API client functions in `lib/api.ts`

### Phase 2: Landing Page (30 min)

- [ ] Create `/app/builder/page.tsx`
- [ ] Build `MethodSelector` component
- [ ] Add navigation to each method
- [ ] Style with Tailwind + shadcn/ui

### Phase 3: Template Builder (1.5 hours)

- [ ] Create `/app/builder/template/page.tsx`
- [ ] Build `TemplateGrid` component
- [ ] Build `TemplateCard` component
- [ ] Add filters (difficulty, category, search)
- [ ] Create `/app/builder/template/[id]/page.tsx`
- [ ] Build `TemplateDetail` component
- [ ] Build `ConfigForm` component (dynamic form from JSON Schema)
- [ ] Integrate `useGenerateAgent()` hook
- [ ] Add success/error handling

### Phase 4: Modular Builder (2 hours)

- [ ] Create `/app/builder/modular/page.tsx`
- [ ] Set up `DndContext` from `@dnd-kit/core`
- [ ] Build `ModuleLibrary` component (sidebar)
- [ ] Build `ModuleCard` component (draggable)
- [ ] Build `BuilderCanvas` component (drop zone)
- [ ] Build `ModuleNode` component (visual nodes)
- [ ] Build `ConnectionLine` component (SVG connections)
- [ ] Build `ConfigPanel` component (right panel)
- [ ] Implement module selection/configuration state
- [ ] Add drag-and-drop logic
- [ ] Integrate price calculation
- [ ] Add validation (dependencies, missing configs)

### Phase 5: Code Editor (1 hour)

- [ ] Create `/app/builder/advanced/page.tsx`
- [ ] Integrate Monaco Editor (`@monaco-editor/react`)
- [ ] Set up default code template
- [ ] Build `SnippetsPanel` component
- [ ] Build `ConsoleOutput` component
- [ ] Build `StatusBar` component
- [ ] Add "Validate" functionality (backend endpoint)
- [ ] Add "Test Run" functionality (optional for MVP)
- [ ] Integrate `useGenerateAgent()` hook

### Phase 6: Shared Components (1 hour)

- [ ] Build `PreviewPanel` component (modal)
- [ ] Build `PriceCalculator` component
- [ ] Build `DeployModal` component
- [ ] Build `AgentPreview` card component
- [ ] Integrate wallet connection for deployment

### Phase 7: My Agents Dashboard (30 min)

- [ ] Create `/app/builder/my-agents/page.tsx`
- [ ] Fetch user's custom agents
- [ ] Build agent list view
- [ ] Add filters (status, method, date)
- [ ] Add search functionality
- [ ] Implement Edit button (navigate to builder)
- [ ] Implement Delete button (confirmation + API call)
- [ ] Implement Deploy button (for drafts)

### Phase 8: Integration & Testing (1 hour)

- [ ] Test all three builder methods end-to-end
- [ ] Test API integration (create, preview, deploy)
- [ ] Test form validation
- [ ] Test drag-and-drop functionality
- [ ] Test Monaco editor
- [ ] Fix responsive design issues
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test wallet connection for deployment

### Phase 9: Polish & Optimization (30 min)

- [ ] Add animations/transitions
- [ ] Optimize performance (memo, lazy loading)
- [ ] Add tooltips/help text
- [ ] Ensure accessibility (ARIA labels, keyboard nav)
- [ ] Final responsive checks
- [ ] Code cleanup and comments

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Test ConfigForm dynamic rendering
describe('ConfigForm', () => {
  it('renders fields from JSON Schema', () => {
    const schema = {
      properties: {
        name: { type: 'string' },
        threshold: { type: 'number' },
      },
    };
    render(<ConfigForm schema={schema} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Threshold')).toBeInTheDocument();
  });
});

// Test price calculation
describe('calculateModularPrice', () => {
  it('calculates price with complexity multiplier', () => {
    const modules = [
      { baseCost: 1, executionCost: 0.5 },
      { baseCost: 2, executionCost: 1 },
    ];
    const price = calculateModularPrice(modules);
    expect(price).toBeCloseTo(4.5 * 1.0); // 5 modules < 5, no multiplier
  });
});
```

### Integration Tests

```typescript
// Test full template builder flow
describe('Template Builder Flow', () => {
  it('creates agent from template', async () => {
    // 1. Navigate to template page
    render(<TemplateBuilderPage />);
    await waitFor(() => screen.getByText('Price Tracker'));
    
    // 2. Select template
    fireEvent.click(screen.getByText('Select'));
    
    // 3. Fill configuration
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'My Bot' }
    });
    
    // 4. Submit
    fireEvent.click(screen.getByText('Create Agent'));
    
    // 5. Verify API call
    await waitFor(() => {
      expect(mockGenerateAgent).toHaveBeenCalledWith({
        buildMethod: 'TEMPLATE',
        templateId: expect.any(String),
        // ...
      });
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/builder.spec.ts
test('complete beginner builder flow', async ({ page }) => {
  await page.goto('/builder');
  await page.click('text=BEGINNER');
  await page.click('text=Price Tracker');
  await page.fill('[name="name"]', 'My ETH Bot');
  await page.click('text=Create Agent');
  await expect(page).toHaveURL(/\/agents\/agent_/);
});
```

---

## 🚀 Deployment Checklist

Before merging to main:

- [ ] All components implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse score > 90)
- [ ] API endpoints tested
- [ ] Wallet integration tested
- [ ] Documentation updated
- [ ] Changelog updated

---

## 📊 Success Metrics

Post-launch metrics to track:

- **Adoption:** % of users trying each builder method
- **Completion Rate:** % who finish creating an agent
- **Time to Complete:** Average time per method
- **Deployment Rate:** % of created agents deployed
- **Error Rate:** Failed generations / total attempts
- **User Feedback:** NPS score, feature requests

**Target Goals:**
- 70%+ completion rate for Template builder
- 50%+ completion rate for Hybrid builder
- 30%+ completion rate for Advanced builder
- <5 min average for Template method
- <10 min average for Hybrid method

---

## 🔮 Future Enhancements (V2)

- **AI-Assisted Building:** Chatbot to recommend modules/templates
- **Version Control:** Save/restore agent versions
- **Collaboration:** Share drafts with team members
- **Templates Marketplace:** User-submitted templates
- **Advanced Canvas:** More complex workflows (loops, conditionals)
- **Testing Playground:** Sandbox environment for testing agents
- **Analytics Dashboard:** Usage stats for deployed agents
- **Multi-Language Support:** Python, Go agent templates
- **Import/Export:** JSON/YAML configuration files

---

## 📚 References

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [@dnd-kit Documentation](https://docs.dndkit.com)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [React Hook Form](https://react-hook-form.com)
- [Zod Schema Validation](https://zod.dev)

### Backend References
- `backend/src/routes/builder.ts` - API endpoints
- `backend/src/services/AgentGeneratorService.ts` - Business logic
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/seed-templates.ts` - Template data

### Frontend References
- `frontend/src/types/builder.ts` - TypeScript types
- `frontend/src/hooks/useBuilder.ts` - Data fetching hooks
- `frontend/src/lib/api.ts` - API client

---

## ✨ Final Notes

This is a **comprehensive, production-ready** plan for the Agent Builder frontend. The three-method approach provides:

1. **Accessibility:** Beginner users can create agents without code
2. **Flexibility:** Intermediate users can combine modules visually
3. **Power:** Advanced users have full control with code

The modular component design ensures:
- **Reusability:** Shared components across all methods
- **Maintainability:** Clear separation of concerns
- **Testability:** Easy to unit/integration test
- **Scalability:** Easy to add new templates/modules

**Estimated Total Effort:** 6-8 hours for experienced developer  
**Files Created:** ~20 components, 3 pages  
**Lines of Code:** ~2,500 TypeScript/TSX

---

**Ready to implement!** 🚀

Built for AgentNexus V1  
Created: October 10, 2025

