import { ref, shallowRef, watch, onMounted, onUnmounted, type MaybeRefOrGetter } from 'vue'
import type { UseAxiosFetchOptions, UseFetchReturn, DefaultFetchOptions, FetchResponse } from './fetch.types'
import {
  toValue,
  deepMerge,
  createDefaultOptionsManager,
  getRetryDelay,
  isTimeoutError,
  isNetworkError,
  isServerError,
  shouldRetry,
  mergeUrlParams,
} from './fetchUtils'


/**
 * 兼容 AxiosRequestConfig 的请求配置接口
 */
interface FetchRequestConfig extends RequestInit {
  url?: string
  params?: Record<string, any>
  data?: any
  timeout?: number
}

/**
 * 全局默认配置管理器
 */
const defaultOptionsManager = createDefaultOptionsManager<any>()

/**
 * 设置全局默认配置
 * @template T 响应数据类型
 * @param options 默认配置选项，会与现有默认配置合并
 * @description 用于设置全局默认配置，所有通过 useFetch 发起的请求都会使用这些默认配置
 * @example
 * // 设置全局默认配置
 * setDefaultFetchOptions({
 *   timeout: 5000,
 *   retry: true,
 *   retryCount: 3,
 *   headers: { 'X-Custom-Header': 'value' }
 * })
 * 
 * // 部分更新默认配置
 * setDefaultFetchOptions({
 *   timeout: 10000
 * })
 */
export function setDefaultFetchOptions<T = any>(options: DefaultFetchOptions<T>): void {
  defaultOptionsManager.set(options)
}

/**
 * 获取全局默认配置
 * @template T 响应数据类型
 * @returns 当前全局默认配置的副本
 * @description 返回当前全局默认配置的副本，修改返回值不会影响全局配置
 */
export function getDefaultFetchOptions<T = any>(): DefaultFetchOptions<T> {
  return defaultOptionsManager.get() as DefaultFetchOptions<T>
}

/**
 * 重置全局默认配置
 * @description 将全局默认配置重置为空对象
 */
export function resetDefaultFetchOptions(): void {
  defaultOptionsManager.reset()
}

/**
 * 将对象转换为查询字符串
 */
function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, String(item)))
      } else {
        queryParams.append(key, String(value))
      }
    }
  }
  return queryParams.toString()
}

/**
 * 将 URL 和参数组合成完整的 URL
 */
function buildUrl(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return url
  }

  const queryString = buildQueryString(params)
  if (!queryString) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${queryString}`
}

/**
 * 根据 responseType 解析响应数据
 */
async function parseResponse<T>(
  response: Response,
  responseType: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'form'
): Promise<T> {
  switch (responseType) {
    case 'json':
      try {
        return await response.json()
      } catch (e) {
        // 如果解析失败，尝试作为文本解析
        const text = await response.text()
        try {
          return JSON.parse(text) as T
        } catch {
          return text as T
        }
      }
    case 'text':
      return (await response.text()) as T
    case 'blob':
      return (await response.blob()) as T
    case 'arraybuffer':
      return (await response.arrayBuffer()) as T
    case 'document':
      // document 类型在浏览器中通常也是文本，然后解析为 DOM
      const text = await response.text()
      const parser = new DOMParser()
      return parser.parseFromString(text, 'text/html') as T
    case 'form':
      // form 类型将响应解析为 FormData
      return (await response.json()) as T
    default:
      return (await response.json()) as T
  }
}

/**
 * 创建超时 AbortController
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeout)
  return controller
}

/**
 * 基于原生 fetch API 的 useFetch 实现
 * @param url 请求 URL，可以是字符串或响应式引用
 * @param fetchOptions 请求选项配置
 * @returns UseFetchReturn 响应式请求对象
 */
export function useFetch<T = any>(
  url: MaybeRefOrGetter<string>,
  fetchOptions: UseAxiosFetchOptions<T> = {}
): UseFetchReturn<T> {
  // 合并默认配置和传入的配置，传入的配置优先级更高
  const mergedOptions = deepMerge(
    defaultOptionsManager.get() as UseAxiosFetchOptions<T>,
    fetchOptions
  ) as UseAxiosFetchOptions<T>
  const {
    immediate = true,
    refetch = false,
    timeout,
    beforeFetch,
    afterFetch,
    onFetchError,
    updateDataOnError = false,
    initialData,
    method: initialMethod = 'GET',
    data: initialDataPayload,
    params: initialParams,
    responseType: initialResponseType = 'json',
    headers: initialHeaders,
    retry = false,
    retryCount = 3,
    retryDelay = 0,
    refetchOnReconnect = false,
    refetchOnFocus = false,
    cancelOnBlur = false,
    customOptions,
    debug = false,
  } = mergedOptions

  // 状态管理
  const data = shallowRef<T | undefined>(initialData)
  const error = shallowRef<Error | undefined>()
  const loading = ref(false)
  const isFinished = ref(false)
  const statusCode = ref<number | null>(null)
  const canAbort = ref(false)
  const aborted = ref(false)

  // 链式调用状态
  const currentMethod = ref(initialMethod)
  const currentData = ref(initialDataPayload)
  const currentParams = ref(initialParams)
  const currentResponseType = ref<'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'form'>(initialResponseType as any)
  const currentHeaders = ref(initialHeaders)

  // 取消控制器
  let abortController: AbortController | null = null
  const responseCallbacks: Array<(response: FetchResponse<T>) => void | Promise<void>> = []
  const errorCallbacks: Array<(error: any) => void | Promise<void>> = []

  // 重试相关状态
  let currentRetryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  // 网络状态相关
  let isOffline = false
  let wasOfflineDuringRequest = false

  // 页面可见性相关
  let isVisible = typeof document !== 'undefined' ? !document.hidden : true
  let wasCancelledDueToBlur = false


  /**
   * 执行请求
   */
  const execute = async (isRetry = false): Promise<{ data: T | undefined; error: Error | undefined }> => {
    // 如果不是重试，重置重试计数
    if (!isRetry) {
      currentRetryCount = 0
    }

    // 调试信息：记录请求开始
    if (debug && retry) {
      console.log(`[useFetch Execute] ${isRetry ? `第 ${currentRetryCount + 1} 次重试` : '初始请求'}，当前重试计数：${currentRetryCount}，最大重试次数：${retryCount}`)
    }

    // 重置状态
    error.value = undefined
    aborted.value = false
    loading.value = true
    isFinished.value = false
    canAbort.value = true

    // 创建 AbortController
    abortController = new AbortController()

    // 检查网络状态
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      isOffline = true
      wasOfflineDuringRequest = true
      if (refetchOnReconnect) {
        loading.value = false
        isFinished.value = true
        canAbort.value = false
        return { data: data.value, error: undefined }
      }
    } else {
      isOffline = false
      if (!isRetry) {
        wasOfflineDuringRequest = false
      }
    }

    // 检查页面可见性
    if (typeof document !== 'undefined' && document.hidden) {
      isVisible = false
      if (cancelOnBlur && abortController) {
        abortController.abort()
        aborted.value = true
        loading.value = false
        isFinished.value = true
        canAbort.value = false
        wasCancelledDueToBlur = true
        return { data: data.value, error: undefined }
      }
    } else {
      isVisible = true
      if (!isRetry) {
        wasCancelledDueToBlur = false
      }
    }

    try {
      // 获取 URL
      let requestUrl = toValue(url)

      // 构建 fetch 配置
      let fetchConfig: FetchRequestConfig = {
        method: currentMethod.value,
        headers: {
          'Content-Type': 'application/json',
          ...currentHeaders.value,
        },
        signal: abortController.signal,
      }
      // 处理请求体数据和 Content-Type
      // 注意：responseType 是响应类型，用于指定如何解析响应数据
      // - 'form': 响应解析为 FormData
      // - 'blob': 响应解析为 Blob（用于文件下载等）
      // responseType 不影响请求的 Content-Type，请求的 Content-Type 由请求数据决定
      if (currentData.value && ['POST', 'PUT', 'PATCH'].includes(currentMethod.value)) {
        if (currentResponseType.value === 'form') {
          if (currentData.value instanceof FormData) {
            // FormData 情况：让浏览器自动设置 Content-Type（包括 boundary）
            // 手动设置会覆盖浏览器的自动设置，导致缺少 boundary，服务器无法正确解析
            // 无论 responseType 是 'form'、'blob' 还是其他，都使用相同的处理方式
            fetchConfig.body = currentData.value
            delete (fetchConfig.headers as Record<string, string>)['Content-Type']
          } else {
            const formData = new FormData()
            if (typeof currentData.value === 'object' && currentData.value !== null) {
              Object.entries(currentData.value).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                  formData.append(key, value instanceof Blob || value instanceof File ? value : String(value))
                }
              })
            }
            fetchConfig.body = formData
            delete (fetchConfig.headers as Record<string, string>)['Content-Type']
          }
          
        } else if (typeof currentData.value === 'string') {
          // 字符串数据：保持原样，不设置 Content-Type（或使用用户自定义的）
          fetchConfig.body = currentData.value
        } else {
          // 普通对象：序列化为 JSON，使用 application/json Content-Type
          fetchConfig.body = JSON.stringify(currentData.value)
          // 默认已经设置了 'Content-Type': 'application/json'
        }
      }

      // 处理 GET 请求的参数（拼接到 URL）
      // 注意：对于 GET/HEAD/DELETE 请求，参数应该拼接到 URL 上，而不是放在请求体中
      // 在 beforeFetch 之前先拼接一次，避免在 beforeFetch 中重复拼接
      let paramsAlreadyInUrl = false
      if (['GET', 'HEAD', 'DELETE'].includes(currentMethod.value) && currentParams.value) {
        requestUrl = buildUrl(requestUrl, currentParams.value)
        paramsAlreadyInUrl = true
      }

      // 如果启用了重试且还未到达最后一次尝试，在配置中添加标记
      if (retry && currentRetryCount < retryCount) {
        const configWithRetry = fetchConfig as any
        configWithRetry.__skipErrorMessage = true
        configWithRetry.__isRetryable = true
        configWithRetry.__currentRetryCount = currentRetryCount
        configWithRetry.__maxRetryCount = retryCount
      }

      // beforeFetch 拦截器（转换为兼容 AxiosRequestConfig 的格式）
      // 注意：对于 GET/HEAD/DELETE 请求，如果参数已经拼接到 URL 上，传递给 beforeFetch 的 params 应该为空
      // 这样可以避免 beforeFetch 返回的 params 导致重复拼接
      if (beforeFetch) {
        const axiosConfig = {
          url: requestUrl,
          method: currentMethod.value,
          data: fetchConfig.body,
          // 如果参数已经拼接到 URL 上，传递 undefined 而不是 params，避免重复
          params: paramsAlreadyInUrl ? undefined : currentParams.value,
          headers: fetchConfig.headers,
          timeout,
        } as any

        const beforeFetchResult = await beforeFetch({
          url: requestUrl,
          options: axiosConfig,
          cancel: () => {
            abortController?.abort()
          },
          customOptions,
        })

        if (beforeFetchResult) {
          if (beforeFetchResult.url) {
            requestUrl = beforeFetchResult.url
          }
          if (beforeFetchResult.options) {
            const options = beforeFetchResult.options as any
            if (options.method) {
              currentMethod.value = options.method
              fetchConfig.method = options.method
            }
            if (options.data !== undefined) {
              currentData.value = options.data
              if (options.data instanceof FormData) {
                // FormData 情况：让浏览器自动设置 Content-Type（包括 boundary）
                fetchConfig.body = options.data
                delete (fetchConfig.headers as Record<string, string>)['Content-Type']
              } else if (currentResponseType.value === 'form') {
                // 当 responseType 为 'form' 时，如果数据不是 FormData，将其转换为 FormData
                const formData = new FormData()
                if (typeof options.data === 'object' && options.data !== null) {
                  Object.entries(options.data).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                      formData.append(key, value instanceof Blob || value instanceof File ? value : String(value))
                    }
                  })
                }
                fetchConfig.body = formData
                delete (fetchConfig.headers as Record<string, string>)['Content-Type']
              } else if (typeof options.data === 'string') {
                fetchConfig.body = options.data
              } else {
                fetchConfig.body = JSON.stringify(options.data)
              }
            }
            if (options.params !== undefined) {
              // 如果 beforeFetch 返回了新的 params，需要处理
              if (['GET', 'HEAD', 'DELETE'].includes(currentMethod.value)) {
                // 对于 GET/HEAD/DELETE 请求，合并新参数到 URL
                if (paramsAlreadyInUrl) {
                  // 如果之前已经拼接过参数，移除查询字符串部分，只保留基础 URL
                  const baseUrl = requestUrl.split('?')[0]
                  requestUrl = mergeUrlParams(baseUrl, options.params)
                } else {
                  // 如果之前没有拼接过参数，直接合并
                  requestUrl = mergeUrlParams(requestUrl, options.params)
                  paramsAlreadyInUrl = true
                }
              }
              currentParams.value = options.params
            }
            if (options.headers) {
              fetchConfig.headers = { ...fetchConfig.headers, ...options.headers }
            }
            if (options.timeout) {
              // fetch 不支持直接设置 timeout，需要手动实现
            }
          }
        }
      }

      // 检查是否已取消
      if (aborted.value) {
        return { data: data.value, error: undefined }
      }

      // 创建超时控制器（如果设置了超时）
      let timeoutController: AbortController | null = null
      if (timeout) {
        timeoutController = createTimeoutController(timeout)
        // 合并两个 AbortController 的信号
        const originalAbort = abortController.abort.bind(abortController)
        abortController.abort = () => {
          originalAbort()
          timeoutController?.abort()
        }
        const timeoutAbort = timeoutController.abort.bind(timeoutController)
        timeoutController.abort = () => {
          timeoutAbort()
          originalAbort()
        }
        fetchConfig.signal = timeoutController.signal
      }

      // 执行请求
      const response = await fetch(requestUrl, fetchConfig)

      // 调试信息：记录响应
      if (debug && retry) {
        console.log('[useFetch Response]', {
          hasResponse: !!response,
          status: response.status,
          statusText: response.statusText,
        })
      }

      // 检查是否已取消
      if (aborted.value) {
        return { data: data.value, error: undefined }
      }

      // 检查响应状态
      if (!response.ok) {
        // 构建错误对象
        const errorText = await response.text()
        let errorData: any = null
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = errorText
        }

        const fetchError: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
        fetchError.response = {
          data: errorData,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }
        fetchError.status = response.status
        fetchError.statusText = response.statusText
        throw fetchError
      }

      // 更新状态码
      statusCode.value = response.status

      // 解析响应数据
      let responseData: T = await parseResponse<T>(response, currentResponseType.value)

      // 构建兼容 AxiosResponse 的响应对象
      const fetchResponse: FetchResponse<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }

      // afterFetch 拦截器
      if (afterFetch) {
        try {
          const afterFetchResult = await afterFetch({
            data: responseData,
            response: fetchResponse as any, // 转换为兼容 AxiosResponse
            customOptions,
          })

          // 统一处理 afterFetch 的结果类型
          if (afterFetchResult) {
            // afterFetch 如果返回的是 Error 实例，直接抛出错误
            if (afterFetchResult instanceof Error) {
              throw afterFetchResult
            }
            // afterFetch 返回的是 AfterFetchResult 对象（包含 data 和 response）
            else if (typeof afterFetchResult === 'object' && 'data' in afterFetchResult) {
              responseData = (afterFetchResult as any).data
            }
            // 其他返回值类型忽略，保持原数据不变
          }
        } catch (afterFetchError: unknown) {
          // afterFetch 返回 Promise.reject 或抛出错误，触发错误处理流程
          throw afterFetchError
        }
      }

      // 更新数据
      data.value = responseData

      // 执行响应回调
      for (const callback of responseCallbacks) {
        await callback(fetchResponse)
      }

      isFinished.value = true
      loading.value = false
      canAbort.value = false

      return { data: data.value, error: undefined }
    } catch (err: any) {
      // 调试信息：记录错误捕获
      if (debug) {
        console.log('[useFetch Catch] 捕获到错误', {
          errorType: err?.constructor?.name,
          isAbortError: err?.name === 'AbortError',
          error: err,
        })
      }

      // 检查是否是取消错误
      if (err?.name === 'AbortError' || err?.code === 'ERR_ABORTED') {
        aborted.value = true
        isFinished.value = true
        loading.value = false
        canAbort.value = false
        return { data: data.value, error: undefined }
      }

      // 提取错误信息
      const errorData = err?.response?.data ?? null
      const errorResponse = err?.response ?? null
      const errorObj = err instanceof Error ? err : new Error(err?.message || 'Request failed')

      // 判断是否应该重试
      const isCancelError = err?.name === 'AbortError' || err?.code === 'ERR_ABORTED'
      const willRetry = shouldRetry(err, retry, currentRetryCount, retryCount, isCancelError)

      // 调试信息：输出详细的错误调试信息
      if (debug) {
        const errorCode = err?.code
        const errorMessage = err?.message || ''
        const hasResponse = !!err?.response
        const responseStatus = err?.response?.status || err?.status
        console.log('[useFetch Error Debug]', {
          retry,
          canRetry: retry && currentRetryCount < retryCount,
          currentRetryCount,
          retryCount,
          errorCode,
          errorMessage: errorMessage.substring(0, 200),
          hasResponse,
          responseStatus,
          isTimeoutError: isTimeoutError(err),
          isNetworkError: isNetworkError(err),
          isServerError: isServerError(err),
          shouldRetry: willRetry,
          isRetry,
          isAbortError: isCancelError,
          errorType: err?.constructor?.name,
          fullError: {
            code: errorCode,
            message: errorMessage,
            name: err?.name,
            response: hasResponse ? { status: responseStatus } : null,
          },
        })
      }

      // 如果可以重试，先递增重试计数，然后重试
      if (willRetry) {
        currentRetryCount++
        const delay = getRetryDelay(retryDelay, currentRetryCount)

        // 调试信息：记录重试操作
        if (debug && retry) {
          console.log(`[useFetch Retry] 准备进行第 ${currentRetryCount} 次重试（共 ${retryCount} 次），延迟 ${delay}ms`)
        }

        if (delay > 0) {
          retryTimer = setTimeout(() => {
            execute(true)
          }, delay)
        } else {
          await execute(true)
        }

        return { data: data.value, error: undefined }
      }

      // 最后一次重试失败或不需要重试，设置错误状态并触发错误处理
      error.value = errorObj
      statusCode.value = err?.response?.status ?? err?.status ?? null

      // 错误拦截器
      if (onFetchError) {
        try {
          const onFetchErrorResult = await onFetchError({
            error: err,
            data: errorData as T,
            response: errorResponse as any,
            customOptions,
          })

          if (onFetchErrorResult) {
            if (onFetchErrorResult.error) {
              error.value = onFetchErrorResult.error instanceof Error ? onFetchErrorResult.error : new Error(String(onFetchErrorResult.error))
            }
            if (updateDataOnError && onFetchErrorResult.data !== undefined) {
              data.value = onFetchErrorResult.data
            }
          }
        } catch (e) {
          // 错误处理失败，保持原错误
        }
      }

      // 执行错误回调
      for (const callback of errorCallbacks) {
        await callback(err)
      }

      isFinished.value = true
      loading.value = false
      canAbort.value = false

      return { data: data.value, error: error.value }
    }
  }

  /**
   * 取消请求
   */
  const abort = (): void => {
    if (abortController) {
      abortController.abort()
      abortController = null
      aborted.value = true
      canAbort.value = false
      loading.value = false
      isFinished.value = true
    }

    // 清除重试定时器
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }

    // 重置重试计数
    currentRetryCount = 0
  }

  /**
   * 响应钩子
   */
  const onFetchResponse = (callback: (response: FetchResponse<T>) => void | Promise<void>): void => {
    responseCallbacks.push(callback)
  }

  /**
   * 错误钩子
   */
  const onFetchErrorHook = (callback: (error: any) => void | Promise<void>): void => {
    errorCallbacks.push(callback)
  }

  // 链式调用方法
  const chainReturn = {
    data,
    error,
    loading,
    isFinished,
    statusCode,
    canAbort,
    aborted,
    execute,
    abort,
    onFetchResponse,
    onFetchError: onFetchErrorHook,
    get: () => {
      currentMethod.value = 'GET'
      return chainReturn
    },
    post: (payload?: any) => {
      currentMethod.value = 'POST'
      if (payload !== undefined) {
        currentData.value = payload
      }
      return chainReturn
    },
    put: (payload?: any) => {
      currentMethod.value = 'PUT'
      if (payload !== undefined) {
        currentData.value = payload
      }
      return chainReturn
    },
    delete: () => {
      currentMethod.value = 'DELETE'
      return chainReturn
    },
    patch: (payload?: any) => {
      currentMethod.value = 'PATCH'
      if (payload !== undefined) {
        currentData.value = payload
      }
      return chainReturn
    },
    json: () => {
      currentResponseType.value = 'json'
      return chainReturn
    },
    text: () => {
      currentResponseType.value = 'text'
      return chainReturn
    },
    blob: () => {
      currentResponseType.value = 'blob'
      return chainReturn
    },
    arraybuffer: () => {
      currentResponseType.value = 'arraybuffer'
      return chainReturn
    },
    document: () => {
      currentResponseType.value = 'document'
      return chainReturn
    },
    form: () => {
      currentResponseType.value = 'form'
      return chainReturn
    },
  } as UseFetchReturn<T>

  /**
   * 处理网络恢复事件
   */
  const handleOnline = (): void => {
    isOffline = false
    if (refetchOnReconnect && wasOfflineDuringRequest && !loading.value) {
      wasOfflineDuringRequest = false
      execute()
    }
  }

  /**
   * 处理网络断开事件
   */
  const handleOffline = (): void => {
    isOffline = true
    wasOfflineDuringRequest = true
    if (abortController && canAbort.value) {
      abort()
    }
  }

  /**
   * 处理页面可见性变化事件
   */
  const handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return

    const wasVisible = isVisible
    isVisible = !document.hidden

    // 页面从可见变为不可见
    if (wasVisible && !isVisible && cancelOnBlur) {
      if (abortController && canAbort.value) {
        abort()
        wasCancelledDueToBlur = true
      }
    }

    // 页面从不可见变为可见
    if (!wasVisible && isVisible) {
      if ((refetchOnFocus || wasCancelledDueToBlur) && !loading.value) {
        wasCancelledDueToBlur = false
        execute()
      }
    }
  }

  // 监听 URL 变化
  if (refetch) {
    watch(
      () => toValue(url),
      () => {
        if (immediate) {
          execute()
        }
      },
      { immediate: false }
    )
  }

  // 监听网络状态变化和页面可见性变化
  onMounted(() => {
    if (typeof window !== 'undefined') {
      if (refetchOnReconnect) {
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
      }

      if (refetchOnFocus || cancelOnBlur) {
        document.addEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      if (refetchOnReconnect) {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }

      if (refetchOnFocus || cancelOnBlur) {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    // 清理定时器
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }

    // 取消请求
    if (abortController && canAbort.value) {
      abort()
    }
  })

  // 立即执行
  if (immediate) {
    execute()
  }

  return chainReturn
}

/**
 * GET 请求封装
 */
export function useFetchGet<T = any>(
  url: MaybeRefOrGetter<string>,
  params?: Record<string, any>,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'params' | 'customOptions'>,
  customOptions?: Record<string, any>
): UseFetchReturn<T> {
  const mergedOptions: UseAxiosFetchOptions<T> = {
    ...options,
    method: 'GET',
    params,
    customOptions,
  }

  return useFetch<T>(url, mergedOptions)
}

/**
 * POST 请求封装
 */
export function useFetchPost<T = any>(
  url: MaybeRefOrGetter<string>,
  data?: any,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'data' | 'customOptions'>,
  customOptions?: Record<string, any>
): UseFetchReturn<T> {
  const mergedOptions: UseAxiosFetchOptions<T> = {
    ...options,
    method: 'POST',
    data,
    customOptions,
  }

  return useFetch<T>(url, mergedOptions)
}


/**
 * POST 请求的 Promise 版本
 * @template T 响应数据类型
 * @param url 请求 URL，可以是字符串或响应式引用
 * @param data POST 请求的请求体数据
 * @param options 请求选项配置
 * @param customOptions 自定义参数，用于传递给拦截器等外部调用
 * @returns Promise，resolve 时返回 { data, error: undefined } 或 { data: undefined, error }
 * @description 返回一个 Promise，不会自动执行请求，只执行一次
 * @example
 * const result = await useFetchPostPromise('/api/data', { name: 'test' })
 * if (result.error) {
 *   console.error(result.error)
 * } else {
 *   console.log(result.data)
 * }
 */
export async function useFetchPostPromise<T = any>(
  url: MaybeRefOrGetter<string>,
  data?: any,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'data' | 'customOptions'>,
  customOptions?: Record<string, any>
): Promise<{ data: T; error: undefined } | { data: undefined; error: Error }> {
  const mergedOptions: UseAxiosFetchOptions<T> = {
    ...options,
    method: 'POST',
    data,
    customOptions,
    immediate: false, // 确保不会自动执行，避免重复请求
  }

  try {
    const result = await useFetch<T>(url, mergedOptions).execute()
    if (result.error) {
      return { data: undefined, error: result.error }
    }
    return { data: result.data as T, error: undefined }
  } catch (err) {
    return { data: undefined, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * GET 请求的 Promise 版本
 * @template T 响应数据类型
 * @param url 请求 URL，可以是字符串或响应式引用
 * @param params GET 请求的查询参数
 * @param options 请求选项配置
 * @param customOptions 自定义参数，用于传递给拦截器等外部调用
 * @returns Promise，resolve 时返回 { data, error: undefined } 或 { data: undefined, error }
 * @description 返回一个 Promise，不会自动执行请求，只执行一次
 * @example
 * const result = await useFetchGetPromise('/api/data', { id: 1 })
 * if (result.error) {
 *   console.error(result.error)
 * } else {
 *   console.log(result.data)
 * }
 */
export async function useFetchGetPromise<T = any>(
  url: MaybeRefOrGetter<string>,
  params?: Record<string, any>,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'params' | 'customOptions'>,
  customOptions?: Record<string, any>
): Promise<{ data: T; error: undefined } | { data: undefined; error: Error }> {
  const mergedOptions: UseAxiosFetchOptions<T> = {
    ...options,
    method: 'GET',
    params,
    customOptions,
    immediate: false, // 确保不会自动执行，避免重复请求
  }

  try {
    const result = await useFetch<T>(url, mergedOptions).execute()
    if (result.error) {
      return { data: undefined, error: result.error }
    }
    return { data: result.data as T, error: undefined }
  } catch (err) {
    return { data: undefined, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

// 重新导出类型
export type { UseAxiosFetchOptions, UseFetchReturn, DefaultFetchOptions, FetchResponse } from './fetch.types'

