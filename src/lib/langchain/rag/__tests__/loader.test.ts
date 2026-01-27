/**
 * JSONL 文档加载器测试
 */
import { describe, it, expect } from 'vitest';
import { formatPOIContent, extractMetadata, type POIData } from '../loader';

describe('loader', () => {
  const mockPOI: POIData = {
    name: '亚龙湾国家旅游度假区',
    city: '三亚',
    intro: '亚龙湾是三亚最著名的海湾，以洁白细腻的沙滩和清澈的海水闻名。',
    tags: ['夜游观景', '海滨沙滩'],
    rating: 4.7,
    reviewCount: 4332,
    playTime: '1-3天',
    openTime: '全年全天开放',
    topComments: [
      '三亚旅游必看最全交通指南，非常实用！',
      '来三亚好多次了，每次都要来亚龙湾看看。',
    ],
  };

  describe('formatPOIContent', () => {
    it('应该正确格式化景点内容', () => {
      const content = formatPOIContent(mockPOI);

      expect(content).toContain('# 亚龙湾国家旅游度假区（三亚）');
      expect(content).toContain('## 基本信息');
      expect(content).toContain('标签：夜游观景、海滨沙滩');
      expect(content).toContain('评分：4.7 分（4332 条评论）');
      expect(content).toContain('建议游玩时长：1-3天');
      expect(content).toContain('开放时间：全年全天开放');
      expect(content).toContain('## 景点介绍');
      expect(content).toContain('亚龙湾是三亚最著名的海湾');
      expect(content).toContain('## 游客评价');
      expect(content).toContain('三亚旅游必看最全交通指南');
    });

    it('应该处理缺失字段', () => {
      const minimalPOI: POIData = {
        name: '测试景点',
        city: '测试城市',
        intro: '测试介绍',
      };

      const content = formatPOIContent(minimalPOI);

      expect(content).toContain('# 测试景点（测试城市）');
      expect(content).toContain('测试介绍');
      expect(content).not.toContain('标签：');
      expect(content).not.toContain('评分：');
      expect(content).not.toContain('## 游客评价');
    });

    it('应该处理空评论数组', () => {
      const poiWithEmptyComments: POIData = {
        ...mockPOI,
        topComments: [],
      };

      const content = formatPOIContent(poiWithEmptyComments);

      expect(content).not.toContain('## 游客评价');
    });
  });

  describe('extractMetadata', () => {
    it('应该正确提取 metadata', () => {
      const metadata = extractMetadata(mockPOI);

      expect(metadata.name).toBe('亚龙湾国家旅游度假区');
      expect(metadata.city).toBe('三亚');
      expect(metadata.tags).toEqual(['夜游观景', '海滨沙滩']);
      expect(metadata.rating).toBe(4.7);
      expect(metadata.reviewCount).toBe(4332);
      expect(metadata.source).toBe('knowledge.jsonl');
    });

    it('应该处理缺失字段并使用默认值', () => {
      const minimalPOI: POIData = {
        name: '测试',
        city: '测试',
        intro: '测试',
      };

      const metadata = extractMetadata(minimalPOI);

      expect(metadata.tags).toEqual([]);
      expect(metadata.rating).toBeNull();
      expect(metadata.reviewCount).toBeNull();
    });
  });
});
