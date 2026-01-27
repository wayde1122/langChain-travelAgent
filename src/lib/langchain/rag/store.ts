/**
 * 向量存储
 * 使用 Supabase pgvector 存储和检索文档向量
 */
import { Document } from '@langchain/core/documents';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { createEmbeddingModel } from './embeddings';

import type { POIMetadata } from './loader';

/**
 * 向量存储配置
 */
export const STORE_CONFIG = {
  tableName: 'knowledge_documents',
  batchSize: 10, // 每批处理的文档数（DashScope API 限制最大 10）
  maxRetries: 3, // 最大重试次数
  retryDelay: 2000, // 重试延迟（毫秒）
} as const;

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 相似度搜索结果
 */
export interface SimilaritySearchResult {
  id: string;
  content: string;
  metadata: POIMetadata & { chunkIndex?: number };
  similarity: number;
}

/**
 * 创建 Supabase 管理客户端（使用 service_role key）
 */
function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '缺少环境变量 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 创建只读 Supabase 客户端（使用 anon key）
 */
function createReadClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '缺少环境变量 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * 批量添加文档到向量存储
 * @param docs 切分后的文档数组
 * @param onProgress 进度回调
 */
export async function addDocuments(
  docs: Document<POIMetadata & { chunkIndex?: number }>[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const client = createAdminClient();
  const embeddings = await createEmbeddingModel();

  let success = 0;
  let failed = 0;

  // 分批处理
  for (let i = 0; i < docs.length; i += STORE_CONFIG.batchSize) {
    const batch = docs.slice(i, i + STORE_CONFIG.batchSize);
    const batchTexts = batch.map((doc) => doc.pageContent);
    const batchNum = Math.floor(i / STORE_CONFIG.batchSize) + 1;

    let retries = 0;
    let batchSuccess = false;

    while (retries < STORE_CONFIG.maxRetries && !batchSuccess) {
      try {
        // 批量生成向量
        const vectors = await embeddings.embedDocuments(batchTexts);

        // 构建插入数据
        const records = batch.map((doc, idx) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          embedding: vectors[idx],
        }));

        // 插入数据库
        const { error } = await client
          .from(STORE_CONFIG.tableName)
          .insert(records);

        if (error) {
          throw new Error(`数据库插入失败: ${error.message}`);
        }

        success += batch.length;
        batchSuccess = true;
      } catch (error) {
        retries++;
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (retries < STORE_CONFIG.maxRetries) {
          console.error(
            `\n⚠️ 批次 ${batchNum} 失败 (${retries}/${STORE_CONFIG.maxRetries}): ${errorMsg.slice(0, 100)}`
          );
          console.log(`   等待 ${STORE_CONFIG.retryDelay / 1000}s 后重试...`);
          await delay(STORE_CONFIG.retryDelay * retries); // 递增延迟
        } else {
          console.error(
            `\n❌ 批次 ${batchNum} 最终失败: ${errorMsg.slice(0, 100)}`
          );
          failed += batch.length;
        }
      }
    }

    // 进度回调
    if (onProgress) {
      onProgress(
        Math.min(i + STORE_CONFIG.batchSize, docs.length),
        docs.length
      );
    }

    // 批次间短暂延迟，避免请求过快
    if (i + STORE_CONFIG.batchSize < docs.length) {
      await delay(500);
    }
  }

  return { success, failed };
}

/**
 * 相似度搜索
 * @param query 查询文本
 * @param options 搜索选项
 */
export async function similaritySearch(
  query: string,
  options: {
    topK?: number;
    threshold?: number;
    city?: string;
  } = {}
): Promise<SimilaritySearchResult[]> {
  const { topK = 3, threshold = 0.7, city } = options;

  const client = createReadClient();
  const embeddings = await createEmbeddingModel();

  // 生成查询向量
  const queryVector = await embeddings.embedQuery(query);

  // 调用数据库函数进行相似度搜索
  const functionName = city
    ? 'match_knowledge_documents_by_city'
    : 'match_knowledge_documents';

  const params: Record<string, unknown> = {
    query_embedding: queryVector,
    match_threshold: threshold,
    match_count: topK,
  };

  if (city) {
    params.city_filter = city;
  }

  const { data, error } = await client.rpc(functionName, params);

  if (error) {
    console.error('相似度搜索失败:', error);
    throw new Error(`相似度搜索失败: ${error.message}`);
  }

  return (data ?? []).map(
    (row: {
      id: string;
      content: string;
      metadata: POIMetadata & { chunkIndex?: number };
      similarity: number;
    }) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: row.similarity,
    })
  );
}

/**
 * 获取知识库统计信息
 */
export async function getKnowledgeStats(): Promise<{
  totalDocuments: number;
  totalCities: number;
  cities: string[];
}> {
  const client = createReadClient();

  // 获取文档总数
  const { count } = await client
    .from(STORE_CONFIG.tableName)
    .select('*', { count: 'exact', head: true });

  // 获取城市列表
  const { data: cityData } = await client
    .from(STORE_CONFIG.tableName)
    .select('metadata->city')
    .order('metadata->city');

  const cities = new Set<string>();
  if (cityData) {
    for (const row of cityData) {
      const city = (row as Record<string, unknown>).city as string;
      if (city) {
        cities.add(city);
      }
    }
  }

  return {
    totalDocuments: count ?? 0,
    totalCities: cities.size,
    cities: Array.from(cities).sort(),
  };
}

/**
 * 清空知识库
 * ⚠️ 危险操作，仅用于开发/测试
 */
export async function clearKnowledgeBase(): Promise<void> {
  const client = createAdminClient();

  const { error } = await client
    .from(STORE_CONFIG.tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录

  if (error) {
    throw new Error(`清空知识库失败: ${error.message}`);
  }

  console.log('🗑️ 知识库已清空');
}

/**
 * 检查知识库是否为空
 */
export async function isKnowledgeBaseEmpty(): Promise<boolean> {
  const client = createReadClient();

  const { count } = await client
    .from(STORE_CONFIG.tableName)
    .select('*', { count: 'exact', head: true });

  return (count ?? 0) === 0;
}
