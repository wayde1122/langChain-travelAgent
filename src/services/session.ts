import { createClient } from '@/lib/supabase/client';
import { toSession, toPersistedMessage } from '@/types/database';

import type {
  Session,
  SessionWithPreview,
  PersistedMessage,
  Database,
} from '@/types/database';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

/**
 * 获取用户的所有会话
 */
export async function getSessions(): Promise<SessionWithPreview[]> {
  const supabase = createClient();

  // 先获取会话列表
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (sessionsError) {
    console.error('Failed to fetch sessions:', sessionsError);
    throw new Error('获取会话列表失败');
  }

  // 获取每个会话的消息数量
  const sessions = (sessionsData ?? []) as SessionRow[];
  const result: SessionWithPreview[] = [];

  for (const row of sessions) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', row.id);

    result.push({
      ...toSession(row),
      messageCount: count ?? 0,
    });
  }

  return result;
}

/**
 * 创建新会话
 */
export async function createSession(title = '新对话'): Promise<Session> {
  const supabase = createClient();

  // 获取当前用户
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('请先登录');
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      title,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create session:', error);
    throw new Error('创建会话失败');
  }

  return toSession(data as SessionRow);
}

/**
 * 更新会话标题
 */
export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('sessions')
    .update({ title })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update session:', error);
    throw new Error('更新会话失败');
  }
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to delete session:', error);
    throw new Error('删除会话失败');
  }
}

/**
 * 获取会话的所有消息
 */
export async function getSessionMessages(
  sessionId: string
): Promise<PersistedMessage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch messages:', error);
    throw new Error('获取消息失败');
  }

  return (data ?? []).map((row) => toPersistedMessage(row as MessageRow));
}

/**
 * 保存消息到数据库
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  toolCalls?: unknown[]
): Promise<PersistedMessage> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      tool_calls: (toolCalls ??
        null) as Database['public']['Tables']['messages']['Insert']['tool_calls'],
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save message:', error);
    throw new Error('保存消息失败');
  }

  // 更新会话的 updated_at
  await supabase
    .from('sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return toPersistedMessage(data as MessageRow);
}

/**
 * 根据首条消息生成会话标题
 */
export function generateSessionTitle(firstMessage: string): string {
  // 取前 20 个字符作为标题
  const maxLength = 20;
  const cleaned = firstMessage.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.slice(0, maxLength) + '...';
}
