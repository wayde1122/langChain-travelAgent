/**
 * 聊天服务
 * 封装所有与聊天相关的 API 调用
 */

import { request, createCancellableRequest } from '@/lib/utils/request';

import type { ApiResponse } from '@/lib/utils/request';
import type { ApiMessage, ChatApiResponse, AgentEvent } from '@/types';

/** AI 聊天请求超时时间（毫秒）- 2分钟 */
const CHAT_TIMEOUT = 120000;

/** Agent 流式响应回调 */
interface AgentStreamCallbacks {
  /** 收到思考事件 */
  onThinking?: (content: string) => void;
  /** 工具开始调用 */
  onToolStart?: (
    id: string,
    name: string,
    displayName: string,
    input: Record<string, unknown>
  ) => void;
  /** 工具调用结束 */
  onToolEnd?: (
    id: string,
    name: string,
    output: string,
    error?: string
  ) => void;
  /** 收到内容块时调用 */
  onContent: (content: string) => void;
  /** 流式传输完成时调用 */
  onDone: () => void;
  /** 发生错误时调用 */
  onError: (error: string) => void;
}

/** 聊天服务 */
export const chatService = {
  /**
   * 发送消息（非流式）
   * @param message - 用户消息内容
   * @param history - 历史消息记录
   * @param useAgent - 是否使用 Agent 模式
   * @returns Promise<ApiResponse<ChatApiResponse>>
   */
  sendMessage: async (
    message: string,
    history: ApiMessage[] = [],
    useAgent = true
  ): Promise<ApiResponse<ChatApiResponse>> => {
    return request<ChatApiResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, stream: false, useAgent }),
      timeout: CHAT_TIMEOUT,
    });
  },

  /**
   * 发送 Agent 流式消息
   * @param message - 用户消息内容
   * @param history - 历史消息记录
   * @param callbacks - Agent 流式响应回调
   * @param signal - AbortSignal 用于取消请求
   */
  sendAgentStreamMessage: async (
    message: string,
    history: ApiMessage[] = [],
    callbacks: AgentStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
          stream: true,
          useAgent: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        callbacks.onError(`HTTP ${response.status}: ${errorText}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('无法读取响应流');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // 解码并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });

        // 处理完整的 SSE 消息
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6); // 去掉 "data: " 前缀
          try {
            const event = JSON.parse(jsonStr) as AgentEvent;
            handleAgentEvent(event, callbacks);

            // 如果是完成或错误事件，直接返回
            if ('done' in event || event.type === 'error') {
              return;
            }
          } catch {
            // 忽略解析错误，可能是不完整的消息
          }
        }
      }

      // 处理剩余缓冲区
      if (buffer.startsWith('data: ')) {
        const jsonStr = buffer.slice(6);
        try {
          const event = JSON.parse(jsonStr) as AgentEvent;
          handleAgentEvent(event, callbacks);
        } catch {
          // 忽略
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        callbacks.onError('请求已取消');
        return;
      }
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      callbacks.onError(errorMsg);
    }
  },

  /**
   * 创建可取消的 Agent 流式发送消息请求
   * @returns [sendAgentStreamMessage 函数, cancel 函数]
   */
  createCancellableAgentStreamSend: () => {
    const controller = new AbortController();

    const sendAgentStreamMessage = (
      message: string,
      history: ApiMessage[],
      callbacks: AgentStreamCallbacks
    ) => {
      return chatService.sendAgentStreamMessage(
        message,
        history,
        callbacks,
        controller.signal
      );
    };

    const cancel = () => controller.abort();

    return [sendAgentStreamMessage, cancel] as const;
  },

  /**
   * 创建可取消的发送消息请求（非流式）
   * 用于需要取消请求的场景（如重新生成时取消上一次请求）
   * @returns [sendMessage 函数, cancel 函数]
   */
  createCancellableSend: () => {
    const [doRequest, cancel] = createCancellableRequest();

    const sendMessage = async (
      message: string,
      history: ApiMessage[] = [],
      useAgent = true
    ): Promise<ApiResponse<ChatApiResponse>> => {
      return doRequest<ChatApiResponse>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history, stream: false, useAgent }),
        timeout: CHAT_TIMEOUT,
      });
    };

    return [sendMessage, cancel] as const;
  },
};

/**
 * 处理 Agent 事件
 */
function handleAgentEvent(
  event: AgentEvent,
  callbacks: AgentStreamCallbacks
): void {
  if ('done' in event) {
    callbacks.onDone();
    return;
  }

  switch (event.type) {
    case 'thinking':
      callbacks.onThinking?.(event.content);
      break;

    case 'tool_start':
      callbacks.onToolStart?.(
        event.id,
        event.name,
        event.displayName,
        event.input
      );
      break;

    case 'tool_end':
      callbacks.onToolEnd?.(event.id, event.name, event.output, event.error);
      break;

    case 'content':
      callbacks.onContent(event.content);
      break;

    case 'error':
      callbacks.onError(event.message);
      break;
  }
}

export type { AgentStreamCallbacks };
