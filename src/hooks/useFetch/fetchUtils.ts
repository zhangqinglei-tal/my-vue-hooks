import type { Ref, MaybeRefOrGetter } from 'vue'
import { unref } from 'vue'
import type { AxiosError } from 'axios'
import type { DefaultFetchOptions } from './fetch.types'

/**
 * 工具函数：将 MaybeRefOrGetter 转换为值
 * @template T 值的类型
 * @param r 可能的值、ref 或 getter 函数
 * @returns 原始值
 * @description 
 * 统一处理可能是值、ref 或 getter 函数的参数
 * - 如果是函数，执行函数获取值
 * - 如果是 ref，解包获取值
 * - 否则直接返回值
 */
export function toValue<T>(r: MaybeRefOrGetter<T>): T {
  if (typeof r === 'function') {
    return (r as (() => T))()
  }
  return unref(r)
}

/**
 * 判断值是否为纯对象（Plain Object）
 * @param value 要检查的值
 * @returns 是否为纯对象
 * @description 
 * 纯对象是指通过对象字面量 {} 或 new Object() 创建的对象
 * 不包括数组、日期、正则表达式、文件、Blob、FormData 等特殊对象
 */
function isPlainObject(value: unknown): value is Record<string, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof File) &&
    !(value instanceof Blob) &&
    // 检查是否为 FormData（在不同环境中可能没有全局 FormData）
    (typeof FormData === 'undefined' || !(value instanceof FormData))
  )
}

/**
 * 深度合并配置对象
 * @template T 对象类型
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 * @description 
 * 深度合并两个对象，源对象的值会覆盖目标对象的值
 * - 对于纯对象，递归合并
 * - 对于其他类型（数组、日期等），直接替换
 * - undefined 值会被忽略
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    // 确保属性是对象自身的属性，而不是原型链上的
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue
    }
    
    const sourceValue = source[key]
    
    // 跳过 undefined 值
    if (sourceValue === undefined) {
      continue
    }
    
    const targetValue = result[key]
    
    // 如果源值和目标值都是纯对象，递归合并
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      // 否则直接使用源值替换目标值
      result[key] = sourceValue as any
    }
  }
  
  return result
}

/**
 * 创建全局默认配置管理器
 * @template T 响应数据类型
 * @returns 包含 set、get、reset 方法的配置管理器对象
 * @description 用于管理全局默认配置，每个 fetch 实现可以有自己的配置管理器实例
 */
export function createDefaultOptionsManager<T = any>() {
  let defaultOptions: DefaultFetchOptions<T> = {}

  return {
    /**
     * 设置全局默认配置
     * @param options 默认配置选项，会与现有默认配置合并
     * @description 用于设置全局默认配置，所有通过对应 fetch 实现发起的请求都会使用这些默认配置
     * @example
     * // 设置全局默认配置
     * manager.set({
     *   timeout: 5000,
     *   retry: true,
     *   retryCount: 3,
     *   headers: { 'X-Custom-Header': 'value' }
     * })
     * 
     * // 部分更新默认配置
     * manager.set({
     *   timeout: 10000
     * })
     */
    set(options: DefaultFetchOptions<T>): void {
      defaultOptions = deepMerge(defaultOptions, options)
    },

    /**
     * 获取全局默认配置
     * @returns 当前全局默认配置的副本
     * @description 返回当前全局默认配置的副本，修改返回值不会影响全局配置
     */
    get(): DefaultFetchOptions<T> {
      return { ...defaultOptions } as DefaultFetchOptions<T>
    },

    /**
     * 重置全局默认配置
     * @description 将全局默认配置重置为空对象
     */
    reset(): void {
      defaultOptions = {}
    },
  }
}

/**
 * 计算重试延迟时间
 * @param retryDelay 重试延迟配置，可以是数字或函数
 * @param attempt 当前重试次数（从1开始）
 * @returns 延迟时间（毫秒）
 */
export function getRetryDelay(
  retryDelay: number | ((retryCount: number) => number),
  attempt: number
): number {
  if (typeof retryDelay === 'function') {
    return retryDelay(attempt)
  }
  return retryDelay
}

/**
 * 合并 URL 参数到现有 URL
 * @param url 原始 URL
 * @param params 要合并的参数对象
 * @returns 包含参数的完整 URL
 * @description 
 * 将参数对象合并到 URL 的查询字符串中
 * - 如果参数值为 null 或 undefined，跳过该参数
 * - 如果参数值为数组，为每个元素添加相同的键
 * - 新参数会覆盖 URL 中已存在的同名参数
 * @example
 * mergeUrlParams('https://api.example.com/data?foo=1', { bar: 2, baz: [3, 4] })
 * // 返回: 'https://api.example.com/data?foo=1&bar=2&baz=3&baz=4'
 */
export function mergeUrlParams(url: string, params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return url
  }

  try {
    // 尝试使用 URL API 解析和合并参数
    // 对于相对路径，需要提供一个基础 URL
    const urlObj = url.startsWith('http') 
      ? new URL(url)
      : new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    
    // 添加或覆盖参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // 先删除已存在的同名参数
          urlObj.searchParams.delete(key)
          // 为数组中的每个元素添加参数
          value.forEach(item => {
            urlObj.searchParams.append(key, String(item))
          })
        } else {
          // 设置单个参数（会覆盖已存在的同名参数）
          urlObj.searchParams.set(key, String(value))
        }
      }
    })
    
    // 返回完整 URL 或相对路径
    return url.startsWith('http') 
      ? urlObj.toString() 
      : `${urlObj.pathname}${urlObj.search}${urlObj.hash}`
  } catch (error) {
    // URL 解析失败时，回退到简单的字符串拼接
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(item => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
        }
        return [`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`]
      })
      .join('&')
    
    if (!queryString) {
      return url
    }
    
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${queryString}`
  }
}

/**
 * 错误信息接口
 * @description 统一的错误对象接口，兼容 AxiosError 和 fetch 错误
 */
export interface ErrorInfo {
  /**
   * 错误代码（如 'ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK' 等）
   */
  code?: string
  /**
   * 错误消息
   */
  message?: string
  /**
   * 错误名称（如 'AxiosError', 'TypeError', 'AbortError' 等）
   */
  name?: string
  /**
   * 响应对象（如果请求到达服务器并收到响应）
   */
  response?: {
    /**
     * HTTP 状态码
     */
    status?: number
    /**
     * 响应数据
     */
    data?: any
    /**
     * 状态文本
     */
    statusText?: string
    /**
     * 响应头
     */
    headers?: any
  } | null
  /**
   * 请求对象（如果请求已发出）
   */
  request?: any
  /**
   * 请求配置（如果可用）
   */
  config?: any
  /**
   * HTTP 状态码（fetch 错误可能直接挂载在错误对象上）
   */
  status?: number
  /**
   * 状态文本（fetch 错误可能直接挂载在错误对象上）
   */
  statusText?: string
}

/**
 * 判断是否为超时错误
 * @param error 错误对象或错误信息
 * @returns 是否为超时错误
 */
export function isTimeoutError(error: ErrorInfo | any): boolean {
  const errorCode = error?.code
  const errorMessage = error?.message || ''
  const responseStatus = error?.response?.status
  const hasRequest = !!error?.request
  const hasResponse = !!error?.response

  return (
    errorCode === 'ECONNABORTED' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'TIMEOUT' ||
    errorCode === 'AbortError' ||
    responseStatus === 504 ||
    (errorMessage &&
      typeof errorMessage === 'string' &&
      (errorMessage.toLowerCase().indexOf('timeout') !== -1 ||
        errorMessage.toLowerCase().indexOf('超时') !== -1 ||
        errorMessage.toLowerCase().indexOf('gateway') !== -1)) ||
    (hasRequest && !hasResponse && errorCode !== 'ENOTFOUND' && errorCode !== 'ECONNREFUSED') ||
    (error?.name === 'AxiosError' && hasRequest && !hasResponse)
  )
}

/**
 * 判断是否为网络错误
 * @param error 错误对象或错误信息
 * @returns 是否为网络错误
 */
export function isNetworkError(error: ErrorInfo | any): boolean {
  const errorCode = error?.code
  const errorMessage = error?.message || ''
  const hasResponse = !!error?.response
  const hasRequest = !!error?.request
  const isTimeout = isTimeoutError(error)

  return (
    !hasResponse ||
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ECONNRESET' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ENETUNREACH' ||
    errorCode === 'ERR_NETWORK' ||
    errorCode === 'ERR_INTERNET_DISCONNECTED' ||
    (errorMessage &&
      typeof errorMessage === 'string' &&
      (errorMessage.toLowerCase().indexOf('network') !== -1 ||
        errorMessage.toLowerCase().indexOf('connection') !== -1 ||
        errorMessage.toLowerCase().indexOf('网络') !== -1 ||
        errorMessage.toLowerCase().indexOf('连接') !== -1 ||
        errorMessage.toLowerCase().indexOf('fetch') !== -1)) ||
    (hasRequest && !hasResponse && !isTimeout)
  )
}

/**
 * 判断是否为服务器错误
 * @param error 错误对象或错误信息
 * @returns 是否为服务器错误（5xx状态码）
 */
export function isServerError(error: ErrorInfo | any): boolean {
  const hasResponse = !!error?.response
  const responseStatus = error?.response?.status
  return hasResponse && responseStatus && responseStatus >= 500
}

/**
 * 判断是否应该重试请求
 * @param error 错误对象或错误信息
 * @param retry 是否启用重试
 * @param currentRetryCount 当前重试次数
 * @param retryCount 最大重试次数
 * @param isCancelError 是否为取消错误（需要外部判断，因为不同实现判断方式不同）
 * @returns 是否应该重试
 */
export function shouldRetry(
  error: ErrorInfo | any,
  retry: boolean,
  currentRetryCount: number,
  retryCount: number,
  isCancelError: boolean
): boolean {
  const canRetry = retry && currentRetryCount < retryCount
  const hasResponse = !!error?.response
  const hasRequest = !!error?.request

  return (
    canRetry &&
    !isCancelError &&
    (isTimeoutError(error) || isNetworkError(error) || isServerError(error) || (!hasResponse && hasRequest))
  )
}

