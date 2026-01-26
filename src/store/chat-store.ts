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

  // 更新指定消息内容
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    })),

  // 删除指定消息
  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  // 删除指定消息及其之后的所有消息
  removeMessagesFrom: (id) =>
    set((state) => {
      const index = state.messages.findIndex((msg) => msg.id === id);
      if (index === -1) return state;
      return {
        messages: state.messages.slice(0, index),
      };
    }),

  // 设置加载状态
  setLoading: (loading) => set({ isLoading: loading }),

  // 设置错误
  setError: (error) => set({ error }),

  // 清空消息
  clearMessages: () => set({ messages: [], error: null }),
}));
