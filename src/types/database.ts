/**
 * Supabase 数据库类型定义
 * 与数据库表结构保持同步
 */
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          id?: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          tool_calls?: ToolCallJson[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          tool_calls?: ToolCallJson[] | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/**
 * 工具调用 JSON 结构
 */
export interface ToolCallJson {
  id: string;
  name: string;
  displayName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

/**
 * 会话类型（前端使用）
 */
export interface Session {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 带最后消息的会话
 */
export interface SessionWithPreview extends Session {
  lastMessage?: string;
  messageCount?: number;
}

/**
 * 持久化的消息类型
 */
export interface PersistedMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCallJson[];
  createdAt: Date;
}

/**
 * 数据库行转换为前端 Session
 */
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

/**
 * 数据库行转换为前端 Message
 */
export function toPersistedMessage(
  row: Database['public']['Tables']['messages']['Row']
): PersistedMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    toolCalls: row.tool_calls ?? undefined,
    createdAt: new Date(row.created_at),
  };
}
