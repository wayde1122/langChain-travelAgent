# Travel Assistant - Development Roadmap

> An AI travel assistant built with LangChain.js + Next.js, learning LLM application development through progressive iterations.

---

## Project Vision

Build a **professional travel assistant** that can:

- Answer travel-related questions
- Provide itinerary planning suggestions
- Query real-time information (weather, exchange rates, etc.)
- Give personalized recommendations

---

## Tech Stack

| Category         | Option                   | Status                 |
| ---------------- | ------------------------ | ---------------------- |
| Framework        | Next.js 14+ (App Router) | ✅ Decided             |
| AI Framework     | LangChain.js             | ✅ Decided             |
| Styling          | Tailwind CSS + shadcn/ui | ✅ Decided (init-time) |
| State Management | Zustand                  | ✅ Decided             |
| LLM              | Alibaba DashScope (Qwen) | ✅ Decided             |
| Database         | Supabase PostgreSQL      | ✅ Decided (Phase 4)   |
| Vector DB        | pgvector / Pinecone      | 📅 Later               |
| Tool Calling     | LangChain Tools → MCP    | 📅 Phase 3             |
| Code Standards   | ESLint + Prettier        | ✅ Decided (init-time) |
| Git Hooks        | Husky + lint-staged      | ✅ Decided (init-time) |
| Testing          | Vitest + Testing Library | ✅ Decided (init-time) |
| CI/CD            | GitHub Actions + Vercel  | ✅ Decided (init-time) |

---

## Phase Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│  Phase 1       Phase 2       Phase 3       Phase 4       Extensions  │
│  ───────      ───────       ───────       ───────       ──────────   │
│  Basic Chat →  Streaming  →  Tool Call  →  Persist   →  RAG Enhance  │
│                                                                       │
│  MVP           Typewriter    Real Actions  Cloud Save   Knowledge DB  │
│  ✅ Done       ✅ Done       ✅ Done       ✅ Done       ✅ Done       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Basic Conversation

### Goal

Complete the minimum loop: User input → Call LLM → Display response

### Task List

- [✅] **1.1 Environment Setup**
  - Create Next.js project (with Tailwind CSS + ESLint)
  - Initialize shadcn/ui
  - Configure ESLint + Prettier
  - Configure Husky + lint-staged (Git hooks)
  - Configure Vitest testing framework
  - Install Zustand state management
  - Install LangChain dependencies
  - Configure environment variables (API Key)
  - Create OpenSpec specification directory

- [✅] **1.2 Backend API**
  - Create `/api/chat` route
  - Implement basic LLM call
  - Test API returns correctly

- [✅] **1.3 Frontend Page**
  - Create chat interface (input box + message list)
  - Implement send message functionality
  - Display AI response
  - Markdown rendering (react-markdown + remark-gfm + rehype-raw)
  - Message regeneration feature
  - Export PDF feature (smart itinerary extraction)

- [✅] **1.4 Conversation History**
  - Frontend maintains messages array
  - Each request includes history messages
  - Implement multi-turn conversation

- [✅] **1.5 Basic Prompt**
  - Design travel assistant System Prompt
  - Define role, capabilities, style

### Acceptance Criteria

- [✅] Can ask "What's fun in Beijing" and get an answer
- [✅] Can have multi-turn conversations, AI remembers context
- [✅] Non-travel questions are politely declined (optional)

### Learning Points

- LangChain LLM invocation
- Next.js App Router Route Handler
- Zustand state management
- Frontend-backend data transfer
- Prompt Engineering basics

---

## Phase 2: Streaming Experience

### Goal

Implement typewriter effect to improve user experience

### Task List

- [✅] **2.1 Backend Streaming Modification**
  - LangChain `.stream()` method (chatStream function)
  - Backend returns SSE (Server-Sent Events) format
  - Handle streaming chunk transfer (TransformStream)
  - API supports `stream=true` parameter, backward compatible

- [✅] **2.2 Frontend Streaming Reception**
  - Custom SSE parsing (services/chat.ts sendStreamMessage)
  - Support request cancellation (AbortController)
  - Real-time message content update (add placeholder, then incremental update)
  - isStreaming state to distinguish loading vs streaming

- [✅] **2.3 Interaction Optimization**
  - Add loading state indicator (bouncing dots animation)
  - Implement "Stop Generation" button (red square button)
  - Handle network errors and retry (request.ts unified wrapper)
  - Request timeout control (AI chat 2-minute timeout)
  - Request service layer encapsulation (services/chat.ts)

### Acceptance Criteria

- [✅] AI response appears character by character like typing
- [✅] Real-time content updates visible during generation
- [✅] Can interrupt ongoing response (stop button)

### Learning Points

- SSE principles and implementation
- Streaming data processing (ReadableStream, TransformStream)
- Frontend state management (isLoading vs isStreaming)
- Error handling and user experience

### Related Documentation

- OpenSpec Change: `openspec/changes/add-streaming-output/`

---

## Phase 3: Tool Calling

### Goal

Enable assistant to call external APIs, upgrade from "chatbot" to "Agent"

### Task List

- [✅] **3.1 Understand Function Calling**
  - LangChain Tools definition (`@langchain/core/tools`)
  - ReAct Agent decision flow (Thought → Action → Observation)
  - LangGraph's `createReactAgent` implementation

- [✅] **3.2 Implement Local Tools**
  - Current date tool (`get_current_date`)
  - Tool display name mapping

- [✅] **3.3 Integrate MCP Services**
  - Use `@langchain/mcp-adapters` `MultiServerMCPClient`
  - Amap MCP (weather query, POI search)
  - VariFlight MCP (flight query)
  - 12306 MCP (not yet integrated, pending ModelScope service debugging)

- [✅] **3.4 Frontend Tool Call Display**
  - `ToolCallSteps` component shows tool call steps
  - Collapsible tool call details
  - Agent event stream real-time display

### Acceptance Criteria

- [✅] Ask "What's today's date" returns correct date
- [✅] Ask "Tokyo weather today" returns real data
- [✅] Ask "Flights from Beijing to Shanghai" returns flight info
- [✅] AI automatically determines when to call tools
- [✅] Tool call steps display correctly

### Learning Points

- Function Calling / Tool Use principles
- ReAct Agent decision loop
- LangChain MCP Adapters
- Agent event stream (streamEvents)
- Frontend state management (tool call status)

### Related Documentation

- OpenSpec Change: `openspec/changes/add-tool-calling/`

---

## Phase 4: Persistence

> OpenSpec Change: `openspec/changes/add-persistence/`

### Tech Selection

| Component      | Solution            | Status      |
| -------------- | ------------------- | ----------- |
| Authentication | Supabase Auth       | ✅ Complete |
| Database       | Supabase PostgreSQL | ✅ Complete |
| Data Isolation | Row Level Security  | ✅ Complete |

### Task List

**4.1 Environment Setup**

- ✅ Create Supabase project
- ✅ Install dependencies (`@supabase/supabase-js`, `@supabase/ssr`)
- ✅ Configure environment variables
- ✅ Create Supabase clients (`src/lib/supabase/client.ts`, `server.ts`)
- ✅ Execute database migration (`supabase/migrations/001_create_tables.sql`)

**4.2 User Authentication**

- ✅ Create `AuthProvider` component (`src/components/auth/AuthProvider.tsx`)
- ✅ Implement login/signup pages (`src/app/auth/login/`, `signup/`)
- ✅ Implement `UserMenu` component (`src/components/auth/UserMenu.tsx`)
- ✅ Configure Auth middleware (`middleware.ts`)

**4.3 Conversation Persistence**

- ✅ Create `session-store.ts` to manage session list
- ✅ Create session CRUD service (`src/services/session.ts`)
- ✅ Direct Supabase client calls (no separate API routes needed)
- ✅ Messages auto-save to database on send

**4.4 History Session Management UI**

- ✅ Create sidebar component (`Sidebar.tsx`)
- ✅ Implement switch/delete/rename sessions
- ✅ Auto-generate session title from first message
- ✅ Mobile sidebar adaptation (Sheet drawer)

### Acceptance Criteria

- ✅ Users can register, login, logout
- ✅ Conversations auto-save to cloud
- ✅ Conversations persist after page refresh
- ✅ Can view and switch between history sessions
- ✅ Different user data completely isolated (RLS policy guaranteed)

### Learning Points

- Supabase Auth authentication flow
- PostgreSQL Row Level Security
- Next.js middleware and route protection

---

## Phase 5: RAG Knowledge Enhancement

> OpenSpec Change: `openspec/changes/add-rag-knowledge/`

### Tech Selection

| Component        | Solution                    | Status      |
| ---------------- | --------------------------- | ----------- |
| Vector Database  | Supabase pgvector           | ✅ Complete |
| Embedding Model  | DashScope text-embedding-v3 | ✅ Complete |
| Vector Dimension | 1024                        | ✅ Complete |
| Knowledge Data   | 701 attractions (JSONL)     | ✅ Complete |

### Task List

**5.1 Infrastructure**

- ✅ Create database migration `supabase/migrations/002_create_knowledge_documents.sql`
- ✅ Configure Embedding model `src/lib/langchain/rag/embeddings.ts`
- ✅ Implement vector store `src/lib/langchain/rag/store.ts`

**5.2 Document Processing**

- ✅ Prepare knowledge data (701 attractions with descriptions, ratings, reviews)
- ✅ Implement JSONL loader `src/lib/langchain/rag/loader.ts`
- ✅ Implement document splitter `src/lib/langchain/rag/splitter.ts`
- ✅ Create knowledge import script `scripts/ingest-knowledge.ts`

**5.3 Retrieval Integration**

- ✅ Implement retriever `src/lib/langchain/rag/retriever.ts`
- ✅ Add RAG-enhanced Agent prompts
- ✅ Integrate retriever into Agent execution flow

**5.4 Testing and Validation**

- ✅ Write unit tests (loader, splitter, retriever)
- ✅ End-to-end test passed

### Acceptance Criteria

- ✅ Ask "What's fun in Sanya" returns specific attractions (Dadonghai, Luhuitou, etc.)
- ✅ Answers include ratings, visitor reviews from knowledge base
- ✅ High retrieval relevance, fast response (<500ms)

### Learning Points

- pgvector vector database usage
- Embedding model invocation
- RAG retrieval-augmented generation principles
- Document chunking strategies

---

## Development Principles

1. **Progressive** - Each phase can run independently
2. **Run first, optimize later** - Working > Pretty > Perfect
3. **Write your own code** - Understanding principles > copy-paste
4. **Document promptly** - Record problems and solutions

---

## References

- [LangChain.js Docs](https://js.langchain.com/docs/)
- [Alibaba Cloud DashScope](https://dashscope.aliyun.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

_Last updated: 2026-01-27 (Phase 5 RAG Knowledge Enhancement completed)_
