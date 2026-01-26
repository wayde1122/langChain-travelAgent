/**
 * LangChain 模型配置
 * 支持通过 OpenAI 兼容接口调用各种 LLM（阿里云 DashScope、智谱 AI 等）
 */
import path from 'path';

import { config as loadEnv } from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';

// 加载环境变量（从项目根目录）
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * LLM 模型配置选项
 */
interface LLMModelOptions {
  /** 模型名称 */
  model?: string;
  /** 温度参数，控制随机性 (0-1) */
  temperature?: number;
  /** 最大输出 token 数 */
  maxTokens?: number;
}

/**
 * 默认模型配置（从环境变量或使用默认值）
 */
const DEFAULT_MODEL_OPTIONS: Required<LLMModelOptions> = {
  model: process.env.LLM_MODEL ?? 'qwen-plus',
  temperature: 0.7,
  maxTokens: 2048,
};

/** API 基础 URL */
const LLM_BASE_URL =
  process.env.LLM_BASE_URL ??
  'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * 创建聊天模型实例
 * @param options - 模型配置选项
 * @returns ChatOpenAI 实例
 */
export function createChatModel(options: LLMModelOptions = {}): ChatOpenAI {
  const modelConfig = { ...DEFAULT_MODEL_OPTIONS, ...options };

  // 从环境变量获取 API Key
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY 环境变量未设置');
  }

  return new ChatOpenAI({
    model: modelConfig.model,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
    apiKey: apiKey,
    configuration: {
      baseURL: LLM_BASE_URL,
    },
  });
}

/**
 * 获取默认聊天模型实例（单例模式）
 */
let defaultModelInstance: ChatOpenAI | null = null;

export function getDefaultChatModel(): ChatOpenAI {
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

export type { LLMModelOptions };
