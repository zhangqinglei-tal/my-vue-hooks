import { ref, shallowRef, watch, onMounted, onUnmounted, type MaybeRefOrGetter } from 'vue'
import type { AxiosRequestConfig, AxiosResponse, AxiosError, CancelTokenSource } from 'axios'
import axios from 'axios'
import type { UseAxiosFetchOptions, UseAxiosFetchReturn, DefaultFetchOptions } from './fetch.types'
import {
  toValue,
  deepMerge,
  createDefaultOptionsManager,
  getRetryDelay,
  isTimeoutError,
  isNetworkError,
  isServerError,
  shouldRetry,
} from './fetchUtils'

/**
 * 全局默认配置管理器
 */
const defaultOptionsManager = createDefaultOptionsManager<any>()

/**
 * 设置全局默认配置
 * @template T 响应数据类型
 * @param options 默认配置选项，会与现有默认配置合并
 * @description 用于设置全局默认配置，所有通过 useAxiosFetch 发起的请求都会使用这些默认配置
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
 * 基于 axios 的 useFetch 实现
 * @param url 请求 URL，可以是字符串或响应式引用
 * @param fetchOptions 请求选项配置，会与全局默认配置合并
 * @returns UseAxiosFetchReturn 响应式请求对象
 */
export function useAxiosFetch<T = any>(
  url: MaybeRefOrGetter<string>,
  fetchOptions: UseAxiosFetchOptions<T> = {}
): UseAxiosFetchReturn<T> {
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
  const currentResponseType = ref<'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'form'>(initialResponseType)
  const currentHeaders = ref(initialHeaders)

  // 取消控制器
  let cancelTokenSource: CancelTokenSource | null = null
  const responseCallbacks: Array<(response: AxiosResponse<T>) => void | Promise<void>> = []
  const errorCallbacks: Array<(error: unknown) => void | Promise<void>> = []

  // 重试相关状态
  let currentRetryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  // 网络状态相关
  let isOffline = false
  let wasOfflineDuringRequest = false

  // 页面可见性相关
  let isVisible = typeof document !== 'undefined' ? !document.hidden : true
  let wasCancelledDueToBlur = false // 是否因为页面不可见而被取消


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
      console.log(`[useAxiosFetch Execute] ${isRetry ? `第 ${currentRetryCount + 1} 次重试` : '初始请求'}，当前重试计数：${currentRetryCount}，最大重试次数：${retryCount}`)
    }

    // 重置状态
    error.value = undefined
    aborted.value = false
    loading.value = true
    isFinished.value = false
    canAbort.value = true

    // 创建取消令牌
    cancelTokenSource = axios.CancelToken.source()

    // 检查网络状态
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      isOffline = true
      wasOfflineDuringRequest = true
      if (refetchOnReconnect) {
        // 等待网络恢复
        loading.value = false
        isFinished.value = true
        canAbort.value = false
        return { data: data.value, error: undefined }
      }
    } else {
      isOffline = false
      // 如果是重试，不清除 wasOfflineDuringRequest，保持状态
      if (!isRetry) {
        wasOfflineDuringRequest = false
      }
    }

    // 检查页面可见性
    if (typeof document !== 'undefined' && document.hidden) {
      isVisible = false
      if (cancelOnBlur && cancelTokenSource) {
        cancelTokenSource.cancel('Request cancelled due to page visibility')
        aborted.value = true
        loading.value = false
        isFinished.value = true
        canAbort.value = false
        wasCancelledDueToBlur = true // 标记为因不可见而取消
        return { data: data.value, error: undefined }
      }
    } else {
      isVisible = true
      // 如果不是重试，清除因不可见而取消的标记
      if (!isRetry) {
        wasCancelledDueToBlur = false
      }
    }

    try {
      // 获取 URL
      const requestUrl = toValue<string>(url)

      // 构建 axios 配置
      // 注意：axios 不支持 'form' 和 'document' 类型，需要转换为支持的类型
      let actualResponseType: AxiosRequestConfig['responseType']
      if (currentResponseType.value === 'form') {
        // form 类型使用 blob，后续会手动转换为 FormData
        actualResponseType = 'blob'
      } else if (currentResponseType.value === 'document') {
        // document 类型使用 text，后续会手动转换为 Document
        actualResponseType = 'text'
      } else {
        // 其他类型直接使用
        actualResponseType = currentResponseType.value as AxiosRequestConfig['responseType']
      }

      // 处理请求体数据和 Content-Type
      // 注意：responseType 是响应类型，用于指定如何解析响应数据
      // - 'form': 响应解析为 FormData
      // - 'blob': 响应解析为 Blob（用于文件下载等）
      // responseType 不影响请求的 Content-Type，请求的 Content-Type 由请求数据决定
      let finalHeaders = { ...currentHeaders.value }
      let finalData = currentData.value
      
      if (currentData.value instanceof FormData) {
        // FormData 情况：让 axios 自动设置 Content-Type（包括 boundary）
        // 手动设置会覆盖 axios 的自动设置，导致缺少 boundary，服务器无法正确解析
        // 无论 responseType 是 'form'、'blob' 还是其他，都使用相同的处理方式
        delete (finalHeaders as Record<string, string>)['Content-Type']
      } else if (currentResponseType.value === 'form' && currentData.value) {
        // 当 responseType 为 'form' 且数据不是 FormData 时，转换为 FormData
        // 这样请求会使用 multipart/form-data Content-Type
        const formData = new FormData()
        if (typeof currentData.value === 'object' && currentData.value !== null) {
          Object.entries(currentData.value).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              formData.append(key, value instanceof Blob || value instanceof File ? value : String(value))
            }
          })
        }
        finalData = formData
        // axios 会自动为 FormData 设置 multipart/form-data Content-Type（包括 boundary）
        delete (finalHeaders as Record<string, string>)['Content-Type']
      }
      // 其他情况（普通对象、字符串等）：使用默认的 Content-Type 或用户自定义的

      let axiosConfig: AxiosRequestConfig = {
        url: requestUrl,
        method: currentMethod.value,
        data: finalData,
        params: currentParams.value,
        responseType: actualResponseType,
        headers: finalHeaders,
        cancelToken: cancelTokenSource.token,
      }

      // 如果启用了重试且还未到达最后一次尝试，在配置中添加标记
      // 让拦截器在重试期间跳过错误提示，只在最后一次失败时显示
      // currentRetryCount < retryCount 表示还有重试机会，不显示错误
      if (retry && currentRetryCount < retryCount) {
        const configWithRetry = axiosConfig as AxiosRequestConfig & {
          __skipErrorMessage?: boolean
          __isRetryable?: boolean
          __currentRetryCount?: number
          __maxRetryCount?: number
        }
        configWithRetry.__skipErrorMessage = true
        configWithRetry.__isRetryable = true
        configWithRetry.__currentRetryCount = currentRetryCount
        configWithRetry.__maxRetryCount = retryCount
      }

      // 设置超时
      if (timeout) {
        axiosConfig.timeout = timeout
      }

      // beforeFetch 拦截器
      if (beforeFetch) {
        const beforeFetchResult = await beforeFetch({
          url: requestUrl,
          options: axiosConfig,
          cancel: () => {
            cancelTokenSource?.cancel('Request cancelled by beforeFetch')
          },
          customOptions,
        })

        if (beforeFetchResult) {
          if (beforeFetchResult.url) {
            axiosConfig.url = beforeFetchResult.url
          }
          if (beforeFetchResult.options) {
            axiosConfig = {
              ...axiosConfig,
              ...beforeFetchResult.options,
            }
          }
        }
      }

      // 检查是否已取消
      if (aborted.value) {
        return { data: data.value, error: undefined }
      }

      // 执行请求
      const response = await axios.request<T>(axiosConfig)

      // 调试信息：记录响应
      if (debug && retry) {
        console.log('[useAxiosFetch Response]', {
          hasResponse: !!response,
          status: response?.status,
          statusText: response?.statusText,
          responseType: typeof response,
          isVNode: response?.hasOwnProperty?.('close'), // ElMessage 返回值可能有 close 方法
        })
      }

      // 检查响应是否有效
      // 拦截器可能返回 FEMessage 的返回值（不是有效的 AxiosResponse）
      // 正常的 AxiosResponse 应该有 status、statusText、data、headers 等属性
      if (!response || typeof response !== 'object' || !('status' in response) || !('data' in response)) {
        // 响应对象无效，可能是拦截器返回的 FEMessage 的返回值
        throw new Error('Invalid response from interceptor')
      }

      // 检查是否已取消
      if (aborted.value) {
        return { data: data.value, error: undefined }
      }

      // 更新状态码
      statusCode.value = response.status

      // 处理响应数据
      let responseData = response.data

      // 根据 responseType 处理数据
      if (currentResponseType.value === 'json' && typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData)
        } catch (e) {
          // 解析失败，保持原样
        }
      } else if (currentResponseType.value === 'form') {
        // 将 blob 转换为 FormData
        // 注意：这需要响应是 multipart/form-data 格式
        if (responseData instanceof Blob) {
          try {
            // 使用 Response.formData() 方法解析
            const responseObj = new Response(responseData)
            responseData = (await responseObj.formData()) as T
          } catch (e) {
            // 如果解析失败，保持为 blob
            // 用户可能需要手动处理
          }
        }
      } else if (currentResponseType.value === 'document') {
        // 将 text 转换为 Document
        if (typeof responseData === 'string') {
          const parser = new DOMParser()
          responseData = parser.parseFromString(responseData, 'text/html') as T
        }
      }

      // afterFetch 拦截器
      if (afterFetch) {
        try {
          const afterFetchResult = await afterFetch({
            data: responseData as T,
            response,
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
      data.value = responseData as T

      // 执行响应回调
      for (const callback of responseCallbacks) {
        await callback(response)
      }

      isFinished.value = true
      loading.value = false
      canAbort.value = false

      return { data: data.value, error: undefined }
    } catch (err: any) {
      // 调试信息：记录错误捕获
      if (debug) {
        console.log('[useAxiosFetch Catch] 捕获到错误', {
          errorType: err?.constructor?.name,
          isAxiosError: axios.isAxiosError(err),
          isCancel: axios.isCancel(err),
          error: err,
        })
      }

      // 检查是否是取消错误
      if (axios.isCancel(err)) {
        aborted.value = true
        isFinished.value = true
        loading.value = false
        canAbort.value = false
        return { data: data.value, error: undefined }
      }

      // 提取错误信息
      const axiosError = err as AxiosError<T>
      const errorData = axiosError.response?.data ?? null
      const errorResponse = axiosError.response ?? null
      const errorObj = err instanceof Error ? err : new Error(err?.message || 'Request failed')

      // 判断是否应该重试
      const isCancelError = axios.isCancel(err)
      const willRetry = shouldRetry(err, retry, currentRetryCount, retryCount, isCancelError)
      
      // 调试信息：输出详细的错误调试信息
      if (debug) {
        const errorCode = (err as AxiosError<T> & { code?: string })?.code
        const errorMessage = err?.message || ''
        const hasResponse = !!(err as AxiosError<T>)?.response
        const responseStatus = (err as AxiosError<T>)?.response?.status
        const hasRequest = !!(err as AxiosError<T>)?.request
        console.log('[useAxiosFetch Error Debug]', {
          retry,
          canRetry: retry && currentRetryCount < retryCount,
          currentRetryCount,
          retryCount,
          errorCode,
          errorMessage: errorMessage.substring(0, 200),
          hasResponse,
          hasRequest,
          responseStatus,
          isTimeoutError: isTimeoutError(err),
          isNetworkError: isNetworkError(err),
          isServerError: isServerError(err),
          shouldRetry: willRetry,
          isRetry,
          isCancel: isCancelError,
          errorType: err?.constructor?.name,
          fullError: {
            code: errorCode,
            message: errorMessage,
            name: (err as AxiosError<T> & { name?: string })?.name,
            response: hasResponse ? { status: responseStatus } : null,
            request: hasRequest ? 'exists' : null,
          },
        })
      }

      // 如果可以重试，先递增重试计数，然后重试
      if (willRetry) {
        currentRetryCount++
        const delay = getRetryDelay(retryDelay, currentRetryCount)

        // 调试信息：记录重试操作
        if (debug && retry) {
          console.log(`[useAxiosFetch Retry] 准备进行第 ${currentRetryCount} 次重试（共 ${retryCount} 次），延迟 ${delay}ms`)
        }

        if (delay > 0) {
          retryTimer = setTimeout(() => {
            execute(true)
          }, delay)
        } else {
          await execute(true)
        }

        // 重试期间不更新错误状态和完成状态，保持请求中的状态
        return { data: data.value, error: undefined }
      }

      // 最后一次重试失败或不需要重试，设置错误状态并触发错误处理
      error.value = errorObj
      statusCode.value = errorResponse?.status ?? null

      // 错误拦截器
      if (onFetchError) {
        try {
          const onFetchErrorResult = await onFetchError({
            error: err,
            data: errorData as T,
            response: errorResponse,
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
    if (cancelTokenSource) {
      cancelTokenSource.cancel('Request aborted by user')
      cancelTokenSource = null
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
  const onFetchResponse = (callback: (response: AxiosResponse<T>) => void | Promise<void>): void => {
    responseCallbacks.push(callback)
  }

  /**
   * 错误钩子
   * @param callback 错误回调函数
   */
  const onFetchErrorHook = (callback: (error: unknown) => void | Promise<void>): void => {
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
  } as UseAxiosFetchReturn<T>

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
    if (cancelTokenSource && canAbort.value) {
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
      if (cancelTokenSource && canAbort.value) {
        // 取消正在进行的请求
        abort()
        wasCancelledDueToBlur = true // 标记为因不可见而取消
      }
    }

    // 页面从不可见变为可见
    if (!wasVisible && isVisible) {
      // 情况1：开启了 refetchOnFocus，始终重新发起请求
      // 情况2：之前因为不可见而取消了请求（wasCancelledDueToBlur），需要恢复请求
      if ((refetchOnFocus || wasCancelledDueToBlur) && !loading.value) {
        wasCancelledDueToBlur = false // 清除标记
        execute()
      }
    }
  }

  // 监听 URL 变化
  if (refetch) {
    watch(
      () => toValue<string>(url),
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
    if (cancelTokenSource && canAbort.value) {
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
 * @template T 响应数据类型
 * @param url 请求 URL，可以是字符串或响应式引用
 * @param params GET 请求的查询参数
 * @param options 请求选项配置
 * @param customOptions 自定义参数，用于传递给拦截器等外部调用
 * @returns UseAxiosFetchReturn 响应式请求对象
 */
export function useAxiosGet<T = any>(
  url: MaybeRefOrGetter<string>,
  params?: Record<string, any>,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'params' | 'customOptions'>,
  customOptions?: Record<string, any>
): UseAxiosFetchReturn<T> {
  const mergedOptions: UseAxiosFetchOptions<T> = {
    ...options,
    method: 'GET',
    params,
    customOptions,
  }

  return useAxiosFetch<T>(url, mergedOptions)
}

/**
 * POST 请求封装
 * @template T 响应数据类型
 * @param url 请求 URL，可以是字符串或响应式引用
 * @param data POST 请求的请求体数据
 * @param options 请求选项配置
 * @param customOptions 自定义参数，用于传递给拦截器等外部调用
 * @returns UseAxiosFetchReturn 响应式请求对象
 */
export function useAxiosPost<T = any>(
  url: MaybeRefOrGetter<string>,
  data?: any,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'data' | 'customOptions'>,
  customOptions?: Record<string, any>
): UseAxiosFetchReturn<T> {
  const mergedOptions: UseAxiosFetchOptions<T> = {
    ...options,
    method: 'POST',
    data,
    customOptions,
  }

  return useAxiosFetch<T>(url, mergedOptions)
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
 * const result = await useGetPromise('/api/data', { id: 1 })
 * if (result.error) {
 *   console.error(result.error)
 * } else {
 *   console.log(result.data)
 * }
 */
export async function useGetPromise<T = any>(
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
    const result = await useAxiosFetch<T>(url, mergedOptions).execute()
    if (result.error) {
      return { data: undefined, error: result.error }
    }
    return { data: result.data as T, error: undefined }
  } catch (err) {
    return { data: undefined, error: err instanceof Error ? err : new Error(String(err)) }
  }
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
 * const result = await usePostPromise('/api/data', { name: 'test' })
 * if (result.error) {
 *   console.error(result.error)
 * } else {
 *   console.log(result.data)
 * }
 */
export async function usePostPromise<T = any>(
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
    const result = await useAxiosFetch<T>(url, mergedOptions).execute()
    if (result.error) {
      return { data: undefined, error: result.error }
    }
    return { data: result.data as T, error: undefined }
  } catch (err) {
    return { data: undefined, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

// 重新导出类型
export type { UseAxiosFetchOptions, UseAxiosFetchReturn, DefaultFetchOptions } from './fetch.types'
