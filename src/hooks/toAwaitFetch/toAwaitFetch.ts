/**
 * toAwaitFetch 实现
 * Class 实现，参考 API 类型定义和生命周期图
 */

import type {
  FetchInstance,
  FetchResult,
  FetchResultPromise,
  FetchError,
  FetchResponse,
  RequestConfig,
  GlobalConfig,
  HeadersConfig,
  HttpMethod,
  RequestType,
  ResponseType,
  ValidateStatusFn,
  ValidateResponseFn,
  TransformResponseFn,
  HttpErrorHandler,
  BusinessErrorHandler,
  NetworkErrorHandler,
  RetryConfig,
  ShouldRetry,
  CreateFetch,
  ToAwaitFetch,
} from './toAwaitFetch.api';

/**
 * 内部请求配置（包含 requestType 和 responseType）
 * 仅供内部使用，不对外暴露
 */
interface InternalRequestConfig<TRequest = any, TResponse = any> extends RequestConfig<TRequest, TResponse> {
  /**
   * 请求数据类型（内部使用）
   * @default 'json'
   */
  requestType?: RequestType;
  /**
   * 响应数据类型（内部使用）
   * @default 'json'
   */
  responseType?: ResponseType;
  /**
   * 响应数据转换函数
   */
  transformResponse?: TransformResponseFn<TResponse, TResponse>;
}

/**
 * 内部全局配置（包含 requestType 和 responseType）
 * 仅供内部使用，不对外暴露
 */
interface InternalGlobalConfig<TResponse = any> extends GlobalConfig<TResponse> {
  /**
   * 请求数据类型（内部使用）
   * @default 'json'
   */
  requestType?: RequestType;
  /**
   * 响应数据类型（内部使用）
   * @default 'json'
   */
  responseType?: ResponseType;
  /**
   * 响应数据转换函数
   */
  transformResponse?: TransformResponseFn<TResponse, TResponse>;
}

/**
 * 判断是否为纯对象
 */
const isPlainObject = (value: unknown): value is Record<string, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof File) &&
    !(value instanceof Blob) &&
    (typeof FormData === 'undefined' || !(value instanceof FormData))
  );
};

/**
 * 深度合并配置对象
 */
const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target };
  
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }
    
    const sourceValue = source[key];
    if (sourceValue === undefined) {
      continue;
    }
    
    const targetValue = result[key];
    
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as any;
    }
  }
  
  return result;
};

/**
 * 默认验证状态码函数
 */
const defaultValidateStatus: ValidateStatusFn = (status: number) => {
  return status >= 200 && status < 300;
};

/**
 * 默认验证响应函数
 */
const defaultValidateResponse: ValidateResponseFn = () => {
  return true;
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof DOMException && error.name === 'AbortError';
};

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 处理请求头配置
 */
const processHeaders = (headersConfig: HeadersConfig | undefined, url: string, method?: HttpMethod): HeadersInit | Record<string, string> => {
  if (!headersConfig) {
    return {};
  }
  
  if (typeof headersConfig === 'function') {
    return headersConfig({ url, method });
  }
  
  return headersConfig;
};

/**
 * 处理请求数据
 */
const processRequestData = <TRequest = any>(
  data: TRequest | undefined,
  method: HttpMethod,
  requestType: RequestType
): { body?: BodyInit; urlParams?: string } => {
  if (!data) {
    return {};
  }
  
  // GET 请求：data 转为 URL 查询参数
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    if (isPlainObject(data)) {
      const params = new URLSearchParams();
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        }
      }
      return { urlParams: params.toString() };
    }
    return {};
  }
  
  // POST/PUT/PATCH/DELETE 请求：data 作为请求体
  if (requestType === 'form' && isPlainObject(data)) {
    // form 类型：对象转为 FormData
    const formData = new FormData();
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (value !== undefined && value !== null) {
          if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      }
    }
    return { body: formData };
  }
  
  if (requestType === 'json') {
    return { body: JSON.stringify(data) };
  }
  
  if (requestType === 'text') {
    return { body: String(data) };
  }
  
  if (requestType === 'blob' && data instanceof Blob) {
    return { body: data };
  }
  
  if (requestType === 'arraybuffer' && data instanceof ArrayBuffer) {
    return { body: data };
  }
  
  return { body: String(data) };
};

/**
 * 构建完整 URL
 */
const buildURL = (baseURL: string | undefined, url: string, urlParams?: string): string => {
  // 如果 url 已经是完整 URL（包含协议），直接使用
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (urlParams) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${urlParams}`;
    }
    return url;
  }
  
  let fullURL = url;
  
  if (baseURL) {
    // 确保 baseURL 不以 / 结尾，url 不以 / 开头
    const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const path = url.startsWith('/') ? url : `/${url}`;
    fullURL = `${base}${path}`;
  }
  
  if (urlParams) {
    const separator = fullURL.includes('?') ? '&' : '?';
    fullURL = `${fullURL}${separator}${urlParams}`;
  }
  
  return fullURL;
};

/**
 * 解析响应数据
 */
const parseResponse = async <T = any>(
  response: Response,
  responseType: ResponseType
): Promise<T> => {
  switch (responseType) {
    case 'json':
      return await response.json();
    case 'text':
      return await response.text() as any;
    case 'blob':
      return await response.blob() as any;
    case 'arraybuffer':
      return await response.arrayBuffer() as any;
    case 'formData':
      return await response.formData() as any;
    default:
      return await response.json();
  }
};

/**
 * 创建错误对象
 */
const createError = <T = any>(
  message: string,
  type: 'http' | 'business' | 'network' | 'timeout',
  status?: number,
  response?: T,
  error?: Error | TypeError | DOMException
): FetchError<T> => {
  return {
    message,
    type,
    status,
    response,
    error,
  };
};

/**
 * 将错误统一转换为 Error 类型
 * 用于传递给 onNetworkError 回调，简化类型处理
 * @param error 原始错误（可能是 Error、TypeError、DOMException 或其他类型）
 * @returns 标准化的 Error 对象
 */
const normalizeError = (error: Error | TypeError | DOMException | unknown): Error => {
  if (error instanceof Error) {
    // Error、TypeError、DOMException 都继承自 Error
    // 创建一个新的 Error 对象，保留消息、名称和堆栈信息
    const normalized = new Error(error.message);
    if (error.name) {
      normalized.name = error.name;
    }
    if (error.stack) {
      normalized.stack = error.stack;
    }
    return normalized;
  }
  // 如果不是 Error 类型，转换为 Error
  return new Error(String(error));
};

/**
 * 检查是否应该重试
 * @param retryConfig 重试配置
 * @param attempt 当前尝试次数（从1开始）
 * @param error 错误信息
 * @returns 是否应该继续重试
 * 
 * @example
 * maxRetryCount = 3 时：
 * - attempt = 1: 初始请求
 * - attempt = 2: 第1次重试 ✓
 * - attempt = 3: 第2次重试 ✓
 * - attempt = 4: 第3次重试 ✓
 * - attempt = 5: 停止（超过3次重试）✗
 */
const shouldRetryRequest = async (
  retryConfig: RetryConfig | undefined,
  attempt: number,
  error: FetchError
): Promise<boolean> => {
  if (!retryConfig?.enabled) {
    return false;
  }
  
  // 检查是否超过最大重试次数
  // attempt > maxRetryCount 时停止重试
  // 例如：maxRetryCount = 3，当 attempt = 5 时停止（已重试3次：attempt 2,3,4）
  if (attempt > (retryConfig.maxRetryCount ?? 3)) {
    return false;
  }
  
  // 如果提供了自定义重试判断函数，使用自定义逻辑
  if (retryConfig.shouldRetry) {
    return await retryConfig.shouldRetry(attempt, error);
  }
  
  // 默认重试逻辑：只有网络错误和超时错误才重试
  // HTTP 错误（4xx、5xx）和业务错误默认不重试
  return error.type === 'network' || error.type === 'timeout';
};

/**
 * 创建 FetchResultPromise
 * 使用 Proxy 和两次微任务检查来判断用户是否解构了 error
 */
const createFetchResultPromise = <T = any>(
  promise: Promise<FetchResult<T>>,
  cancel?: () => void
): FetchResultPromise<T> => {
  // 创建一个新对象，而不是直接修改原 promise
  const resultPromise = Object.create(promise) as any;
  
  // 标记错误是否已被处理（通过链式调用）
  let errorHandledByChain = false;
  // 标记错误是否被解构（通过 Proxy 检测）
  let errorDestructured = false;
  
  // 用于保存从 result 中读取的 errorSuppressed 标志
  let errorSuppressed = false;
  
  // 保存原始的 then 和 catch 方法
  const originalThen = promise.then.bind(promise);
  const originalCatch = promise.catch.bind(promise);
  
  // 使用 Proxy 包装 Promise 的 resolve 值，检测用户是否解构了 error
  const wrappedPromise = originalThen((result: FetchResult<T>) => {
    // 从 result 上读取 errorSuppressed 标志（在 executeRequest 中设置）
    errorSuppressed = (result as any).__errorSuppressed === true;
    // 移除临时标记，避免污染用户数据
    delete (result as any).__errorSuppressed;
    // 使用 Proxy 包装结果数组，检测是否访问了 error（索引1）或进行了解构
    const proxiedResult = new Proxy(result, {
      get(target, prop) {
        // 检测直接访问 error（索引1）
        if (prop === '1' || (typeof prop === 'number' && prop === 1)) {
          errorDestructured = true;
        }
        
        // 如果使用 Symbol.iterator（解构时会用到），标记为已解构
        if (prop === Symbol.iterator) {
          // 返回原始的迭代器，但在迭代时检测是否访问了 error
          const originalIterator = target[Symbol.iterator]();
          return function* () {
            let index = 0;
            for (const value of originalIterator) {
              if (index === 1) {
                errorDestructured = true;
              }
              yield value;
              index++;
            }
          };
        }
        
        return target[prop as keyof typeof target];
      }
    });
    
    // 排队微任务检查错误处理情况
    // 关键：立即返回 proxiedResult，让用户能够解构，解构会触发 Proxy
    // 然后在微任务中延迟检查
    const error = result[1];  // 直接从原始 result 获取，不触发 Proxy
    const success = result[2];
    
    if (!success && error && !errorSuppressed && !errorHandledByChain) {
      // 排队第一个微任务
      queueMicrotask(() => {
        // 排队第二个微任务，确保在用户解构之后再检查
        queueMicrotask(() => {
          if (!errorDestructured) {
            // 使用 setTimeout 延迟到下一个事件循环再次检查
            // 因为解构可能发生在微任务2和setTimeout之间
            // setTimeout(() => {
            //   // 再次检查！可能在微任务2之后用户才解构
              if (!errorDestructured && !errorHandledByChain && !errorSuppressed) {
                const unhandledError = new Error(
                  `Unhandled fetch error: ${error.message} (type: ${error.type})`
                );
                (unhandledError as any).fetchError = error;
                throw unhandledError;
              }
            // }, 0);
          }
        });
      });
    }
    
    return proxiedResult;
  });
  
  // 支持外部取消
  resultPromise.cancel = () => {
    if (cancel) cancel();
  };
  
  // 保存 wrappedPromise 的 then 方法，供链式调用使用
  // 这样所有方法都使用相同的 Proxy 包装数据源
  const wrappedThen = wrappedPromise.then.bind(wrappedPromise);
  
  // 重写 then 方法支持链式调用（使用 wrappedThen 而不是 originalThen）
  resultPromise.then = function(callback?: any, onrejected?: any) {
    // 如果只有一个参数且是函数，且参数数量为1，认为是简化的 then（只接收 data）
    if (callback && typeof callback === 'function' && !onrejected && callback.length === 1) {
      // 简化的 then，只接收 data（成功时调用）
      return createFetchResultPromise(
        wrappedThen((result) => {
          const success = result[2];
          const data = result[0];
          if (success && data !== undefined) {
            callback(data);
          }
          return result;
        }),
        cancel
      );
    }
    
    // 重要：不在 .then() 中标记 errorHandledByChain！
    // 原因：await 内部也会调用 .then(onSuccess, onError)，但这不代表用户主动处理了错误
    // 只有通过显式的错误处理方法（.catchNetwork()/.catchHttp()/.catchBusiness()）才标记为已处理
    // 如果用户没有解构 [data, error]，即使通过 await 获取了返回值，也应该抛出错误
    
    return wrappedThen(callback, onrejected);
  };
  
  // catchHttp 方法（使用 wrappedThen）
  resultPromise.catchHttp = function(callback: (error: FetchError) => void) {
    errorHandledByChain = true; // 标记错误已被处理
    
    // 创建一个标记了"已处理"的 Promise
    const chainedPromise = wrappedThen((result) => {
      const success = result[2];
      const error = result[1];
      if (!success && error && error.type === 'http') {
        callback(error);
      }
      // 标记这个结果的错误已被处理（如果有错误的话）
      if (!success && error) {
        (result as any).__errorSuppressed = true;
      }
      return result;
    });
    
    return createFetchResultPromise(chainedPromise, cancel);
  };
  
  // catchBusiness 方法（使用 wrappedThen）
  resultPromise.catchBusiness = function(callback: (error: FetchError) => void) {
    errorHandledByChain = true; // 标记错误已被处理
    
    // 创建一个标记了"已处理"的 Promise
    const chainedPromise = wrappedThen((result) => {
      const error = result[1];
      const success = result[2];
      if (!success && error && error.type === 'business') {
        callback(error);
      }
      // 标记这个结果的错误已被处理（如果有错误的话）
      if (!success && error) {
        (result as any).__errorSuppressed = true;
      }
      return result;
    });
    
    return createFetchResultPromise(chainedPromise, cancel);
  };
  
  // 重写 catchNetwork 方法（使用 wrappedThen）
  resultPromise.catchNetwork = function(callback?: any) {
    errorHandledByChain = true; // 标记错误已被处理
    if (callback && typeof callback === 'function') {
      // 简化的 catch，接收 error
      // 创建一个标记了"已处理"的 Promise
      const chainedPromise = wrappedThen((result) => {
        const error = result[1];
        const success = result[2];
        if (!success && error) {
          callback(error);
        }
        // 标记这个结果的错误已被处理（如果有错误的话）
        if (!success && error) {
          (result as any).__errorSuppressed = true;
        }
        return result;
      });

      return createFetchResultPromise(chainedPromise, cancel);
    }
    // 标准 Promise catch
    return originalCatch(callback);
  };
  
  return resultPromise;
};

/**
 * FetchInstance 实现类
 */
class FetchInstanceImpl implements FetchInstance {
  private globalConfig: InternalGlobalConfig = {};

  constructor(globalConfig?: GlobalConfig) {
    if (globalConfig) {
      this.globalConfig = { ...globalConfig };
    }
    
    // 绑定所有方法，确保解构导出时 this 正确指向实例
    this.request = this.request.bind(this);
    this.sendGet = this.sendGet.bind(this);
    this.sendPost = this.sendPost.bind(this);
    this.sendPostForm = this.sendPostForm.bind(this);
    this.sendPostBlob = this.sendPostBlob.bind(this);
    this.sendGetBlob = this.sendGetBlob.bind(this);
    this.setGlobalConfig = this.setGlobalConfig.bind(this);
    // this.getGlobalConfig = this.getGlobalConfig.bind(this);
    // this.mergeGlobalConfig = this.mergeGlobalConfig.bind(this);
  }

  /**
   * 执行请求（核心逻辑）
   */
  private async executeRequest<TRequest = any, TResponse = any>(
    config: InternalRequestConfig<TRequest, TResponse> & InternalGlobalConfig<TResponse>,
    controller: AbortController,
    attempt: number = 1
  ): Promise<FetchResult<TResponse>> {
    try {
      // 1. 合并配置（已在外部完成）
      const mergedConfig = config;
      const userSignal = mergedConfig.signal;
      
      if (userSignal) {
        if (userSignal.aborted) {
          controller.abort();
        } else {
          userSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      }
      
      // 2. 处理请求头
      const headers = processHeaders(mergedConfig.headers, mergedConfig.url, mergedConfig.method);
      
      // 3. 处理请求数据
      const { body, urlParams } = processRequestData(
        mergedConfig.data,
        mergedConfig.method || 'GET',
        mergedConfig.requestType || 'json'
      );
      
      // 4. 构建完整 URL
      const fullURL = buildURL(mergedConfig.baseURL, mergedConfig.url, urlParams);
      
      // 5. 检查超时配置并发送请求
      const timeout = mergedConfig.timeout;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let isTimeout = false;
      
      // 处理 headers：FormData 不应该手动设置 Content-Type
      let finalHeaders = headers;
      if (body && typeof body === 'string' && mergedConfig.requestType === 'json') {
        finalHeaders = { 'Content-Type': 'application/json', ...headers };
      } else if (body instanceof FormData) {
        // FormData 时，不设置 Content-Type，让浏览器自动设置（包含 boundary）
        finalHeaders = headers;
      }
      
      const fetchPromise = fetch(fullURL, {
        method: mergedConfig.method || 'GET',
        headers: finalHeaders,
        body,
        mode: (mergedConfig.mode === 'websocket' ? 'cors' : mergedConfig.mode) || 'cors',
        credentials: mergedConfig.credentials || 'include',
        signal: controller.signal,
      });
      
      let response: Response;
      
      if (timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            isTimeout = true;
            controller.abort();
            reject(createError('Request timeout', 'timeout'));
          }, timeout);
        });
        
        try {
          response = await Promise.race([fetchPromise, timeoutPromise]);
          if (timeoutId) clearTimeout(timeoutId);
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          if (isTimeout) {
            // 超时错误
            const timeoutError = createError('Request timeout', 'timeout');
            
            // 触发 onNetworkError（超时属于网络相关错误）
            let errorSuppressed = false;
            if (mergedConfig.onNetworkError) {
              const suppressError = () => {
                errorSuppressed = true;
              };
              
              await mergedConfig.onNetworkError(
                normalizeError(new Error(timeoutError.message)),
                suppressError
              );
            }
            
            // 检查重试
            if (await shouldRetryRequest(mergedConfig.retry, attempt, timeoutError)) {
              await delay(mergedConfig.retry?.delay || 1000);
              return this.executeRequest(mergedConfig, controller, attempt + 1);
            }
            
            // 返回结果，并在结果上标记错误是否被抑制
            const result: FetchResult<TResponse> = [undefined, timeoutError, false];
            (result as any).__errorSuppressed = errorSuppressed;
            return result;
          }
          throw error;
        }
      } else {
        response = await fetchPromise;
      }
      
      // 6. 解析响应数据
      const responseType = mergedConfig.responseType || 'json';
      let responseData: TResponse;
      
      try {
        responseData = await parseResponse<TResponse>(response, responseType);
      } catch (parseError) {
        const networkError = createError(
          'Failed to parse response',
          'network',
          response.status,
          undefined,
          parseError instanceof Error ? parseError : new Error(String(parseError))
        );
        
        // 触发 onNetworkError
        let errorSuppressed = false;
        if (mergedConfig.onNetworkError) {
          const suppressError = () => {
            errorSuppressed = true;
          };
          
          await mergedConfig.onNetworkError(
            normalizeError(networkError.error || new Error(networkError.message)),
            suppressError
          );
        }
        
        // 检查重试
        if (await shouldRetryRequest(mergedConfig.retry, attempt, networkError)) {
          await delay(mergedConfig.retry?.delay || 1000);
          return this.executeRequest(mergedConfig, controller, attempt + 1);
        }
        
        // 返回结果，并在结果上标记错误是否被抑制
        const result: FetchResult<TResponse> = [undefined, networkError, false];
        (result as any).__errorSuppressed = errorSuppressed;
        return result;
      }
      
      // 7. 验证状态码
      const validateStatus = mergedConfig.validateStatus || defaultValidateStatus;
      if (!validateStatus(response.status)) {
        const httpError = createError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          'http',
          response.status,
          responseData
        );
        
        // 触发 onHttpError
        let errorSuppressed = false;
        if (mergedConfig.onHttpError) {
          const suppressError = () => {
            errorSuppressed = true;
          };
          
          // 将 FetchError 转换为 Error 对象传递给处理器
          const errorObj = new Error(httpError.message);
          await mergedConfig.onHttpError(
            errorObj,
            response.status,
            responseData,
            suppressError
          );
        }
        
        // 检查重试
        if (await shouldRetryRequest(mergedConfig.retry, attempt, httpError)) {
          await delay(mergedConfig.retry?.delay || 1000);
          return this.executeRequest(mergedConfig, controller, attempt + 1);
        }
        
        // 返回结果，并在结果上标记错误是否被抑制
        const result: FetchResult<TResponse> = [undefined, httpError, false];
        // 在结果上标记错误是否被抑制（通过 suppressError 调用）
        (result as any).__errorSuppressed = errorSuppressed;
        return result;
      }
      
      // 8. 验证响应内容
      const validateResponse = mergedConfig.validateResponse || defaultValidateResponse;
      if (!validateResponse(responseData)) {
        const businessError = createError(
          'Business validation failed',
          'business',
          response.status,
          responseData
        );
        
        // 触发 onBusinessError
        let errorSuppressed = false;
        if (mergedConfig.onBusinessError) {
          const suppressError = () => {
            errorSuppressed = true;
          };
          
          // 将 FetchError 转换为 Error 对象传递给处理器
          const errorObj = new Error(businessError.message);
          await mergedConfig.onBusinessError(
            errorObj,
            responseData,
            suppressError
          );
        }
        
        // 检查重试
        if (await shouldRetryRequest(mergedConfig.retry, attempt, businessError)) {
          await delay(mergedConfig.retry?.delay || 1000);
          return this.executeRequest(mergedConfig, controller, attempt + 1);
        }
        
        // 返回结果，并在结果上标记错误是否被抑制
        const result: FetchResult<TResponse> = [undefined, businessError, false];
        (result as any).__errorSuppressed = errorSuppressed;
        return result;
      }
      
      // 9. 转换响应数据（如果配置了 transformResponse）
      let finalData = responseData;
      if (mergedConfig.transformResponse) {
        try {
          finalData = mergedConfig.transformResponse(responseData);
        } catch (transformError) {
          // 转换失败时，返回原始数据并记录警告
          console.warn('[toAwaitFetch] transformResponse error:', transformError);
        }
      }
      
      // 10. 请求成功
      return [finalData, undefined, true];
      
    } catch (error) {
      const aborted = isAbortError(error);
      // 网络错误处理
      const networkError = createError(
        aborted ? 'Request aborted' : (error instanceof Error ? error.message : 'Network error'),
        'network',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      
      // 触发 onNetworkError
      let errorSuppressed = false;
      if (config.onNetworkError) {
        const suppressError = () => {
          errorSuppressed = true;
        };
        
        await config.onNetworkError(
          normalizeError(networkError.error || new Error(networkError.message)),
          suppressError
        );
      }
      
      // 检查重试
      if (!aborted && (await shouldRetryRequest(config.retry, attempt, networkError))) {
        await delay(config.retry?.delay || 1000);
        return this.executeRequest(config, controller, attempt + 1);
      }
      
      // 返回结果，并在结果上标记错误是否被抑制
      const result: FetchResult<TResponse> = [undefined, networkError, false];
      (result as any).__errorSuppressed = errorSuppressed;
      return result;
    }
  }

  /**
   * 发送请求（内部可接收 requestType 和 responseType）
   */
  request<TRequest = any, TResponse = any>(
    config: RequestConfig<TRequest, TResponse> | InternalRequestConfig<TRequest, TResponse>
  ): FetchResultPromise<TResponse> {
    // 合并全局配置和请求配置
    const mergedConfig = deepMerge(
      { ...this.globalConfig } as any,
      config as any
    ) as InternalRequestConfig<TRequest, TResponse> & InternalGlobalConfig<TResponse>;
    
    // 直接使用 executeRequest 的结果
    // result 上已经标记了 __errorSuppressed（在 executeRequest 中设置）
    const controller = new AbortController();
    const promise = this.executeRequest(mergedConfig, controller);
    
    return createFetchResultPromise(promise as Promise<FetchResult<TResponse>>, () => controller.abort());
  }

  /**
   * 设置全局配置
   */
  setGlobalConfig(config: GlobalConfig): void {
    this.globalConfig = { ...config };
  }

  /**
   * 获取全局配置
   */
  getGlobalConfig(): GlobalConfig {
    return { ...this.globalConfig };
  }

  /**
   * 合并全局配置
   */
  mergeGlobalConfig(config: Partial<GlobalConfig>): void {
    this.globalConfig = deepMerge(this.globalConfig, config);
  }

  /**
   * GET 请求
   */
  sendGet<TRequest = any, TResponse = any>(
    url: string,
    params?: TRequest,
    config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<TResponse> {
    return this.request<TRequest, TResponse>({
      ...config,
      url,
      method: 'GET',
      data: params,
    });
  }

  /**
   * POST 请求（默认 JSON 格式）
   */
  sendPost<TRequest = any, TResponse = any>(
    url: string,
    data?: TRequest,
    config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<TResponse> {
    return this.request<TRequest, TResponse>({
      ...config,
      url,
      method: 'POST',
      data,
      requestType: 'json',
    } as any);
  }

  /**
   * POST 请求（FormData 格式，用于文件上传）
   */
  sendPostForm<TRequest = any, TResponse = any>(
    url: string,
    data?: TRequest,
    config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<TResponse> {
    return this.request<TRequest, TResponse>({
      ...config,
      url,
      method: 'POST',
      data,
      requestType: 'form',
    } as any);
  }

  /**
   * POST 请求（Blob 数据）
   */
  sendPostBlob<TRequest = any>(
    url: string,
    data?: TRequest,
    config?: Omit<RequestConfig<TRequest, Blob>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<Blob> {
    return this.request<TRequest, Blob>({
      ...config,
      url,
      method: 'POST',
      data,
      requestType: 'json',
      responseType: 'blob',
    } as any);
  }

  /**
   * GET 请求（Blob 响应，用于下载文件）
   */
  sendGetBlob<TRequest = any>(
    url: string,
    params?: TRequest,
    config?: Omit<RequestConfig<TRequest, Blob>, 'url' | 'method' | 'data'>
  ): FetchResultPromise<Blob> {
    return this.request<TRequest, Blob>({
      ...config,
      url,
      method: 'GET',
      data: params,
      responseType: 'blob',
    } as any);
  }
}

/**
 * 创建 toAwaitFetch 实例的工厂函数
 */
const createInstance: CreateFetch = (globalConfig?: GlobalConfig) => {
  return new FetchInstanceImpl(globalConfig);
};

/**
 * 创建默认实例（单例）
 */
const defaultInstance = new FetchInstanceImpl();

/**
 * 导出常用方法，方便直接使用：import { sendGet, sendPost } from '...'
 * 使用箭头函数直接调用实例方法，确保 this 正确绑定
 */
export const sendGet = <TRequest = any, TResponse = any>(
  url: string,
  params?: TRequest,
  config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
): FetchResultPromise<TResponse> => {
  return defaultInstance.request<TRequest, TResponse>({
    ...config,
    url,
    method: 'GET',
    data: params,
  });
};

export const sendPost = <TRequest = any, TResponse = any>(
  url: string,
  data?: TRequest,
  config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
): FetchResultPromise<TResponse> => {
  return defaultInstance.sendPost<TRequest, TResponse>(url, data, config);
};

export const sendPostForm = <TRequest = any, TResponse = any>(
  url: string,
  data?: TRequest,
  config?: Omit<RequestConfig<TRequest, TResponse>, 'url' | 'method' | 'data'>
): FetchResultPromise<TResponse> => {
  return defaultInstance.sendPostForm<TRequest, TResponse>(url, data, config);
};

export const sendPostBlob = <TRequest = any>(
  url: string,
  data?: TRequest,
  config?: Omit<RequestConfig<TRequest, Blob>, 'url' | 'method' | 'data'>
): FetchResultPromise<Blob> => {
  return defaultInstance.sendPostBlob<TRequest>(url, data, config);
};

export const sendGetBlob = <TRequest = any>(
  url: string,
  params?: TRequest,
  config?: Omit<RequestConfig<TRequest, Blob>, 'url' | 'method' | 'data'>
): FetchResultPromise<Blob> => {
  return defaultInstance.sendGetBlob<TRequest>(url, params, config);
};

export const setGlobalConfig = (config: GlobalConfig): void => {
  defaultInstance.setGlobalConfig(config);
};

export const cancel = <T = any>(promise: FetchResultPromise<T>): void => {
  promise?.cancel?.();
};

/**
 * 默认实例（既是工厂函数也是实例）
 * 支持 axios 风格调用：toAwaitFetch(config) 直接发起请求
 */
const toAwaitFetch = Object.assign(
  (config?: GlobalConfig | RequestConfig): FetchResultPromise | FetchInstance => {
    if (config && typeof config === 'object' && 'url' in config) {
      return defaultInstance.request(config as RequestConfig);
    }
    return createInstance(config as GlobalConfig);
  },
  {
    create: createInstance,
    sendGet: defaultInstance.sendGet.bind(defaultInstance),
    sendPost: defaultInstance.sendPost.bind(defaultInstance),
    sendPostForm: defaultInstance.sendPostForm.bind(defaultInstance),
    sendPostBlob: defaultInstance.sendPostBlob.bind(defaultInstance),
    sendGetBlob: defaultInstance.sendGetBlob.bind(defaultInstance),
    setGlobalConfig: defaultInstance.setGlobalConfig.bind(defaultInstance),
    // getGlobalConfig: defaultInstance.getGlobalConfig.bind(defaultInstance),
    // mergeGlobalConfig: defaultInstance.mergeGlobalConfig.bind(defaultInstance),
    cancel,
  }
) as ToAwaitFetch;

export { createInstance, FetchInstanceImpl };
export default toAwaitFetch;
