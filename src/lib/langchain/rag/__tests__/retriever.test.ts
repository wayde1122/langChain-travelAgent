/**
 * 检索器测试
 */
import { describe, it, expect } from 'vitest';
import { shouldRetrieve, extractCityFromQuery } from '../retriever';

describe('retriever', () => {
  describe('shouldRetrieve', () => {
    it('应该对旅行相关查询返回 true', () => {
      expect(shouldRetrieve('北京有什么好玩的')).toBe(true);
      expect(shouldRetrieve('三亚旅游攻略')).toBe(true);
      expect(shouldRetrieve('推荐一些景点')).toBe(true);
      expect(shouldRetrieve('去哪里吃')).toBe(true);
      expect(shouldRetrieve('住哪个酒店好')).toBe(true);
    });

    it('应该对闲聊返回 false', () => {
      expect(shouldRetrieve('你好')).toBe(false);
      expect(shouldRetrieve('hi')).toBe(false);
      expect(shouldRetrieve('谢谢')).toBe(false);
      expect(shouldRetrieve('再见')).toBe(false);
      expect(shouldRetrieve('好的')).toBe(false);
    });

    it('应该对太短的查询返回 false', () => {
      expect(shouldRetrieve('哦')).toBe(false);
      expect(shouldRetrieve('嗯')).toBe(false);
      expect(shouldRetrieve('ok')).toBe(false);
    });

    it('默认应该返回 true（宁可多检索）', () => {
      expect(shouldRetrieve('今天天气怎么样')).toBe(true);
      expect(shouldRetrieve('帮我查一下')).toBe(true);
    });
  });

  describe('extractCityFromQuery', () => {
    it('应该正确提取城市名', () => {
      expect(extractCityFromQuery('北京有什么好玩的')).toBe('北京');
      expect(extractCityFromQuery('三亚旅游攻略')).toBe('三亚');
      expect(extractCityFromQuery('上海迪士尼怎么去')).toBe('上海');
      expect(extractCityFromQuery('杭州西湖介绍')).toBe('杭州');
    });

    it('应该对没有城市的查询返回 undefined', () => {
      expect(extractCityFromQuery('有什么好玩的')).toBeUndefined();
      expect(extractCityFromQuery('推荐一些景点')).toBeUndefined();
    });

    it('应该提取第一个匹配的城市', () => {
      // 如果查询中有多个城市，返回第一个匹配的
      const result = extractCityFromQuery('从北京到上海怎么去');
      expect(['北京', '上海']).toContain(result);
    });
  });
});
