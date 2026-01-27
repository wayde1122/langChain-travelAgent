/**
 * JSONL 文档加载器
 * 从 knowledge.jsonl 加载景点数据并转换为 LangChain Document 格式
 */
import { Document } from '@langchain/core/documents';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 景点数据结构（JSONL 中的每行数据）
 */
export interface POIData {
  name: string; // 景点名称
  city: string; // 所在城市
  intro: string; // 景点介绍
  tags?: string[]; // 标签数组
  rating?: number; // 评分
  reviewCount?: number; // 评论数量
  playTime?: string; // 建议游玩时长
  openTime?: string; // 开放时间
  topComments?: string[]; // 热门评论
}

/**
 * 文档 Metadata 结构
 */
export interface POIMetadata {
  name: string;
  city: string;
  tags: string[];
  rating: number | null;
  reviewCount: number | null;
  source: string;
}

/**
 * 将景点数据转换为文档内容
 * 按照设计文档中的模板格式化
 */
export function formatPOIContent(poi: POIData): string {
  const lines: string[] = [];

  // 标题
  lines.push(`# ${poi.name}（${poi.city}）`);
  lines.push('');

  // 基本信息
  lines.push('## 基本信息');
  if (poi.tags && poi.tags.length > 0) {
    lines.push(`- 标签：${poi.tags.join('、')}`);
  }
  if (poi.rating !== undefined) {
    const reviewInfo =
      poi.reviewCount !== undefined ? `（${poi.reviewCount} 条评论）` : '';
    lines.push(`- 评分：${poi.rating} 分${reviewInfo}`);
  }
  if (poi.playTime) {
    lines.push(`- 建议游玩时长：${poi.playTime}`);
  }
  if (poi.openTime) {
    lines.push(`- 开放时间：${poi.openTime}`);
  }
  lines.push('');

  // 景点介绍
  if (poi.intro) {
    lines.push('## 景点介绍');
    lines.push(poi.intro);
    lines.push('');
  }

  // 游客评价
  if (poi.topComments && poi.topComments.length > 0) {
    lines.push('## 游客评价');
    poi.topComments.forEach((comment, index) => {
      lines.push(comment);
      if (index < poi.topComments!.length - 1) {
        lines.push('---');
      }
    });
  }

  return lines.join('\n');
}

/**
 * 提取 Metadata
 */
export function extractMetadata(poi: POIData): POIMetadata {
  return {
    name: poi.name,
    city: poi.city,
    tags: poi.tags ?? [],
    rating: poi.rating ?? null,
    reviewCount: poi.reviewCount ?? null,
    source: 'knowledge.jsonl',
  };
}

/**
 * 从 JSONL 文件加载景点数据
 * @param filePath JSONL 文件路径（默认为 src/data/knowledge/knowledge.jsonl）
 * @returns LangChain Document 数组
 */
export async function loadPOIDocuments(
  filePath?: string
): Promise<Document<POIMetadata>[]> {
  // 默认文件路径
  const defaultPath = path.join(
    process.cwd(),
    'src/data/knowledge/knowledge.jsonl'
  );
  const targetPath = filePath ?? defaultPath;

  // 检查文件是否存在
  if (!fs.existsSync(targetPath)) {
    throw new Error(`知识库文件不存在: ${targetPath}`);
  }

  // 读取文件内容
  const content = fs.readFileSync(targetPath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim());

  const documents: Document<POIMetadata>[] = [];
  const errors: string[] = [];

  // 逐行解析 JSON
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const poi: POIData = JSON.parse(line);

      // 验证必填字段
      if (!poi.name || !poi.city || !poi.intro) {
        errors.push(`第 ${i + 1} 行: 缺少必填字段 (name/city/intro)`);
        continue;
      }

      // 创建 Document
      const doc = new Document<POIMetadata>({
        pageContent: formatPOIContent(poi),
        metadata: extractMetadata(poi),
      });

      documents.push(doc);
    } catch (error) {
      errors.push(
        `第 ${i + 1} 行: JSON 解析失败 - ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // 输出加载统计
  console.log(`📚 文档加载完成:`);
  console.log(`   - 成功: ${documents.length} 条`);
  if (errors.length > 0) {
    console.log(`   - 失败: ${errors.length} 条`);
    console.log(
      `   - 错误详情: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`
    );
  }

  return documents;
}

/**
 * 获取所有城市列表
 */
export async function getCityList(filePath?: string): Promise<string[]> {
  const documents = await loadPOIDocuments(filePath);
  const cities = new Set<string>();

  for (const doc of documents) {
    if (doc.metadata.city) {
      cities.add(doc.metadata.city);
    }
  }

  return Array.from(cities).sort();
}
