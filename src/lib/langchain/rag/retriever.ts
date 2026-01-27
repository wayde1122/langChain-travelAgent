/**
 * 知识检索器
 * 封装相似度搜索逻辑，提供简洁的检索接口
 */
import { similaritySearch, type SimilaritySearchResult } from './store';

/**
 * 检索器配置
 */
export const RETRIEVER_CONFIG = {
  defaultTopK: 3, // 默认返回结果数
  defaultThreshold: 0.65, // 默认相似度阈值（降低以获得更多结果）
  maxContentLength: 2000, // 单个文档最大内容长度
} as const;

/**
 * 检索结果（格式化后）
 */
export interface RetrievalResult {
  content: string;
  source: {
    name: string;
    city: string;
    rating?: number;
    tags?: string[];
  };
  similarity: number;
}

/**
 * 检索上下文（用于注入 Prompt）
 */
export interface RetrievalContext {
  hasResults: boolean;
  results: RetrievalResult[];
  formattedContext: string;
  query: string;
}

/**
 * 格式化检索结果为上下文字符串
 */
function formatResultsAsContext(results: SimilaritySearchResult[]): string {
  if (results.length === 0) {
    return '未找到相关的旅行知识。';
  }

  const formatted = results.map((result, index) => {
    const { content, metadata, similarity } = result;
    const relevance = Math.round(similarity * 100);

    // 截断过长内容
    const truncatedContent =
      content.length > RETRIEVER_CONFIG.maxContentLength
        ? content.slice(0, RETRIEVER_CONFIG.maxContentLength) + '...'
        : content;

    return `### 参考 ${index + 1}：${metadata.name}（${metadata.city}）
> 相关度：${relevance}% | 评分：${metadata.rating ?? '暂无'}分

${truncatedContent}`;
  });

  return formatted.join('\n\n---\n\n');
}

/**
 * 检索相关知识
 * @param query 用户查询
 * @param options 检索选项
 */
export async function retrieveKnowledge(
  query: string,
  options: {
    topK?: number;
    threshold?: number;
    city?: string;
  } = {}
): Promise<RetrievalContext> {
  const {
    topK = RETRIEVER_CONFIG.defaultTopK,
    threshold = RETRIEVER_CONFIG.defaultThreshold,
    city,
  } = options;

  try {
    const searchResults = await similaritySearch(query, {
      topK,
      threshold,
      city,
    });

    const results: RetrievalResult[] = searchResults.map((result) => ({
      content: result.content,
      source: {
        name: result.metadata.name,
        city: result.metadata.city,
        rating: result.metadata.rating ?? undefined,
        tags: result.metadata.tags,
      },
      similarity: result.similarity,
    }));

    const formattedContext = formatResultsAsContext(searchResults);

    console.log(`🔍 知识检索完成:`);
    console.log(
      `   - 查询: "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`
    );
    console.log(`   - 结果数: ${results.length}`);
    if (results.length > 0) {
      console.log(
        `   - 最高相关度: ${Math.round(results[0].similarity * 100)}%`
      );
    }

    return {
      hasResults: results.length > 0,
      results,
      formattedContext,
      query,
    };
  } catch (error) {
    console.error('知识检索失败:', error);

    return {
      hasResults: false,
      results: [],
      formattedContext: '知识库检索暂时不可用。',
      query,
    };
  }
}

/**
 * 判断查询是否需要检索
 * 用于过滤不需要检索的查询（如闲聊、问候等）
 */
export function shouldRetrieve(query: string): boolean {
  // 查询太短，可能是闲聊
  if (query.length < 4) {
    return false;
  }

  // 常见闲聊模式
  const chatPatterns = [
    /^你好/,
    /^hi$/i,
    /^hello$/i,
    /^嗨/,
    /^早上好/,
    /^晚上好/,
    /^谢谢/,
    /^再见/,
    /^拜拜/,
    /^好的/,
    /^ok$/i,
    /^明白了/,
    /^知道了/,
  ];

  for (const pattern of chatPatterns) {
    if (pattern.test(query.trim())) {
      return false;
    }
  }

  // 旅行相关关键词
  const travelKeywords = [
    '旅游',
    '旅行',
    '景点',
    '玩',
    '去',
    '推荐',
    '攻略',
    '住',
    '吃',
    '美食',
    '酒店',
    '好玩',
    '值得',
    '门票',
    '开放',
    '时间',
    '几点',
    '怎么去',
    '交通',
    '行程',
    '规划',
  ];

  // 城市名称（部分常见）
  const cityKeywords = [
    '北京',
    '上海',
    '广州',
    '深圳',
    '杭州',
    '成都',
    '重庆',
    '西安',
    '南京',
    '苏州',
    '厦门',
    '三亚',
    '大理',
    '丽江',
    '青岛',
    '桂林',
    '张家界',
    '黄山',
  ];

  const allKeywords = [...travelKeywords, ...cityKeywords];

  // 包含旅行关键词则需要检索
  for (const keyword of allKeywords) {
    if (query.includes(keyword)) {
      return true;
    }
  }

  // 默认进行检索（宁可多检索不遗漏）
  return true;
}

/**
 * 从查询中提取城市名称
 * 用于按城市筛选检索结果
 */
export function extractCityFromQuery(query: string): string | undefined {
  const cities = [
    '北京',
    '上海',
    '广州',
    '深圳',
    '杭州',
    '成都',
    '重庆',
    '西安',
    '南京',
    '苏州',
    '无锡',
    '常州',
    '厦门',
    '福州',
    '三亚',
    '海口',
    '大理',
    '丽江',
    '昆明',
    '青岛',
    '济南',
    '桂林',
    '南宁',
    '张家界',
    '长沙',
    '武汉',
    '黄山',
    '合肥',
    '天津',
    '沈阳',
    '大连',
    '哈尔滨',
    '长春',
    '郑州',
    '洛阳',
    '拉萨',
    '兰州',
    '敦煌',
    '乌鲁木齐',
    '银川',
    '西宁',
    '贵阳',
  ];

  for (const city of cities) {
    if (query.includes(city)) {
      return city;
    }
  }

  return undefined;
}
