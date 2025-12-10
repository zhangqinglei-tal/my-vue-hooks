/**
 * toAwaitFetch API 类型定义
 * 一个解决请求问题的工具类
 */

/**
 * HTTP 请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * 请求模式
 */
export type RequestMode = 'cors' | 'no-cors' | 'same-origin' | 'navigate' | 'websocket';

/**
 * 凭证模式
 */
export type CredentialsMode = 'include' | 'same-origin' | 'omit';

/**
 * 请求数据类型
 */
export type RequestType = 'json' | 'form' | 'text' | 'blob' | 'arraybuffer';

/**
 * 响应数据类型
 */
export type ResponseType = 'json' | 'text' | 'blob' | 'arraybuffer' | 'formData';

/**
 * 请求头配置类型
 * 可以是 HeadersInit、Record<string, string> 或返回这些类型的函数
 */
export type HeadersConfig = 
  | HeadersInit 
  | Record<string, string> 
  | ((config: { url: string; method?: HttpMethod }) => HeadersInit | Record<string, string>);

/**
 * 验证状态码函数
 * @param status HTTP 状态码
 * @returns 是否通过验证
 */
export type ValidateStatusFn = (status: number) => boolean;

/**
 * 验证响应内容函数
 * @param response 响应数据
 * @returns 是否通过验证
 */
export type ValidateResponseFn<T = any> = (response: T) => boolean;

/**
 * 响应数据转换函数
 * 用于将原始响应数据转换为业务中使用的数据格式
 * @param data 原始响应数据（response 中的 data）
 * @returns 转换后的数据
 * @example
 * // 例如：提取嵌套数据
 * transformResponse: (data) => data.result.list
 * 
 * // 例如：格式化数据
 * transformResponse: (data) => ({
 *   items: data.list,
 *   total: data.pagination.total
 * })
 */
export type TransformResponseFn<TRaw = any, TTransformed = any> = (data: TRaw) => TTransformed;

/**
 * HTTP 错误处理函数
 * @param error 错误信息
 * @param status HTTP 状态码
 * @param response 响应数据
 * @param suppressError 取消抛错的方法，调用此方法后，即使错误未被用户主动处理，也不会抛出未处理的错误
 */
export type HttpErrorHandler<T = any> = (
  error: Error,
  status: number,
  response: T,
  suppressError: () => void,
) => void | Promise<void>;

/**
 * 业务错误处理函数
 * @param error 错误信息
 * @param response 响应数据
 * @param suppressError 取消抛错的方法，调用此方法后，即使错误未被用户主动处理，也不会抛出未处理的错误
 */
export type BusinessErrorHandler<T = any> = (
  error: Error,
  response: T,
  suppressError: () => void
) => void | Promise<void>;

/**
 * 网络错误处理函数
 * @param error 网络错误（已统一转换为 Error 类型）
 * @param suppressError 取消抛错的方法，调用此方法后，即使错误未被用户主动处理，也不会抛出未处理的错误
 */
export type NetworkErrorHandler = (
  error: Error,
  suppressError: () => void,
) => void | Promise<void>;

/**
 * 重试判断函数
 * @param attempt 当前重试次数（从 1 开始）
 * @param error 错误信息
 * @returns 是否应该继续重试
 */
export type ShouldRetry = (attempt: number, error: FetchError) => boolean | Promise<boolean>;

/**
 * 重试配置
 */
export interface RetryConfig {
  /**
   * 是否开启重试
   * @default false
   */
  enabled?: boolean;
  /**
   * 最大重试次数
   * @default 3
   */
  maxRetryCount?: number;
  /**
   * 重试延迟时间（毫秒）
   * @default 1000
   */
  delay?: number;
  /**
   * 自定义重试判断函数，返回 true 表示继续重试，false 表示停止重试
   * 如果未提供，将使用默认的重试逻辑
   */
  shouldRetry?: ShouldRetry;
}

/**
 * 请求配置（单次请求）
 */
export interface RequestConfig<TRequest = any, TResponse = any> {
  /**
   * 请求 URL（必需）
   */
  url: string;
  /**
   * HTTP 方法
   * @default 'GET'
   */
  method?: HttpMethod;
  /**
   * 请求数据
   * - GET 请求时，data 会转换为 URL 查询参数
   * - POST/PUT/PATCH 等请求时，data 作为请求体数据
   * - POST 请求的查询参数应该放在 URL 中（如 '/api/users?page=1'）
   */
  data?: TRequest;
  /**
   * 验证请求状态码是否符合要求的函数，返回布尔类型
   */
  validateStatus?: ValidateStatusFn;
  /**
   * 验证请求内容是否符合业务要求，返回布尔类型
   */
  validateResponse?: ValidateResponseFn<TResponse>;
  /**
   * 响应数据转换函数
   * 用于将原始响应数据转换为业务中使用的数据格式
   * 在 validateResponse 验证通过后执行
   * @example
   * transformResponse: (data) => data.result.list
   */
  transformResponse?: TransformResponseFn<TResponse, TResponse>;
  /**
   * 用来捕获 validateStatus 为 false 时进行错误处理的函数
   */
  onHttpError?: HttpErrorHandler<TResponse>;
  /**
   * 用来捕获 validateResponse 为 false 时进行错误处理的函数
   * 主要用来处理业务场景的错误
   */
  onBusinessError?: BusinessErrorHandler<TResponse>;
  /**
   * 用来捕获网络异常的错误处理函数
   * 主要用来处理无网络、跨域等报错问题
   */
  onNetworkError?: NetworkErrorHandler;
  /**
   * 重试配置
   */
  retry?: RetryConfig;
  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number;
  /**
   * 请求头配置
   * 可以是 HeadersInit、Record<string, string> 或返回这些类型的函数
   * 函数接收 { url, method } 作为参数，可用于动态生成请求头
   */
  headers?: HeadersConfig;
  /**
   * 取消请求的信号（可与返回的 cancel 一起使用）
   */
  signal?: AbortSignal;
  /**
   * 请求模式
   * @default 'cors'
   */
  mode?: RequestMode;
  /**
   * 凭证模式
   * @default 'include'
   */
  credentials?: CredentialsMode;
}

/**
 * 全局配置（不包含 url、method、data）
 */
export interface GlobalConfig<TResponse = any> {
  /**
   * 基础 URL，会与请求的 url 拼接
   */
  baseURL?: string;
  /**
   * 验证请求状态码是否符合要求的函数，返回布尔类型
   */
  validateStatus?: ValidateStatusFn;
  /**
   * 验证请求内容是否符合业务要求，返回布尔类型
   */
  validateResponse?: ValidateResponseFn<TResponse>;
  /**
   * 响应数据转换函数
   * 用于将原始响应数据转换为业务中使用的数据格式
   * 在 validateResponse 验证通过后执行
   * @example
   * // 全局配置：提取通用的 data 字段
   * transformResponse: (response) => response.data
   */
  transformResponse?: TransformResponseFn<TResponse, TResponse>;
  /**
   * 用来捕获 validateStatus 为 false 时进行错误处理的函数
   */
  onHttpError?: HttpErrorHandler<TResponse>;
  /**
   * 用来捕获 validateResponse 为 false 时进行错误处理的函数
   * 主要用来处理业务场景的错误
   */
  onBusinessError?: BusinessErrorHandler<TResponse>;
  /**
   * 用来捕获网络异常的错误处理函数
   * 主要用来处理无网络、跨域等报错问题
   */
  onNetworkError?: NetworkErrorHandler;
  /**
   * 重试配置
   */
  retry?: RetryConfig;
  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number;
  /**
   * 请求头配置
   * 可以是 HeadersInit、Record<string, string> 或返回这些类型的函数
   * 函数接收 { url, method } 作为参数，可用于动态生成请求头
   */
  headers?: HeadersConfig;
  /**
   * 请求模式
   * @default 'cors'
   */
  mode?: RequestMode;
  /**
   * 凭证模式
   * @default 'include'
   */
  credentials?: CredentialsMode;
}

/**
 * 响应结果
 */
export interface FetchResponse<T = any> {
  /**
   * 响应数据
   */
  data: T;
  /**
   * HTTP 状态码
   */
  status: number;
  /**
   * 状态文本
   */
  statusText: string;
  /**
   * 响应头
   */
  headers: Headers;
  /**
   * 原始 Response 对象
   */
  response: Response;
}

/**
 * 错误结果
 */
export interface FetchError<T = any> {
  /**
   * 错误信息
   */
  message: string;
  /**
   * 错误类型
   */
  type: 'http' | 'business' | 'network' | 'timeout';
  /**
   * HTTP 状态码（如果是 HTTP 错误）
   */
  status?: number;
  /**
   * 响应数据（如果有）
   */
  response?: T;
  /**
   * 原始错误对象
   */
  error?: Error | TypeError | DOMException;
}

/**
 * 请求结果（支持链式调用和解构）
 * 数组格式：[data, error, success]
 * - data: 响应数据（成功时）
 * - error: 错误信息（失败时）
 * - success: 请求是否成功
 */
export type FetchResult<T = any> = [T | undefined, FetchError | undefined, boolean];

/**
 * 扩展 Promise，同时支持解构和链式调用
 */
export interface FetchResultPromise<T = any> extends Promise<FetchResult<T>> {
  /**
   * 成功回调（重载 Promise 的 then 方法）
   * @param callback 成功时的回调函数
   * @returns 返回自身，支持链式调用
   */
  then(callback: (data: T) => void): this;
  /**
   * 取消当前请求（触发 AbortController）
   */
  cancel(): void;
  
  /**
   * Promise 的 then 方法（保持兼容性）
   */
  then<TResult1 = FetchResult<T>, TResult2 = never>(
    onfulfilled?: ((value: FetchResult<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2>;
  
  /**
   * HTTP 验证错误回调
   * @param callback HTTP 验证错误时的回调函数（validateStatus 返回 false）
   * @returns 返回自身，支持链式调用
   */
  catchHttp(callback: (error: FetchError) => void): this;
  
  /**
   * 业务验证错误回调
   * @param callback 业务验证错误时的回调函数（validateResponse 返回 false）
   * @returns 返回自身，支持链式调用
   */
  catchBusiness(callback: (error: FetchError) => void): this;
  
  /**
   * 网络错误回调（网络错误、超时等）
   * @param callback 网络错误时的回调函数
   * @returns 返回自身，支持链式调用
   */
  catchNetwork(callback: (error: FetchError) => void): this;
  
  /**
   * Promise 的 catch 方法（保持兼容性）
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
  ): Promise<FetchResult<T> | TResult>;
}

/**
 * 主类接口
 */
export interface FetchInstance {
  /**
   * 发送请求
   * @param config 请求配置
   * @returns FetchResultPromise<TResponse> 支持链式调用和解构
   */
  request<TRequest = any, TResponse = any>(
    config: RequestConfig<TRequest, TResponse>
  ): FetchResultPromise<TResponse>;

  /**
   * 设置全局配置
   * @param config 全局配置
   */
  setGlobalConfig(config: GlobalConfig): void;

  /**
   * GET 请求（支持链式调用）
   * @param url 请求 URL
   * @param params 请求参数（会转换为 URL 查询参数）
   * @param config 请求配置（不包含 url、method 和 data）
   * @returns FetchResultPromise<TResponse> 支持链式调用和解构
   */
  sendGet<TRequest = any, TResponse = any>(
    url: string,
    params?: TRequest,
    config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<TResponse>;

  /**
   * POST 请求（支持链式调用）
   * 默认使用 JSON 格式发送数据
   * @param url 请求 URL
   * @param data 请求数据
   * @param config 请求配置（不包含 url、method 和 data）
   * @returns FetchResultPromise<TResponse> 支持链式调用和解构
   */
  sendPost<TRequest = any, TResponse = any>(
    url: string,
    data?: TRequest,
    config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<TResponse>;

  /**
   * POST 请求，使用 FormData 格式发送数据（支持文件上传）
   * @param url 请求 URL
   * @param data 请求数据（对象会自动转换为 FormData）
   * @param config 请求配置（不包含 url、method 和 data）
   * @returns FetchResultPromise<TResponse> 支持链式调用和解构
   */
  sendPostForm<TRequest = any, TResponse = any>(
    url: string,
    data?: TRequest,
    config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<TResponse>;

  /**
   * POST 请求，发送 Blob 数据
   * @param url 请求 URL
   * @param data 请求体（JSON/可序列化对象）
   * @param config 请求配置（不包含 url、method 和 data）
   * @returns FetchResultPromise<Blob> 支持链式调用和解构
   */
  sendPostBlob<TRequest = any>(
    url: string,
    data?: TRequest,
    config?: Omit<RequestConfig<TRequest, Blob>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<Blob>;

  /**
   * GET 请求，响应返回 Blob 数据（用于下载文件）
   * @param url 请求 URL
   * @param params 请求参数（会转换为 URL 查询参数）
   * @param config 请求配置（不包含 url、method 和 data）
   * @returns FetchResultPromise<Blob> 支持链式调用和解构
   */
  sendGetBlob<TRequest = any>(
    url: string,
    params?: TRequest,
    config?: Omit<RequestConfig<TRequest, Blob>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<Blob>;
}

/**
 * 创建实例的函数类型
 * @param globalConfig 全局配置（可选）
 * @returns FetchInstance
 */
export type CreateFetch = (globalConfig?: GlobalConfig) => FetchInstance;

/**
 * toAwaitFetch 类型
 * 既是工厂函数，也是默认实例（类似 axios）
 */
export type ToAwaitFetch = CreateFetch &
  Pick<
    FetchInstance,
    | 'sendGet'
    | 'sendPost'
    | 'sendPostForm'
    | 'sendPostBlob'
    | 'sendGetBlob'
    | 'setGlobalConfig'
  > & {
    /**
     * 创建新实例的便捷方法（默认实例上的别名）
     */
    create: CreateFetch;
    /**
     * 取消请求的便捷方法
     * 传入 FetchResultPromise 即可
     */
    cancel<T = any>(promise: FetchResultPromise<T>): void;
  };

/**
 * 默认导出：既是工厂函数，也是默认实例
 */
export default ToAwaitFetch;

