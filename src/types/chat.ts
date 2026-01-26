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
  /** 是否启用流式输出（默认 false） */
  stream?: boolean;
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

// ============ Agent 事件类型定义 ============

/**
 * 工具调用步骤状态
 */
export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error';

/**
 * 工具调用步骤
 */
export interface ToolCallStep {
  /** 步骤 ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** 工具显示名称 */
  displayName: string;
  /** 调用参数 */
  input: Record<string, unknown>;
  /** 返回结果 */
  output?: string;
  /** 状态 */
  status: ToolCallStatus;
  /** 错误信息 */
  error?: string;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
}

/**
 * Agent 思考事件
 */
export interface AgentThinkingEvent {
  type: 'thinking';
  content: string;
}

/**
 * 工具开始调用事件
 */
export interface AgentToolStartEvent {
  type: 'tool_start';
  id: string;
  name: string;
  displayName: string;
  input: Record<string, unknown>;
}

/**
 * 工具调用结束事件
 */
export interface AgentToolEndEvent {
  type: 'tool_end';
  id: string;
  name: string;
  output: string;
  error?: string;
}

/**
 * 内容输出事件
 */
export interface AgentContentEvent {
  type: 'content';
  content: string;
}

/**
 * 错误事件
 */
export interface AgentErrorEvent {
  type: 'error';
  message: string;
}

/**
 * 完成事件
 */
export interface AgentDoneEvent {
  done: true;
}

/**
 * Agent 事件联合类型
 */
export type AgentEvent =
  | AgentThinkingEvent
  | AgentToolStartEvent
  | AgentToolEndEvent
  | AgentContentEvent
  | AgentErrorEvent
  | AgentDoneEvent;

/**
 * 带工具调用步骤的消息
 */
export interface MessageWithToolCalls extends Message {
  /** 工具调用步骤 */
  toolCalls?: ToolCallStep[];
  /** 是否正在流式传输 */
  isStreaming?: boolean;
}
