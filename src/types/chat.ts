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

// ============ API 类型定义 ============

/**
 * API 消息格式（用于网络传输）
 */
export interface ApiMessage {
  role: MessageRole;
  content: string;
}

/**
 * 聊天 API 请求体
 */
export interface ChatApiRequest {
  /** 用户输入的消息 */
  message: string;
  /** 历史消息（可选） */
  history?: ApiMessage[];
}

/**
 * 聊天 API 成功响应
 */
export interface ChatApiSuccessResponse {
  success: true;
  /** AI 回复内容 */
  message: string;
}

/**
 * 聊天 API 错误响应
 */
export interface ChatApiErrorResponse {
  success: false;
  /** 错误信息 */
  error: string;
}

/**
 * 聊天 API 响应
 */
export type ChatApiResponse = ChatApiSuccessResponse | ChatApiErrorResponse;
