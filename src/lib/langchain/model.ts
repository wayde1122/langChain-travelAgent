/**
 * LangChain 模型配置
 * 使用智谱 AI (GLM) 作为 LLM 提供商
 */
import path from 'path';

import { config as loadEnv } from 'dotenv';
import { ChatZhipuAI } from '@langchain/community/chat_models/zhipuai';

// 加载环境变量（从项目根目录）
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * 智谱 AI 模型配置选项
 */
interface ZhipuModelOptions {
  /** 模型名称，默认 glm-4-flash */
  model?: string;
  /** 温度参数，控制随机性 (0-1) */
  temperature?: number;
  /** 最大输出 token 数 */
  maxTokens?: number;
}

/**
 * 默认模型配置（从环境变量或使用默认值）
 */
const DEFAULT_MODEL_OPTIONS: Required<ZhipuModelOptions> = {
  model: process.env.LLM_MODEL ?? 'glm-4-flash',
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * 创建智谱 AI 聊天模型实例
 * @param options - 模型配置选项
 * @returns ChatZhipuAI 实例
 */
export function createChatModel(options: ZhipuModelOptions = {}): ChatZhipuAI {
  const modelConfig = { ...DEFAULT_MODEL_OPTIONS, ...options };

  // 从环境变量获取 API Key
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 环境变量未设置');
  }

  return new ChatZhipuAI({
    model: modelConfig.model,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
    apiKey: apiKey,
  });
}

/**
 * 获取默认聊天模型实例（单例模式）
 */
let defaultModelInstance: ChatZhipuAI | null = null;

export function getDefaultChatModel(): ChatZhipuAI {
  if (!defaultModelInstance) {
    defaultModelInstance = createChatModel();
  }
  return defaultModelInstance;
}

/**
 * 重置默认模型实例（用于测试）
 */
export function resetDefaultChatModel(): void {
  defaultModelInstance = null;
}

export type { ZhipuModelOptions };
