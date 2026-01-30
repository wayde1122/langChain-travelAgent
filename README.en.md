# 🧳 AI Travel Assistant

<p align="center">
  <img src="public/travel-icon.jpg" alt="Travel Assistant" width="120" height="120" style="border-radius: 20px;">
</p>

<p align="center">
  <strong>An intelligent travel planning assistant powered by LangChain.js + Next.js</strong>
</p>

<p align="center">
  <a href="https://lang-chain-travel-agent.vercel.app/" target="_blank">🌐 Live Demo</a> •
  <a href="https://github.com/wayde1122/langChain-travelAgent" target="_blank">📦 GitHub</a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/LangChain.js-1.2-blue" alt="LangChain">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 📸 Screenshots

<p align="center">
  <img src="public/screenshot.png" alt="Screenshot" width="800">
</p>

---

## ✨ Features

- 🤖 **Intelligent Conversation** - Multi-turn dialogue powered by LLM with real-time streaming output
- 🛠️ **Tool Calling** - Integrated with Amap (weather/POI) and VariFlight (flight queries) via MCP services
- 📚 **RAG Knowledge Enhancement** - Built-in knowledge base with 700+ attractions for precise travel recommendations
- 💾 **Cloud Storage** - User authentication and session persistence powered by Supabase
- 📱 **Responsive Design** - Perfectly adapted for both desktop and mobile

## 🏗️ Tech Stack

| Category         | Technology                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org/) (App Router)                                                       |
| AI Framework     | [LangChain.js](https://js.langchain.com/) + [LangGraph](https://langchain-ai.github.io/langgraphjs/) |
| LLM              | [Alibaba Cloud DashScope](https://dashscope.aliyun.com/) (Qwen)                                      |
| Vector DB        | [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)                   |
| Database         | [Supabase PostgreSQL](https://supabase.com/)                                                         |
| State Management | [Zustand](https://zustand-demo.pmnd.rs/)                                                             |
| UI Components    | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)                       |
| Testing          | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react)           |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- [Supabase](https://supabase.com/) account
- [Alibaba Cloud DashScope](https://dashscope.aliyun.com/) API Key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/wayde1122/langChain-travelAgent.git
cd langChain-travelAgent
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env.local` and fill in the configuration:

```bash
cp .env.example .env.local
```

```env
# LLM Configuration (Alibaba Cloud DashScope)
DASHSCOPE_API_KEY=your_dashscope_api_key
LLM_MODEL=qwen-plus
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for knowledge import

# MCP Tools (Optional)
AMAP_API_KEY=your_amap_api_key           # Amap
VARIFLIGHT_API_KEY=your_variflight_key   # VariFlight
```

4. **Initialize database**

Execute migration scripts in Supabase Dashboard SQL Editor:

```bash
# Execute in order
supabase/migrations/001_create_tables.sql        # Sessions and messages tables
supabase/migrations/002_create_knowledge_documents.sql  # Knowledge base table
```

5. **Import knowledge base** (Optional)

```bash
# Dry run
npm run ingest:dry-run

# Import
npm run ingest
```

6. **Start development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
travel-assistant/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/chat/           # Chat API
│   │   ├── auth/               # Auth pages
│   │   └── page.tsx            # Main page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── chat/               # Chat components
│   │   └── auth/               # Auth components
│   ├── lib/
│   │   ├── langchain/          # LangChain configuration
│   │   │   ├── agent.ts        # ReAct Agent
│   │   │   ├── rag/            # RAG module
│   │   │   └── tools/          # Local tools
│   │   └── supabase/           # Supabase client
│   ├── store/                  # Zustand Store
│   ├── services/               # Service layer
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
├── scripts/                    # Utility scripts
└── openspec/                   # Feature specifications
```

## 📜 Available Scripts

| Command                 | Description                       |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Start development server          |
| `npm run build`         | Build for production              |
| `npm run start`         | Start production server           |
| `npm run lint`          | ESLint check                      |
| `npm run type-check`    | TypeScript type check             |
| `npm run test`          | Run tests                         |
| `npm run test:coverage` | Run tests with coverage report    |
| `npm run ingest`        | Import knowledge base             |
| `npm run ingest:clear`  | Clear and reimport knowledge base |

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage report
npm run test:coverage
```

## 🔧 Development Guide

### Code Standards

The project uses ESLint + Prettier for code style checking, automatically executed by Husky before commits.

```bash
# Manual lint
npm run lint

# Auto fix
npm run lint:fix

# Format code
npm run format
```

### Adding New Tools

1. Create tool file in `src/lib/langchain/tools/`
2. Define tool Schema and execution logic
3. Register tool in `agent.ts`

### Updating Knowledge Base

1. Edit `src/data/knowledge/knowledge.jsonl`
2. Run `npm run ingest:clear` to reimport

## 🗺️ Development Roadmap

- [✅] Phase 1: Basic Conversation
- [✅] Phase 2: Streaming Output
- [✅] Phase 3: Tool Calling (MCP Integration)
- [✅] Phase 4: User Authentication and Session Persistence
- [✅] Phase 5: RAG Knowledge Enhancement

See [ROADMAP.md](./ROADMAP.md) for details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation update
- `style:` Code formatting (no functional changes)
- `refactor:` Refactoring
- `test:` Test related
- `chore:` Build/tool related

## 📄 License

This project is open source under the [MIT License](./LICENSE).

## 🙏 Acknowledgments

- [LangChain.js](https://js.langchain.com/) - Powerful LLM application framework
- [Next.js](https://nextjs.org/) - React full-stack framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI component library
- [Alibaba Cloud DashScope](https://dashscope.aliyun.com/) - Qwen LLM service

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/wayde1122">wayde1122</a>
</p>
