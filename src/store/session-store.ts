import { create } from 'zustand';

import type { Session, SessionWithPreview } from '@/types/database';

/**
 * 会话列表状态
 */
interface SessionState {
  sessions: SessionWithPreview[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 会话操作
 */
interface SessionActions {
  /** 设置会话列表 */
  setSessions: (sessions: SessionWithPreview[]) => void;
  /** 添加会话 */
  addSession: (session: Session) => void;
  /** 更新会话 */
  updateSession: (id: string, updates: Partial<Session>) => void;
  /** 删除会话 */
  removeSession: (id: string) => void;
  /** 设置当前会话 */
  setCurrentSessionId: (id: string | null) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置错误 */
  setError: (error: string | null) => void;
  /** 清空所有状态 */
  clear: () => void;
}

type SessionStore = SessionState & SessionActions;

/**
 * 会话状态管理 Store
 */
export const useSessionStore = create<SessionStore>((set) => ({
  // 初始状态
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  error: null,

  // 设置会话列表
  setSessions: (sessions) => set({ sessions }),

  // 添加会话（插入到列表开头）
  addSession: (session) =>
    set((state) => ({
      sessions: [{ ...session, messageCount: 0 }, ...state.sessions],
    })),

  // 更新会话
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  // 删除会话
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      // 如果删除的是当前会话，清空 currentSessionId
      currentSessionId:
        state.currentSessionId === id ? null : state.currentSessionId,
    })),

  // 设置当前会话
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  // 设置加载状态
  setLoading: (isLoading) => set({ isLoading }),

  // 设置错误
  setError: (error) => set({ error }),

  // 清空所有状态
  clear: () =>
    set({
      sessions: [],
      currentSessionId: null,
      isLoading: false,
      error: null,
    }),
}));

export type { SessionStore };
