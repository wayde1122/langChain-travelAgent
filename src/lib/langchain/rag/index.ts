/**
 * RAG 模块入口
 * 统一导出所有 RAG 相关功能
 */

// Embedding
export {
  createEmbeddingModel,
  embedText,
  embedTexts,
  EMBEDDING_CONFIG,
} from './embeddings';

// 文档加载
export {
  loadPOIDocuments,
  formatPOIContent,
  extractMetadata,
  getCityList,
  type POIData,
  type POIMetadata,
} from './loader';

// 文档切分
export {
  createTextSplitter,
  splitDocument,
  splitDocuments,
  estimateChunkCount,
  SPLITTER_CONFIG,
} from './splitter';

// 向量存储
export {
  addDocuments,
  similaritySearch,
  getKnowledgeStats,
  clearKnowledgeBase,
  isKnowledgeBaseEmpty,
  STORE_CONFIG,
  type SimilaritySearchResult,
} from './store';

// 检索器
export {
  retrieveKnowledge,
  shouldRetrieve,
  extractCityFromQuery,
  RETRIEVER_CONFIG,
  type RetrievalResult,
  type RetrievalContext,
} from './retriever';
