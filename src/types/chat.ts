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
  /** 添加消息 */
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  /** 更新指定消息内容 */
  updateMessage: (id: string, content: string) => void;
  /** 删除指定消息 */
  removeMessage: (id: string) => void;
  /** 删除指定消息及其之后的所有消息 */
  removeMessagesFrom: (id: string) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置错误信息 */
  setError: (error: string | null) => void;
  /** 清空所有消息 */
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
