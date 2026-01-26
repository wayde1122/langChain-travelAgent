import { create } from 'zustand';

import type { Message, ToolCallStep } from '@/types';

/**
 * 带工具调用步骤的消息
 */
export interface MessageWithTools extends Message {
  toolCalls?: ToolCallStep[];
  isStreaming?: boolean;
}

/**
 * 聊天状态
 */
interface ChatState {
  messages: MessageWithTools[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

/**
 * 聊天操作
 */
interface ChatActions {
  /** 添加消息 */
  addMessage: (message: Omit<MessageWithTools, 'id' | 'createdAt'>) => string;
  /** 更新指定消息内容 */
  updateMessage: (id: string, content: string) => void;
  /** 追加消息内容 */
  appendMessageContent: (id: string, content: string) => void;
  /** 删除指定消息 */
  removeMessage: (id: string) => void;
  /** 删除指定消息及其之后的所有消息 */
  removeMessagesFrom: (id: string) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置流式传输状态 */
  setStreaming: (streaming: boolean) => void;
  /** 设置消息的流式状态 */
  setMessageStreaming: (id: string, isStreaming: boolean) => void;
  /** 设置错误信息 */
  setError: (error: string | null) => void;
  /** 清空所有消息 */
  clearMessages: () => void;
  /** 添加工具调用步骤 */
  addToolCall: (messageId: string, toolCall: ToolCallStep) => void;
  /** 更新工具调用步骤 */
  updateToolCall: (
    messageId: string,
    toolCallId: string,
    updates: Partial<ToolCallStep>
  ) => void;
}

/**
 * 完整的聊天 Store 类型
 */
type ChatStore = ChatState & ChatActions;

/**
 * 生成唯一 ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 聊天状态管理 Store
 */
export const useChatStore = create<ChatStore>((set, _get) => ({
  // 初始状态
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,

  // 添加消息，返回消息 ID
  addMessage: (message) => {
    const id = generateId();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id,
          createdAt: new Date(),
        },
      ],
    }));
    return id;
  },

  // 更新指定消息内容
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    })),

  // 追加消息内容
  appendMessageContent: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + content } : msg
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

  // 设置流式传输状态
  setStreaming: (streaming) => set({ isStreaming: streaming }),

  // 设置消息的流式状态
  setMessageStreaming: (id, isStreaming) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, isStreaming } : msg
      ),
    })),

  // 设置错误
  setError: (error) => set({ error }),

  // 清空消息
  clearMessages: () =>
    set({ messages: [], error: null, isLoading: false, isStreaming: false }),

  // 添加工具调用步骤
  addToolCall: (messageId, toolCall) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, toolCalls: [...(msg.toolCalls ?? []), toolCall] }
          : msg
      ),
    })),

  // 更新工具调用步骤
  updateToolCall: (messageId, toolCallId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              toolCalls: msg.toolCalls?.map((tc) =>
                tc.id === toolCallId ? { ...tc, ...updates } : tc
              ),
            }
          : msg
      ),
    })),
}));

export type { ChatStore };
