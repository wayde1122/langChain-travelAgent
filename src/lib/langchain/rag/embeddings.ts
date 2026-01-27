/**
 * Embedding 模型配置
 * 使用阿里云 DashScope text-embedding-v3 模型
 */

/**
 * Embedding 模型配置
 */
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-v3',
  dimensions: 1024,
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
} as const;

/**
 * 创建 Embedding 模型实例
 * 使用 DashScope 的 OpenAI 兼容接口
 */
export async function createEmbeddingModel() {
  // 动态导入避免服务端渲染问题
  const { OpenAIEmbeddings } = await import('@langchain/openai');

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error('缺少环境变量 DASHSCOPE_API_KEY');
  }

  return new OpenAIEmbeddings({
    model: EMBEDDING_CONFIG.model,
    dimensions: EMBEDDING_CONFIG.dimensions,
    configuration: {
      baseURL: EMBEDDING_CONFIG.baseUrl,
    },
    apiKey,
  });
}

/**
 * 生成文本的向量嵌入
 */
export async function embedText(text: string): Promise<number[]> {
  const embeddings = await createEmbeddingModel();
  return embeddings.embedQuery(text);
}

/**
 * 批量生成文本的向量嵌入
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings = await createEmbeddingModel();
  return embeddings.embedDocuments(texts);
}
