# Travel Assistant - Architecture Design Document

> This document describes the technical architecture, directory structure, data flow, and core module design.

---

## Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                      │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │   │
│  │  │ Chat UI   │  │ Message   │  │ Input Component   │   │   │
│  │  │ (page.tsx)│  │ List      │  │ (ChatInput)       │   │   │
│  │  └───────────┘  └───────────┘  └───────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         │ Supabase Client              │ HTTP POST /api/chat
         ▼                              ▼
┌─────────────────────┐   ┌─────────────────────────────────────┐
│   Supabase          │   │       Next.js API Routes             │
│  ┌───────────────┐  │   │  ┌─────────────────────────────┐   │
│  │ Auth          │  │   │  │     /api/chat/route.ts      │   │
│  │ (User Auth)   │  │   │  │  Prompt → LangChain → AI    │   │
│  ├───────────────┤  │   │  └─────────────────────────────┘   │
│  │ PostgreSQL    │  │   └─────────────────────────────────────┘
│  │ (Sessions/Msg)│  │                     │
│  │ + RLS         │  │                     │ LangChain.js
│  └───────────────┘  │                     ▼
└─────────────────────┘   ┌─────────────────────────────────────┐
                          │         DashScope AI API             │
                          │           (Qwen Model)               │
                          └─────────────────────────────────────┘
```

---

## Directory Structure

```
travel-assistant/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (with AuthProvider)
│   ├── page.tsx                # Home page (chat interface)
│   ├── globals.css             # Global styles
│   ├── auth/                   # Auth pages (Phase 4)
│   │   ├── login/page.tsx      # Login page
│   │   └── signup/page.tsx     # Signup page
│   └── api/                    # API routes
│       └── chat/
│           └── route.ts        # Chat API endpoint
├── middleware.ts               # Auth middleware (Phase 4)
├── supabase/                   # Database migrations (Phase 4)
│   └── migrations/             # SQL migration scripts
│
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components (auto-generated)
│   ├── auth/                   # Auth components (Phase 4)
│   │   ├── AuthProvider.tsx    # Auth context
│   │   └── UserMenu.tsx        # User menu
│   ├── chat/                   # Chat components
│   │   ├── ChatLayout.tsx      # Chat layout
│   │   ├── ChatArea.tsx        # Chat area
│   │   ├── Sidebar.tsx         # Sidebar (with session list)
│   │   ├── MessageList.tsx     # Message list
│   │   └── ChatInput.tsx       # Input component
│
├── lib/                        # Core logic
│   ├── langchain/              # LangChain related
│   │   ├── model.ts            # Model configuration
│   │   ├── prompts.ts          # Prompt templates
│   │   ├── agent.ts            # ReAct Agent (Phase 3)
│   │   ├── chain.ts            # Chain calls (Phase 2+)
│   │   ├── tools/              # Local tools (Phase 3)
│   │   ├── mcp-client.ts       # MCP client (Phase 3)
│   │   └── rag/                # RAG module (Phase 5)
│   │       ├── embeddings.ts   # Embedding configuration
│   │       ├── loader.ts       # JSONL loader
│   │       ├── splitter.ts     # Document splitter
│   │       ├── store.ts        # Vector store
│   │       ├── retriever.ts    # Retriever
│   │       └── index.ts        # Unified export
│   ├── supabase/               # Supabase configuration (Phase 4)
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   └── utils.ts                # Utility functions
│
├── store/                      # Zustand state management
│   ├── chat-store.ts           # Chat state Store
│   ├── session-store.ts        # Session state Store (Phase 4)
│   └── index.ts                # Unified export
│
├── types/                      # TypeScript type definitions
│   └── index.ts                # Message, request, response types
│
├── .env.local                  # Environment variables (local)
├── .env.example                # Environment variables example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── components.json             # shadcn/ui configuration
│
├── .husky/                     # Git hooks
│   ├── pre-commit              # Pre-commit check
│   └── commit-msg              # Commit message check (optional)
│
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── .lintstagedrc               # lint-staged configuration
│
├── __tests__/                  # Test files
│   ├── lib/                    # Utility function tests
│   └── components/             # Component tests
│
├── openspec/                   # OpenSpec specification-driven development
│   ├── project.md              # Project context
│   ├── specs/                  # Current specs
│   │   └── chat-api.md         # Chat API spec
│   └── changes/                # Change proposals
│
├── vitest.config.ts            # Vitest configuration
│
├── ROADMAP.md                  # Development roadmap
├── ARCHITECTURE.md             # This document
├── SPEC.md                     # Project specifications
├── CLAUDE.md                   # AI collaboration guide
│
└── .cursor/
    ├── rules/
    │   └── project.mdc         # Project rules
    └── skills/
        └── ui-ux-pro-max/      # UI/UX design intelligence (via CLI)
```

---

## Core Module Design

### 1. Frontend Component Hierarchy

```
page.tsx (Home)
└── ChatInterface
    ├── MessageList
    │   └── MessageItem (loop render)
    │       ├── User message style
    │       └── AI message style
    └── ChatInput
        ├── Textarea / Input
        └── Send Button
```

**Component Responsibilities:**

| Component       | Responsibility                         | State Management      |
| --------------- | -------------------------------------- | --------------------- |
| `ChatInterface` | Chat interface container, manage state | messages, isLoading   |
| `MessageList`   | Display message list, auto-scroll      | None (receives props) |
| `MessageItem`   | Single message rendering               | None (pure display)   |
| `ChatInput`     | User input, send message               | input value           |

### 2. API Layer Design

**Endpoint:** `POST /api/chat`

**Request Body:**

```typescript
interface ChatRequest {
  messages: Message[]; // Conversation history
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

**Response Body (Phase 1):**

```typescript
interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
}
```

**Response Body (Phase 2 - Streaming):**

```
Server-Sent Events (SSE)
data: {"content": "Hello"}
data: {"content": " there"}
data: {"content": "!"}
...
data: [DONE]
```

### 3. LangChain Modules

**model.ts - Model Configuration**

```
Responsibility: Initialize AI model
Export: Configured ChatOpenAI instance
```

**prompts.ts - Prompt Management**

```
Responsibility: Define and manage System Prompt
Export: Travel assistant role definition
```

**chain.ts - Chain Calls (later phases)**

```
Responsibility: Combine Prompt + Model + Parser
Export: Callable Chain
```

---

## Data Flow

### Phase 1: Basic Conversation Flow

```
1. User inputs message
   │
   ▼
2. ChatInput triggers onSubmit
   │
   ▼
3. ChatInterface updates messages state
   │  Add user message to array
   │
   ▼
4. Call /api/chat
   │  Request body: { messages: [...] }
   │
   ▼
5. API Route processing
   │  a. Construct full Prompt (System + History + User)
   │  b. Call ChatOpenAI.invoke()
   │  c. Return AI response
   │
   ▼
6. Frontend receives response
   │  Update messages state
   │  Add AI message to array
   │
   ▼
7. MessageList re-renders
```

### Phase 2: Streaming Conversation Flow

```
1-4. Same as above
   │
   ▼
5. API Route processing
   │  a. Construct Prompt
   │  b. Call ChatOpenAI.stream()
   │  c. Return SSE stream
   │
   ▼
6. Frontend streaming reception
   │  Update AI message content per chunk
   │
   ▼
7. MessageList real-time update
```

---

## State Management

Using **Zustand** for state management, preparing for complex state in Agent phase.

### Store Design

```typescript
// store/chat-store.ts

interface ChatState {
  // Message related
  messages: Message[];

  // Loading state
  isLoading: boolean;

  // Error handling
  error: string | null;

  // Agent phase extensions (reserved)
  currentTool: string | null; // Currently executing tool
  toolStatus: ToolStatus | null; // Tool execution status

  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}
```

### Why Zustand

| Feature     | Description                    |
| ----------- | ------------------------------ |
| Lightweight | Only ~1KB, no boilerplate      |
| Simple      | No Provider wrapper needed     |
| TypeScript  | Native support, good inference |
| Debugging   | Redux DevTools support         |
| Scalable    | Suitable for simple to complex |

---

## Database Architecture (Phase 4)

Using **Supabase PostgreSQL** to store user sessions and messages.

### Data Tables

```sql
-- Sessions table
sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Messages table
messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  tool_calls JSONB,  -- Tool call records
  created_at TIMESTAMPTZ
)
```

### Row Level Security

```sql
-- Users can only access their own sessions and messages
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in own sessions" ON messages
  FOR ALL USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
```

---

## RAG Knowledge Enhancement Module (Phase 5)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Knowledge Import Flow                         │
│  ┌───────────────┐    ┌───────────┐    ┌───────────┐    ┌────────┐ │
│  │ knowledge.jsonl│ → │ Loader    │ → │ Splitter  │ → │Embedding│ │
│  │ (701 items)   │    │ (parse)   │    │ (chunk)   │    │ (vector)│ │
│  └───────────────┘    └───────────┘    └───────────┘    └────────┘ │
│                                                              │      │
│                                                              ▼      │
│                                              ┌─────────────────────┐│
│                                              │  Supabase pgvector  ││
│                                              │  knowledge_documents││
│                                              └─────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Query Retrieval Flow                          │
│  ┌───────────┐    ┌───────────┐    ┌────────────────┐              │
│  │ User Query │ → │ Embedding │ → │ Similarity      │              │
│  │ "Sanya fun"│    │ (vectorize)│   │ Search (Top-K) │              │
│  └───────────┘    └───────────┘    └────────────────┘              │
│                                              │                      │
│                                              ▼                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                   RAG Enhanced Agent                           ││
│  │  System Prompt + Retrieved Context + User Query → LLM → Answer ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Retrieval Strategy

| Parameter | Value    | Description                        |
| --------- | -------- | ---------------------------------- |
| Top-K     | 3        | Return top 3 most relevant results |
| Threshold | 0.65     | Filter out results below threshold |
| By City   | Optional | Auto-extract city from query       |

---

## Environment Variables

```bash
# .env.local

# LLM Configuration (Alibaba Cloud DashScope)
DASHSCOPE_API_KEY=your_dashscope_api_key
LLM_MODEL=qwen-plus
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# MCP Tools API Key (Phase 3)
AMAP_API_KEY=your_amap_api_key
VARIFLIGHT_API_KEY=your_variflight_api_key

# Supabase Configuration (Phase 4)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Error Handling Strategy

| Error Type       | Handling                                  |
| ---------------- | ----------------------------------------- |
| Invalid API Key  | Return 401, frontend shows config tip     |
| Network Timeout  | Return 504, frontend prompts retry        |
| Model Rate Limit | Return 429, frontend shows try later      |
| Input Too Long   | Frontend + API validation, prompt shorten |

---

## Security Considerations

1. **API Key Protection**
   - Only exists on server (`.env.local`)
   - Not exposed to frontend
   - Not committed to Git (in `.gitignore`)

2. **Input Validation**
   - Limit message length
   - Filter sensitive content (optional)

3. **Rate Limiting** (later)
   - Per-user request frequency limit
   - Prevent abuse

---

## Testing Strategy

### Test Framework

| Tool                  | Purpose           |
| --------------------- | ----------------- |
| Vitest                | Unit test runner  |
| React Testing Library | Component testing |
| MSW                   | API Mock          |

### Test Commands

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
Trigger: PR to main branch
Steps: 1. Install dependencies
  2. ESLint check
  3. TypeScript type check
  4. Run tests
```

### Vercel Deployment

- Auto deploy main branch
- PR preview deployment
- Environment variables via Vercel Dashboard

---

## Extension Points

Reserved extensions for later phases:

| Phase   | Extension    | Location               | Status      |
| ------- | ------------ | ---------------------- | ----------- |
| Phase 2 | Streaming    | `/api/chat/route.ts`   | ✅ Complete |
| Phase 3 | Tool Calling | `lib/langchain/tools/` | ✅ Complete |
| Phase 4 | Database     | `lib/supabase/`        | ✅ Complete |
| Phase 5 | RAG          | `lib/langchain/rag/`   | ✅ Complete |

---

_Last updated: 2026-01-27 (Phase 5 RAG Knowledge Enhancement completed)_
