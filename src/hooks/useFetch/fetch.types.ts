import type { Ref } from 'vue'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * beforeFetch 拦截器的上下文参数
 */
export interface BeforeFetchContext {
  /**
   * 请求 URL
   */
  url: string
  /**
   * 请求配置选项
   */
  options: AxiosRequestConfig
  /**
   * 取消请求的函数
   */
  cancel: () => void
  /**
   * 自定义参数
   */
  customOptions?: Record<string, any>
}

/**
 * beforeFetch 拦截器的返回值
 */
export interface BeforeFetchResult {
  /**
   * 修改后的 URL（可选）
   */
  url?: string
  /**
   * 修改后的请求配置（可选）
   */
  options?: AxiosRequestConfig
}

/**
 * beforeFetch 拦截器函数类型
 * @template T 响应数据类型
 */
export type BeforeFetch<T = any> = (
  ctx: BeforeFetchContext
) => Promise<BeforeFetchResult | void> | BeforeFetchResult | void

/**
 * afterFetch 拦截器的上下文参数
 * @template T 响应数据类型
 */
export interface AfterFetchContext<T = any> {
  /**
   * 响应数据
   */
  data: T
  /**
   * 响应对象
   */
  response: AxiosResponse<T>
  /**
   * 自定义参数
   */
  customOptions?: Record<string, any>
}

/**
 * afterFetch 拦截器的返回值
 * @template T 响应数据类型
 */
export interface AfterFetchResult<T = any> {
  /**
   * 修改后的响应数据
   */
  data: T
  /**
   * 响应对象
   */
  response: AxiosResponse<T>
}

/**
 * afterFetch 拦截器的返回值类型
 * @template T 响应数据类型
 * @description 支持返回修改后的数据、错误对象或其 Promise 包装
 * - 可以直接返回 AfterFetchResult（包含 data 和 response）
 * - 可以返回 Error 实例以触发错误处理流程
 * - 可以返回 void 或 undefined 以保持原数据不变
 * - 也可以返回对应的 Promise 版本
 */
export type AfterFetchReturn<T = any> =
  | AfterFetchResult<T>
  | Error
  | void
  | undefined
  | Promise<AfterFetchResult<T>>
  | Promise<Error>
  | Promise<void>
  | Promise<undefined>

/**
 * afterFetch 拦截器函数类型
 * @template T 响应数据类型
 * @description 
 * - 返回修改后的数据：返回 AfterFetchResult<T> 对象（包含 data 和 response）
 * - 返回错误：返回 Error 实例，会触发错误处理流程
 * - 保持原数据不变：返回 void、undefined 或不返回任何值
 * - 触发错误处理：抛出错误或返回 Promise.reject
 * @example
 * // 正常返回修改后的数据
 * afterFetch: async ({ data, response }) => {
 *   const transformedData = transform(data)
 *   return { data: transformedData, response }
 * }
 * 
 * // 保持原数据不变
 * afterFetch: async ({ data, response }) => {
 *   console.log('Request completed:', data)
 *   // 不返回任何值，保持原数据不变
 * }
 * 
 * // 触发错误处理
 * afterFetch: async ({ data, response }) => {
 *   if (!data.isValid) {
 *     // 方式1: 抛出错误
 *     throw new Error('数据验证失败')
 *     // 方式2: 返回 Error 实例
 *     // return new Error('数据验证失败')
 *     // 方式3: 返回 Promise.reject
 *     // return Promise.reject(new Error('数据验证失败'))
 *   }
 *   return { data, response }
 * }
 */
export type AfterFetch<T = any> = (
  ctx: AfterFetchContext<T>
) => AfterFetchReturn<T>

/**
 * onFetchError 拦截器的上下文参数
 * @template T 响应数据类型
 */
export interface OnFetchErrorContext<T = any> {
  /**
   * 错误对象
   */
  error: any
  /**
   * 错误响应数据（如果有）
   */
  data: T | null
  /**
   * 错误响应对象（如果有）
   */
  response: AxiosResponse<T> | null
  /**
   * 自定义参数
   */
  customOptions?: Record<string, any>
}

/**
 * onFetchError 拦截器的返回值
 * @template T 响应数据类型
 */
export interface OnFetchErrorResultContext<T = any> {
  /**
   * 修改后的错误对象（可选）
   */
  error?: any
  /**
   * 错误时更新的数据（可选，需要配合 updateDataOnError 使用）
   */
  data?: T
}

export type OnFetchErrorResult<T = any> = OnFetchErrorResultContext<T> | Promise<OnFetchErrorResultContext<T>>

/**
 * onFetchError 拦截器函数类型
 * @template T 响应数据类型
 * @description 用于处理请求错误，可以修改错误信息或返回错误时的数据
 * @example
 * onFetchError: async ({ error, data, response }) => {
 *   // 修改错误信息
 *   return { error: new Error('自定义错误信息') }
 * }
 * 
 * // 返回错误时的数据（需要配合 updateDataOnError: true）
 * onFetchError: async ({ error, data, response }) => {
 *   return { data: fallbackData }
 * }
 */
export type OnFetchError<T = any> = (
  ctx: OnFetchErrorContext<T>
) => OnFetchErrorResult<T>

/**
 * useFetch 的选项配置接口
 * @template T 响应数据类型
 */
export interface UseAxiosFetchOptions<T = any> {
  /**
   * 是否立即执行请求
   * @default true
   */
  immediate?: boolean

  /**
   * 当 URL 变化时是否自动重新请求
   * @default false
   */
  refetch?: boolean

  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number

  /**
   * 请求前拦截器
   */
  beforeFetch?: BeforeFetch<T>

  /**
   * 请求后拦截器
   */
  afterFetch?: AfterFetch<T>

  /**
   * 错误拦截器
   */
  onFetchError?: OnFetchError<T>

  /**
   * 是否在错误时更新数据
   * @default false
   */
  updateDataOnError?: boolean

  /**
   * 初始化数据
   */
  initialData?: T

  /**
   * HTTP 方法
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

  /**
   * 请求体数据
   */
  data?: any

  /**
   * 请求参数
   */
  params?: any

  /**
   * 响应数据类型
   */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'form'

  /**
   * 请求头
   */
  headers?: Record<string, string>

  /**
   * 是否启用重试功能
   * @default false
   */
  retry?: boolean

  /**
   * 重试次数
   * @default 3
   */
  retryCount?: number

  /**
   * 重试延迟时间（毫秒），支持函数返回动态延迟
   * @default 0
   */
  retryDelay?: number | ((retryCount: number) => number)

  /**
   * 是否在网络恢复后自动重新请求
   * @default false
   */
  refetchOnReconnect?: boolean

  /**
   * 是否在页面可见时自动重新请求
   * @default false
   */
  refetchOnFocus?: boolean

  /**
   * 是否在页面不可见时取消当前请求
   * @default false
   */
  cancelOnBlur?: boolean

  /**
   * 自定义参数，用于传递给拦截器等外部调用
   */
  customOptions?: Record<string, any>

  /**
   * 是否启用调试模式，启用后会在控制台输出详细的请求和响应信息
   * @default false
   */
  debug?: boolean
}

/**
 * 默认配置选项类型
 * @template T 响应数据类型
 * @description 用于设置全局默认配置，所有字段都是可选的
 */
export type DefaultFetchOptions<T = any> = Partial<UseAxiosFetchOptions<T>>

/**
 * 兼容 AxiosResponse 的响应接口（用于原生 Fetch API）
 * @template T 响应数据类型
 */
export interface FetchResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
  config?: any
}

/**
 * 响应式 Fetch 返回值接口（用于原生 Fetch API）
 * @template T 响应数据类型
 */
export interface UseFetchReturn<T = any> {
  /**
   * 响应数据
   */
  data: Ref<T | undefined>

  /**
   * 错误信息
   */
  error: Ref<Error | undefined>

  /**
   * 是否正在请求
   */
  loading: Ref<boolean>

  /**
   * 是否已完成
   */
  isFinished: Ref<boolean>

  /**
   * HTTP 状态码
   */
  statusCode: Ref<number | null>

  /**
   * 是否可以取消请求
   */
  canAbort: Ref<boolean>

  /**
   * 是否已取消
   */
  aborted: Ref<boolean>

  /**
   * 执行请求的函数
   */
  execute: () => Promise<{ data: T | undefined; error: Error | undefined }>

  /**
   * 取消请求的函数
   */
  abort: () => void

  /**
   * 响应钩子
   * @param callback 响应回调函数，接收响应对象作为参数
   */
  onFetchResponse: (callback: (response: FetchResponse<T>) => void | Promise<void>) => void

  /**
   * 错误钩子
   * @param callback 错误回调函数
   */
  onFetchError: (callback: (error: unknown) => void | Promise<void>) => void

  /**
   * 设置 GET 方法
   */
  get: () => UseFetchReturn<T>

  /**
   * 设置 POST 方法
   */
  post: (data?: any) => UseFetchReturn<T>

  /**
   * 设置 PUT 方法
   */
  put: (data?: any) => UseFetchReturn<T>

  /**
   * 设置 DELETE 方法
   */
  delete: () => UseFetchReturn<T>

  /**
   * 设置 PATCH 方法
   */
  patch: (data?: any) => UseFetchReturn<T>

  /**
   * 设置响应类型为 JSON
   */
  json: () => UseFetchReturn<T>

  /**
   * 设置响应类型为文本
   */
  text: () => UseFetchReturn<T>

  /**
   * 设置响应类型为 Blob
   */
  blob: () => UseFetchReturn<T>

  /**
   * 设置响应类型为 ArrayBuffer
   */
  arraybuffer: () => UseFetchReturn<T>

  /**
   * 设置响应类型为 Document
   */
  document: () => UseFetchReturn<T>

  /**
   * 设置响应类型为 FormData
   */
  form: () => UseFetchReturn<T>
}

/**
 * 响应式 Fetch 返回值接口（用于 Axios）
 * @template T 响应数据类型
 */
export interface UseAxiosFetchReturn<T = any> {
  /**
   * 响应数据
   */
  data: Ref<T | undefined>

  /**
   * 错误信息
   */
  error: Ref<Error | undefined>

  /**
   * 是否正在请求
   */
  loading: Ref<boolean>

  /**
   * 是否已完成
   */
  isFinished: Ref<boolean>

  /**
   * HTTP 状态码
   */
  statusCode: Ref<number | null>

  /**
   * 是否可以取消请求
   */
  canAbort: Ref<boolean>

  /**
   * 是否已取消
   */
  aborted: Ref<boolean>

  /**
   * 执行请求的函数
   */
  execute: () => Promise<{ data: T | undefined; error: Error | undefined }>

  /**
   * 取消请求的函数
   */
  abort: () => void

  /**
   * 响应钩子
   * @param callback 响应回调函数，接收响应对象作为参数
   */
  onFetchResponse: (callback: (response: AxiosResponse<T>) => void | Promise<void>) => void

  /**
   * 错误钩子
   * @param callback 错误回调函数
   */
  onFetchError: (callback: (error: unknown) => void | Promise<void>) => void

  /**
   * 设置 GET 方法
   */
  get: () => UseAxiosFetchReturn<T>

  /**
   * 设置 POST 方法
   */
  post: (data?: any) => UseAxiosFetchReturn<T>

  /**
   * 设置 PUT 方法
   */
  put: (data?: any) => UseAxiosFetchReturn<T>

  /**
   * 设置 DELETE 方法
   */
  delete: () => UseAxiosFetchReturn<T>

  /**
   * 设置 PATCH 方法
   */
  patch: (data?: any) => UseAxiosFetchReturn<T>

  /**
   * 设置响应类型为 JSON
   */
  json: () => UseAxiosFetchReturn<T>

  /**
   * 设置响应类型为文本
   */
  text: () => UseAxiosFetchReturn<T>

  /**
   * 设置响应类型为 Blob
   */
  blob: () => UseAxiosFetchReturn<T>

  /**
   * 设置响应类型为 ArrayBuffer
   */
  arraybuffer: () => UseAxiosFetchReturn<T>

  /**
   * 设置响应类型为 Document
   */
  document: () => UseAxiosFetchReturn<T>

  /**
   * 设置响应类型为 FormData
   */
  form: () => UseAxiosFetchReturn<T>
}

