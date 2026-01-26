/**
 * 聊天服务
 * 封装所有与聊天相关的 API 调用
 */

import { request, createCancellableRequest } from '@/lib/utils/request';

import type { ApiResponse } from '@/lib/utils/request';
import type { ApiMessage, ChatApiResponse } from '@/types';

/** AI 聊天请求超时时间（毫秒）- 2分钟 */
const CHAT_TIMEOUT = 120000;

/** SSE 数据块类型 */
interface SSEChunk {
  content?: string;
  done?: boolean;
  error?: string;
}

/** 流式响应回调 */
interface StreamCallbacks {
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
   * @returns Promise<ApiResponse<ChatApiResponse>>
   */
  sendMessage: async (
    message: string,
    history: ApiMessage[] = []
  ): Promise<ApiResponse<ChatApiResponse>> => {
    return request<ChatApiResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
      timeout: CHAT_TIMEOUT,
    });
  },

  /**
   * 发送流式消息
   * @param message - 用户消息内容
   * @param history - 历史消息记录
   * @param callbacks - 流式响应回调
   * @param signal - AbortSignal 用于取消请求
   */
  sendStreamMessage: async (
    message: string,
    history: ApiMessage[] = [],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, history, stream: true }),
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
            const data = JSON.parse(jsonStr) as SSEChunk;

            if (data.error) {
              callbacks.onError(data.error);
              return;
            }

            if (data.content) {
              callbacks.onContent(data.content);
            }

            if (data.done) {
              callbacks.onDone();
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
          const data = JSON.parse(jsonStr) as SSEChunk;
          if (data.done) {
            callbacks.onDone();
          }
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
   * 创建可取消的流式发送消息请求
   * @returns [sendStreamMessage 函数, cancel 函数]
   */
  createCancellableStreamSend: () => {
    const controller = new AbortController();

    const sendStreamMessage = (
      message: string,
      history: ApiMessage[],
      callbacks: StreamCallbacks
    ) => {
      return chatService.sendStreamMessage(
        message,
        history,
        callbacks,
        controller.signal
      );
    };

    const cancel = () => controller.abort();

    return [sendStreamMessage, cancel] as const;
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
      history: ApiMessage[] = []
    ): Promise<ApiResponse<ChatApiResponse>> => {
      return doRequest<ChatApiResponse>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
        timeout: CHAT_TIMEOUT,
      });
    };

    return [sendMessage, cancel] as const;
  },
};
