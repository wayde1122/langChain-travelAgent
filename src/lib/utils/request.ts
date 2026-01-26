/**
 * 通用请求封装
 * 提供超时控制、统一错误处理、自动 JSON 解析等功能
 */

/** 默认超时时间（毫秒） */
const DEFAULT_TIMEOUT = 30000;

/** 扩展的请求选项 */
export interface RequestOptions extends Omit<RequestInit, 'signal'> {
  /** 超时时间（毫秒），默认 30s */
  timeout?: number;
  /** 外部传入的 AbortSignal，用于手动取消请求 */
  signal?: AbortSignal;
}

/** API 响应结构 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 请求错误类型 */
export class RequestError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'NETWORK' | 'PARSE' | 'HTTP' | 'ABORT',
    public readonly status?: number
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

/**
 * 通用请求函数
 * @param url - 请求 URL
 * @param options - 请求选项
 * @returns Promise<ApiResponse<T>>
 *
 * @example
 * ```ts
 * const result = await request<{ message: string }>('/api/chat', {
 *   method: 'POST',
 *   body: JSON.stringify({ content: 'hello' }),
 * });
 *
 * if (result.success) {
 *   console.log(result.data?.message);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    signal: externalSignal,
    ...fetchOptions
  } = options;

  // 创建超时控制器
  const controller = new AbortController();
  let isTimeoutAbort = false;

  const timeoutId = setTimeout(() => {
    isTimeoutAbort = true;
    controller.abort();
  }, timeout);

  // 合并外部 signal 和超时 signal
  const signal = externalSignal
    ? mergeAbortSignals(externalSignal, controller.signal)
    : controller.signal;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    // HTTP 错误处理
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    // 解析 JSON 响应
    const data = (await response.json()) as T;
    return {
      success: true,
      data,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    // 处理各种错误类型
    if (err instanceof Error) {
      // 请求被取消
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: isTimeoutAbort ? '请求超时，请稍后重试' : '请求已取消',
        };
      }

      // JSON 解析错误
      if (err instanceof SyntaxError) {
        return {
          success: false,
          error: '响应数据格式错误',
        };
      }

      // 网络错误
      return {
        success: false,
        error: `网络错误：${err.message}`,
      };
    }

    return {
      success: false,
      error: '未知错误',
    };
  }
}

/**
 * 合并多个 AbortSignal
 * 任一 signal 触发时，返回的 signal 也会触发
 */
function mergeAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}

/**
 * 创建可取消的请求
 * @returns [request 函数, cancel 函数]
 *
 * @example
 * ```ts
 * const [doRequest, cancel] = createCancellableRequest();
 *
 * // 发起请求
 * const promise = doRequest<Data>('/api/data');
 *
 * // 需要时取消请求
 * cancel();
 * ```
 */
export function createCancellableRequest(): [
  <T>(url: string, options?: RequestOptions) => Promise<ApiResponse<T>>,
  () => void,
] {
  const controller = new AbortController();

  const doRequest = <T>(url: string, options: RequestOptions = {}) => {
    return request<T>(url, { ...options, signal: controller.signal });
  };

  const cancel = () => controller.abort();

  return [doRequest, cancel];
}
