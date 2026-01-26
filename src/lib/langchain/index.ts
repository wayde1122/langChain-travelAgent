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
  createChatPromptTemplate,
  createSimpleChatPromptTemplate,
} from './prompts';

// 对话链
export { createChatChain, chat, simpleChat } from './chain';
export type { ChatRequestParams, ChatResponse } from './chain';
