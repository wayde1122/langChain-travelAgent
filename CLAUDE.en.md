# CLAUDE.md - AI Collaboration Guide

> This file provides project context and collaboration guidelines for AI coding assistants (Claude, Cursor, GitHub Copilot, etc.).

---

## Project Overview

**Travel Assistant** - An AI travel assistant application built with LangChain.js + Next.js.

### Core Features

- Travel Q&A and recommendations
- Itinerary planning
- Real-time information queries (weather, exchange rates)
- Personalized recommendations

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **AI**: LangChain.js + Alibaba Cloud DashScope (qwen-plus)
- **State**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + React Testing Library

---

## Project Structure

```
travel-assistant/
├── app/                    # Next.js pages and API
│   ├── api/chat/           # Chat API
│   └── page.tsx            # Main page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── *.tsx               # Business components
├── lib/                    # Core logic
│   └── langchain/          # LangChain configuration
├── store/                  # Zustand Store
├── types/                  # TypeScript types
├── openspec/               # OpenSpec specifications
│   ├── specs/              # Current specs
│   └── changes/            # Change proposals
└── __tests__/              # Test files
```

---

## Coding Standards

### Must Follow

1. **TypeScript strict mode** - No `any` types
2. **Functional components** - Use Hooks, no Class components
3. **Server Components first** - Only add `"use client"` when necessary
4. **Tailwind styling** - No inline styles
5. **Error handling** - Wrap async operations with try-catch

### Naming Conventions

| Type      | Format      | Example             |
| --------- | ----------- | ------------------- |
| Component | PascalCase  | `ChatInput.tsx`     |
| Function  | camelCase   | `sendMessage()`     |
| Constant  | UPPER_SNAKE | `MAX_LENGTH`        |
| Type      | PascalCase  | `interface Message` |

### Import Order

```typescript
// 1. React/Next
import { useState } from 'react';

// 2. Third-party libraries
import { create } from 'zustand';

// 3. Internal modules (@/)
import { useChatStore } from '@/store';

// 4. Relative paths
import { Button } from './Button';

// 5. Types
import type { Message } from '@/types';
```

---

## AI Collaboration Guide

### When Generating Code

1. **Read related files first** - Understand existing code style
2. **Follow SPEC.md** - Project specification document
3. **Follow OpenSpec** - Check specs in `openspec/specs/`
4. **Small iterations** - Each change focuses on a single feature
5. **Add comments** - Complex logic needs explanation

### Testing Requirements

- Utility functions: Must have unit tests
- Components: Key interactions need testing
- API: Mock external dependencies

### Pre-commit Checklist

```bash
npm run lint        # ESLint check
npm run type-check  # TypeScript check
npm run test        # Run tests
```

---

## Key Files

| File                  | Purpose                      |
| --------------------- | ---------------------------- |
| `ROADMAP.md`          | Iteration plan and task list |
| `ARCHITECTURE.md`     | Technical architecture docs  |
| `SPEC.md`             | Coding standards             |
| `openspec/project.md` | Project context (for AI)     |

---

## Common Tasks

### Adding New Component

1. Create file in `components/`
2. Use shadcn/ui base components
3. Add TypeScript types
4. Consider if testing is needed

### Adding New API

1. Create route in `app/api/`
2. Implement request validation
3. Add error handling
4. Update API type definitions

### Modifying Store

1. Update `store/chat-store.ts`
2. Add new Actions
3. Update related components
4. Add tests

---

## Prohibited Actions

- ❌ Do not modify `node_modules`
- ❌ Do not commit `.env.local`
- ❌ Do not use `any` type
- ❌ Do not skip TypeScript errors
- ❌ Do not delete test files
- ❌ Do not hardcode API Keys

---

## When in Doubt

1. Check `ARCHITECTURE.md` for design decisions
2. Check `SPEC.md` for coding standards
3. Check `openspec/specs/` for feature specifications
4. If unsure, ask first

---

_Last updated: 2026-01-28_
