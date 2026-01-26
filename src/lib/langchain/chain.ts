/**
 * LangChain Chain 配置
 * 创建和管理对话链
 */
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { IterableReadableStream } from '@langchain/core/utils/stream';

import type { Message } from '@/types';

import { getDefaultChatModel, createChatModel } from './model';
import {
  createChatPromptTemplate,
  TRAVEL_ASSISTANT_SYSTEM_PROMPT,
} from './prompts';

import type { LLMModelOptions } from './model';

/**
 * 聊天请求参数
 */
interface ChatRequestParams {
  /** 用户输入 */
  input: string;
  /** 历史消息 */
  history?: Message[];
  /** 模型配置（可选） */
  modelOptions?: LLMModelOptions;
}

/**
 * 聊天响应
 */
interface ChatResponse {
  /** AI 回复内容 */
  content: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（如果有） */
  error?: string;
}

/**
 * 流式聊天响应
 */
interface StreamChatResponse {
  /** 流式响应迭代器 */
  stream: IterableReadableStream<string>;
  /** 是否成功 */
  success: true;
}

interface StreamChatErrorResponse {
  /** 是否成功 */
  success: false;
  /** 错误信息 */
  error: string;
}

/**
 * 将应用消息转换为 LangChain 消息格式
 */
function convertToLangChainMessages(messages: Message[]): BaseMessage[] {
  return messages.map((msg) => {
    switch (msg.role) {
      case 'user':
        return new HumanMessage(msg.content);
      case 'assistant':
        return new AIMessage(msg.content);
      case 'system':
        return new SystemMessage(msg.content);
      default:
        return new HumanMessage(msg.content);
    }
  });
}

/**
 * 创建对话链
 */
export function createChatChain(modelOptions?: LLMModelOptions) {
  const model = modelOptions
    ? createChatModel(modelOptions)
    : getDefaultChatModel();
  const prompt = createChatPromptTemplate();

  return RunnableSequence.from([prompt, model]);
}

/**
 * 执行聊天请求
 * @param params - 聊天请求参数
 * @returns 聊天响应
 */
export async function chat(params: ChatRequestParams): Promise<ChatResponse> {
  const { input, history = [], modelOptions } = params;

  try {
    const chain = createChatChain(modelOptions);
    const historyMessages = convertToLangChainMessages(history);

    const response = await chain.invoke({
      input,
      history: historyMessages,
    });

    // 提取响应内容
    const content =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    return {
      content,
      success: true,
    };
  } catch (error) {
    console.error('Chat error:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';

    return {
      content: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 执行流式聊天请求
 * @param params - 聊天请求参数
 * @returns 流式聊天响应
 */
export async function chatStream(
  params: ChatRequestParams
): Promise<StreamChatResponse | StreamChatErrorResponse> {
  const { input, history = [], modelOptions } = params;

  try {
    const chain = createChatChain(modelOptions);
    const historyMessages = convertToLangChainMessages(history);

    // 使用 stream 方法获取流式响应
    const stream = await chain.stream({
      input,
      history: historyMessages,
    });

    // 转换为字符串流
    const textStream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          // 提取内容字符串
          const content =
            typeof chunk.content === 'string'
              ? chunk.content
              : JSON.stringify(chunk.content);
          controller.enqueue(content);
        },
      })
    );

    return {
      stream: IterableReadableStream.fromReadableStream(textStream),
      success: true,
    };
  } catch (error) {
    console.error('Chat stream error:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 简单聊天（无历史记录）
 * 用于快速测试
 */
export async function simpleChat(input: string): Promise<string> {
  const model = getDefaultChatModel();

  const messages = [
    new SystemMessage(TRAVEL_ASSISTANT_SYSTEM_PROMPT),
    new HumanMessage(input),
  ];

  const response = await model.invoke(messages);

  return typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);
}

export type {
  ChatRequestParams,
  ChatResponse,
  StreamChatResponse,
  StreamChatErrorResponse,
};
