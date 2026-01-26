// LangChain 模块导出

// 模型配置
export {
  createChatModel,
  getDefaultChatModel,
  resetDefaultChatModel,
} from './model';
export type { LLMModelOptions } from './model';

// Prompt 模板
export {
  TRAVEL_ASSISTANT_SYSTEM_PROMPT,
  TRAVEL_AGENT_SYSTEM_PROMPT,
  createChatPromptTemplate,
  createSimpleChatPromptTemplate,
} from './prompts';

// 对话链（保留用于向后兼容）
export { createChatChain, chat, chatStream, simpleChat } from './chain';
export type {
  ChatRequestParams,
  ChatResponse,
  StreamChatResponse,
  StreamChatErrorResponse,
} from './chain';

// ReAct Agent
export {
  createTravelAgent,
  executeAgent,
  executeAgentStream,
  getToolDisplayName,
} from './agent';

// MCP 客户端
export {
  initializeMCPClient,
  getMCPTools,
  getMCPClient,
  closeMCPClient,
} from './mcp-client';

// 工具
export { localTools, currentDateTool } from './tools';
