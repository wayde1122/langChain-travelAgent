/**
 * 文档切分器测试
 */
import { describe, it, expect } from 'vitest';
import { Document } from '@langchain/core/documents';
import {
  createTextSplitter,
  splitDocument,
  splitDocuments,
  estimateChunkCount,
  SPLITTER_CONFIG,
} from '../splitter';
import type { POIMetadata } from '../loader';

describe('splitter', () => {
  describe('createTextSplitter', () => {
    it('应该创建正确配置的切分器', () => {
      const splitter = createTextSplitter();

      expect(splitter).toBeDefined();
    });
  });

  describe('splitDocument', () => {
    it('应该切分长文档并保留 metadata', async () => {
      const longContent = '这是一段很长的内容。'.repeat(200); // 约 2000 字符
      const metadata: POIMetadata = {
        name: '测试景点',
        city: '北京',
        tags: ['历史', '文化'],
        rating: 4.5,
        reviewCount: 1000,
        source: 'test',
      };

      const doc = new Document<POIMetadata>({
        pageContent: longContent,
        metadata,
      });

      const chunks = await splitDocument(doc);

      // 应该切分成多个块
      expect(chunks.length).toBeGreaterThan(1);

      // 每个块应该保留原始 metadata
      for (const chunk of chunks) {
        expect(chunk.metadata.name).toBe('测试景点');
        expect(chunk.metadata.city).toBe('北京');
        expect(chunk.metadata.tags).toEqual(['历史', '文化']);
        expect(chunk.metadata.chunkIndex).toBeTypeOf('number');
      }

      // chunkIndex 应该从 0 开始递增
      expect(chunks[0].metadata.chunkIndex).toBe(0);
      expect(chunks[1].metadata.chunkIndex).toBe(1);
    });

    it('应该保持短文档不切分', async () => {
      const shortContent = '这是一段短内容。';
      const metadata: POIMetadata = {
        name: '小景点',
        city: '上海',
        tags: [],
        rating: null,
        reviewCount: null,
        source: 'test',
      };

      const doc = new Document<POIMetadata>({
        pageContent: shortContent,
        metadata,
      });

      const chunks = await splitDocument(doc);

      expect(chunks.length).toBe(1);
      expect(chunks[0].pageContent).toBe(shortContent);
      expect(chunks[0].metadata.chunkIndex).toBe(0);
    });
  });

  describe('splitDocuments', () => {
    it('应该批量切分多个文档', async () => {
      // 创建足够长的内容以触发切分（需要超过 chunkSize 1000 字符）
      const docs: Document<POIMetadata>[] = [
        new Document({
          pageContent: '这是第一个景点的详细内容，包含很多有趣的信息。'.repeat(
            100
          ),
          metadata: {
            name: '景点1',
            city: '城市1',
            tags: [],
            rating: null,
            reviewCount: null,
            source: 'test',
          },
        }),
        new Document({
          pageContent: '这是第二个景点的详细内容，同样包含丰富的介绍。'.repeat(
            100
          ),
          metadata: {
            name: '景点2',
            city: '城市2',
            tags: [],
            rating: null,
            reviewCount: null,
            source: 'test',
          },
        }),
      ];

      const chunks = await splitDocuments(docs);

      // 应该有来自两个文档的块
      expect(chunks.length).toBeGreaterThanOrEqual(2);

      // 验证有两个不同来源的块
      const names = new Set(chunks.map((c) => c.metadata.name));
      expect(names.size).toBe(2);
    });
  });

  describe('estimateChunkCount', () => {
    it('应该正确估算块数', () => {
      const effectiveChunkSize =
        SPLITTER_CONFIG.chunkSize - SPLITTER_CONFIG.chunkOverlap;
      const totalChars = effectiveChunkSize * 5; // 应该产生约 5 个块

      const docs = [
        new Document({
          pageContent: 'a'.repeat(totalChars),
          metadata: {},
        }),
      ];

      const estimated = estimateChunkCount(docs);

      expect(estimated).toBe(5);
    });
  });
});
