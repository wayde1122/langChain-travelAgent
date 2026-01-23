import { create } from 'zustand';

import type { ChatStore } from '@/types';

/**
 * 生成唯一 ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 聊天状态管理 Store
 */
export const useChatStore = create<ChatStore>((set) => ({
  // 初始状态
  messages: [],
  isLoading: false,
  error: null,

  // 添加消息
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: generateId(),
          createdAt: new Date(),
        },
      ],
    })),

  // 设置加载状态
  setLoading: (loading) => set({ isLoading: loading }),

  // 设置错误
  setError: (error) => set({ error }),

  // 清空消息
  clearMessages: () => set({ messages: [], error: null }),
}));
