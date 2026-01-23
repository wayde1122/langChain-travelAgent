/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 消息接口
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

/**
 * 聊天状态接口
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 聊天操作接口
 */
export interface ChatActions {
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

/**
 * 完整的聊天 Store 类型
 */
export type ChatStore = ChatState & ChatActions;
