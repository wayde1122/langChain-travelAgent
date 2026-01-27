# 用户认证与对话持久化

> 本文档记录了阶段 4 用户认证和对话持久化的实现过程。

---

## 概述

### 目标

- 用户可以注册、登录、登出
- 对话自动保存到云端数据库
- 刷新页面后对话不丢失
- 可以查看和切换历史会话
- 不同用户数据完全隔离

### 技术方案

| 组件     | 方案                | 说明               |
| -------- | ------------------- | ------------------ |
| 认证     | Supabase Auth       | 邮箱/密码认证      |
| 数据库   | Supabase PostgreSQL | 云端 PostgreSQL    |
| 数据隔离 | Row Level Security  | 数据库级别用户隔离 |

---

## 环境变量配置

```bash
# .env.local

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxx
```

### 获取配置

1. 访问 [Supabase](https://supabase.com/) 创建项目
2. 在 Project Settings → API 中获取：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 安装依赖

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 数据库设计

### 数据表结构

```sql
-- 会话表
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '新对话',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,  -- 存储工具调用步骤
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 索引设计

```sql
-- 按用户查会话（高频）
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
-- 会话列表按更新时间排序
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
-- 按会话查消息（高频）
CREATE INDEX idx_messages_session_id ON messages(session_id);
-- 消息时间排序
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### Row Level Security 策略

```sql
-- 启用 RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的会话
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 用户只能访问自己会话中的消息
CREATE POLICY "Users can view messages in own sessions"
  ON messages FOR SELECT
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create messages in own sessions"
  ON messages FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
```

---

## 核心实现

### 1. Supabase 客户端

**`src/lib/supabase/client.ts`**（浏览器端）

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`src/lib/supabase/server.ts`**（服务端）

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### 2. Auth 中间件

**`middleware.ts`**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 3. AuthProvider 组件

**`src/components/auth/AuthProvider.tsx`**

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 4. 会话服务

**`src/services/session.ts`**

```typescript
import { createClient } from '@/lib/supabase/client';
import { toSession, toPersistedMessage } from '@/types/database';

// 获取会话列表
export async function getSessions() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error('获取会话列表失败');
  return data.map(toSession);
}

// 创建新会话
export async function createSession(title = '新对话') {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('请先登录');

  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) throw new Error('创建会话失败');
  return toSession(data);
}

// 获取会话消息
export async function getSessionMessages(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('获取消息失败');
  return data.map(toPersistedMessage);
}

// 保存消息
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  toolCalls?: unknown[]
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      tool_calls: toolCalls ?? null,
    })
    .select()
    .single();

  if (error) throw new Error('保存消息失败');

  // 更新会话时间
  await supabase
    .from('sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return toPersistedMessage(data);
}
```

---

## 数据流

### 用户发送消息流程

```
用户发送消息
     │
     ├─► 检查是否登录
     │
     ├─► 有 sessionId?
     │        │
     │        ├─ 否 → 创建新 Session
     │        │
     │        └─ 是 → 使用现有 Session
     │
     ├─► 保存用户消息到 messages 表
     │
     ├─► 调用 AI 获取回复
     │
     └─► 保存助手消息到 messages 表
```

### 切换会话流程

```
用户点击历史会话
     │
     ▼
setCurrentSessionId(id)
     │
     ▼
clearMessages()  // 清空当前消息
     │
     ▼
getSessionMessages(id)  // 从数据库加载
     │
     ▼
按顺序 addMessage() 到 Store
     │
     ▼
UI 渲染消息列表
```

---

## UI 布局

```
┌─────────────────────────────────────────────────────────┐
│  Logo                                    UserMenu       │
├───────────────┬─────────────────────────────────────────┤
│               │                                         │
│  [+ 新对话]   │             ChatArea                    │
│  ───────────  │             (flex-1)                    │
│  会话 1       │                                         │
│  会话 2 (当前)│                                         │
│  会话 3       │                                         │
│               │                                         │
│  Sidebar      │                                         │
│  (240px)      │                                         │
│               │                                         │
└───────────────┴─────────────────────────────────────────┘

移动端：侧边栏收起为抽屉 (Sheet 组件)
```

---

## 类型定义

**`src/types/database.ts`**

```typescript
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
        };
        Update: {
          title?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          tool_calls: ToolCallJson[] | null;
          created_at: string;
        };
        Insert: {
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          tool_calls?: ToolCallJson[] | null;
        };
      };
    };
  };
}

// 前端使用的类型
export interface Session {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCallJson[];
  createdAt: Date;
}

// 数据库行 → 前端类型转换
export function toSession(
  row: Database['public']['Tables']['sessions']['Row']
): Session {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
```

---

## 验收标准

- ✅ 用户可以注册、登录、登出
- ✅ 对话自动保存到云端
- ✅ 刷新页面后对话不丢失
- ✅ 可以查看和切换历史会话
- ✅ 不同用户数据完全隔离（RLS 策略保证）

---

## 学习要点

1. **Supabase Auth** - 认证流程和 Session 管理
2. **Row Level Security** - 数据库级别的用户数据隔离
3. **Next.js 中间件** - 处理认证状态刷新
4. **SSR 客户端** - 服务端和客户端的 Supabase 客户端区别

---

## 相关文档

- OpenSpec Change: `openspec/changes/add-persistence/`
- 数据库迁移: `supabase/migrations/001_create_tables.sql`
- 类型定义: `src/types/database.ts`

---

_文档创建时间：2026-01-27_
