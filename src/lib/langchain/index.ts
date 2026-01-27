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
  RAG_AGENT_SYSTEM_PROMPT,
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

// RAG 模块
export {
  // Embedding
  createEmbeddingModel,
  embedText,
  embedTexts,
  EMBEDDING_CONFIG,
  // 文档加载
  loadPOIDocuments,
  formatPOIContent,
  extractMetadata,
  getCityList,
  // 文档切分
  createTextSplitter,
  splitDocument,
  splitDocuments,
  estimateChunkCount,
  SPLITTER_CONFIG,
  // 向量存储
  addDocuments,
  similaritySearch,
  getKnowledgeStats,
  clearKnowledgeBase,
  isKnowledgeBaseEmpty,
  STORE_CONFIG,
  // 检索器
  retrieveKnowledge,
  shouldRetrieve,
  extractCityFromQuery,
  RETRIEVER_CONFIG,
} from './rag';
export type {
  POIData,
  POIMetadata,
  SimilaritySearchResult,
  RetrievalResult,
  RetrievalContext,
} from './rag';
