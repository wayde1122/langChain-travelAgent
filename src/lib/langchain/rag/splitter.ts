/**
 * 文档切分器
 * 使用 RecursiveCharacterTextSplitter 将长文档切分为小块
 */
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import type { POIMetadata } from './loader';

/**
 * 切分器配置
 */
export const SPLITTER_CONFIG = {
  chunkSize: 1000, // 每个块最大字符数（中文约 500-700 字）
  chunkOverlap: 200, // 块之间的重叠字符数（保持上下文连贯）
  separators: ['\n\n', '\n', '---', '。', '！', '？', '；', ' ', ''], // 分隔符优先级
} as const;

/**
 * 创建文档切分器
 */
export function createTextSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: SPLITTER_CONFIG.chunkSize,
    chunkOverlap: SPLITTER_CONFIG.chunkOverlap,
    separators: [...SPLITTER_CONFIG.separators],
  });
}

/**
 * 切分单个文档
 * 保留原始 metadata 到每个切片
 */
export async function splitDocument(
  doc: Document<POIMetadata>
): Promise<Document<POIMetadata & { chunkIndex: number }>[]> {
  const splitter = createTextSplitter();
  const chunks = await splitter.splitDocuments([doc]);

  // 添加 chunkIndex 到 metadata
  return chunks.map((chunk, index) => ({
    ...chunk,
    metadata: {
      ...doc.metadata,
      chunkIndex: index,
    },
  }));
}

/**
 * 批量切分文档
 * @param docs 原始文档数组
 * @returns 切分后的文档数组
 */
export async function splitDocuments(
  docs: Document<POIMetadata>[]
): Promise<Document<POIMetadata & { chunkIndex: number }>[]> {
  const allChunks: Document<POIMetadata & { chunkIndex: number }>[] = [];

  for (const doc of docs) {
    const chunks = await splitDocument(doc);
    allChunks.push(...chunks);
  }

  console.log(`✂️ 文档切分完成:`);
  console.log(`   - 原始文档数: ${docs.length}`);
  console.log(`   - 切分后块数: ${allChunks.length}`);
  console.log(
    `   - 平均每文档: ${(allChunks.length / docs.length).toFixed(1)} 块`
  );

  return allChunks;
}

/**
 * 估算文档切分后的块数
 * 用于预估向量化成本
 */
export function estimateChunkCount(docs: Document[]): number {
  let totalChars = 0;
  for (const doc of docs) {
    totalChars += doc.pageContent.length;
  }

  // 估算公式：总字符数 / (chunkSize - chunkOverlap)
  const effectiveChunkSize =
    SPLITTER_CONFIG.chunkSize - SPLITTER_CONFIG.chunkOverlap;
  return Math.ceil(totalChars / effectiveChunkSize);
}
