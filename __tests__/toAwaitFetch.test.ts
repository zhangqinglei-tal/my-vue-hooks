import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import toAwaitFetch, { cancel as cancelRequest, createInstance } from '../src/hooks/toAwaitFetch/toAwaitFetch'
import type { FetchError } from '../src/hooks/toAwaitFetch/toAwaitFetch.api'

const mockFetch = vi.fn()
;(globalThis as any).fetch = mockFetch

interface MockUser {
  id: number
  name: string
  email: string
}

const mockUser: MockUser = { id: 1, name: 'Test User', email: 'test@example.com' }

const createJsonResponse = <T>(
  data: T,
  status: number = 200,
  statusText: string = 'OK'
): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => data,
    headers: new Headers(),
  } as Response
}

const createTextResponse = (text: string, status: number = 200, statusText: string = 'OK'): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => text,
    headers: new Headers(),
  } as Response
}

const createBlobResponse = (blob: Blob, status: number = 200): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    blob: async () => blob,
    headers: new Headers(),
  } as Response
}

describe('toAwaitFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基础请求与实例模式', () => {
    it('使用默认实例发送 GET 请求', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const [data, error, success] = await toAwaitFetch.sendGet<undefined, MockUser>('/api/users')
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(init.method).toBe('GET')
    })

    it('createInstance 独立实例可用', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet<undefined, MockUser>('/api/users')
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
    })

    it('支持 axios 风格调用 toAwaitFetch(config)', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const [data, error, success] = await toAwaitFetch({
        url: '/api/users',
        method: 'GET',
      })
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
    })

    it('POST 默认使用 JSON 并序列化 body', async () => {
      const payload = { name: 'New User' }
      mockFetch.mockResolvedValue(createJsonResponse({ ...mockUser, ...payload }))
      const [data, error, success] = await toAwaitFetch.sendPost<typeof payload, MockUser>(
        '/api/users',
        payload
      )
      expect(success).toBe(true)
      expect(data?.name).toBe('New User')
      expect(error).toBeUndefined()
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(init.method).toBe('POST')
      expect(init.body).toBe(JSON.stringify(payload))
      const headers = init.headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('URL 处理', () => {
    it('相对路径拼接 baseURL，查询参数正确序列化', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance({ baseURL: 'https://api.example.com' })
      await fetchInstance.sendGet('/users', { page: 1, limit: 10 })
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://api.example.com/users?page=1&limit=10')
    })

    it('完整 URL 不拼接 baseURL', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance({ baseURL: 'https://api.example.com' })
      await fetchInstance.sendGet('https://external.com/users')
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://external.com/users')
    })

    it('数组查询参数序列化为逗号分隔', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance()
      await fetchInstance.sendGet('/users', { tags: ['a', 'b'] })
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('tags=a%2Cb')
    })
  })

  describe('配置合并与 headers', () => {
    it('全局与单次 headers 合并', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance({
        headers: { 'X-Global': 'g' },
      })
      await fetchInstance.sendGet('/users', undefined, {
        headers: { 'X-Request': 'r' },
      })
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      const headers = init.headers as Record<string, string>
      expect(headers['X-Global']).toBe('g')
      expect(headers['X-Request']).toBe('r')
    })

    it('headers 支持函数形式，包含 url 与 method', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance()
      await fetchInstance.sendPost('/users', { name: 't' }, {
        headers: ({ url, method }) => ({
          'X-URL': url,
          'X-Method': method || '',
        }),
      })
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      const headers = init.headers as Record<string, string>
      expect(headers['X-URL']).toBe('/users')
      expect(headers['X-Method']).toBe('POST')
    })

    it('form 类型不设置 Content-Type 由浏览器处理', async () => {
      mockFetch.mockResolvedValue(createJsonResponse({ success: true }))
      const fetchInstance = createInstance()
      await fetchInstance.sendPostForm('/upload', { file: new Blob(['test']) })
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(init.body).toBeInstanceOf(FormData)
      const headers = init.headers as Record<string, string>
      expect(headers['Content-Type']).toBeUndefined()
    })
  })

  describe('校验与转换', () => {
    it('支持自定义 validateStatus', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser, 201, 'Created'))
      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/users', undefined, {
        validateStatus: (status) => status === 201,
      })
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
    })

    it('validateResponse 不通过产生 business 错误', async () => {
      mockFetch.mockResolvedValue(createJsonResponse({ code: 1001, message: 'fail' }))
      const fetchInstance = createInstance()
      const [, error, success] = await fetchInstance
        .sendGet('/users', undefined, {
          validateResponse: (res) => res.code === 0,
        })
        .catchBusiness(() => {})
      expect(success).toBe(false)
      expect(error?.type).toBe('business')
      expect((error as FetchError).response).toEqual({ code: 1001, message: 'fail' })
    })

    it('全局 transformResponse 在校验后生效', async () => {
      const raw = { code: 0, data: mockUser }
      mockFetch.mockResolvedValue(createJsonResponse(raw))
      const fetchInstance = createInstance({
        validateResponse: (res: typeof raw) => res.code === 0,
        transformResponse: (res: typeof raw) => res.data,
      })
      const [data, error, success] = await fetchInstance.sendGet('/users')
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
    })
  })

  describe('错误处理与钩子', () => {
    it('HTTP 错误返回 http 类型与状态码', async () => {
      mockFetch.mockResolvedValue(createJsonResponse({ message: 'not found' }, 404, 'Not Found'))
      const fetchInstance = createInstance()
      const [, error, success] = await fetchInstance.sendGet('/users/404').catchHttp(() => {})
      expect(success).toBe(false)
      expect(error?.type).toBe('http')
      expect(error?.status).toBe(404)
    })

    it('网络错误类型 network', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
      const fetchInstance = createInstance()
      const [, error, success] = await fetchInstance.sendGet('/users').catchNetwork(() => {})
      expect(success).toBe(false)
      expect(error?.type).toBe('network')
    })

    it('超时错误类型 timeout', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(createJsonResponse(mockUser)), 2000)
        })
      })
      const fetchInstance = createInstance()
      const request = fetchInstance.sendGet('/users', undefined, { timeout: 1000 }).catchNetwork(() => {})
      await vi.advanceTimersByTimeAsync(1500)
      const [, error, success] = await request
      expect(success).toBe(false)
      expect(error?.type).toBe('timeout')
    })

    it('onHttpError 可被调用并支持 suppressError', async () => {
      const onHttpError = vi.fn(({ message }: Error, status: number, response: any, suppressError: () => void) => {
        suppressError()
        expect(message).toContain('HTTP Error')
        expect(status).toBe(500)
        expect(response).toEqual({ msg: 'server error' })
      })
      mockFetch.mockResolvedValue(createJsonResponse({ msg: 'server error' }, 500, 'Internal'))
      const fetchInstance = createInstance()
      const [, error, success] = await fetchInstance.sendGet('/users', undefined, { onHttpError })
      expect(success).toBe(false)
      expect(error?.type).toBe('http')
      expect(onHttpError).toHaveBeenCalledTimes(1)
    })

    it('onBusinessError 仅在业务校验失败时调用', async () => {
      const onBusinessError = vi.fn((err: Error, response: any, suppressError: () => void) => {
        suppressError()
        expect(err.message).toContain('Business')
        expect(response.code).toBe(1)
      })
      mockFetch.mockResolvedValue(createJsonResponse({ code: 1, data: {} }))
      const fetchInstance = createInstance()
      const [, error, success] = await fetchInstance.sendGet('/biz', undefined, {
        validateResponse: (res) => res.code === 0,
        onBusinessError,
      })
      expect(success).toBe(false)
      expect(error?.type).toBe('business')
      expect(onBusinessError).toHaveBeenCalledTimes(1)
    })

    it('onNetworkError 在网络异常时调用', async () => {
      const onNetworkError = vi.fn((err: Error, suppressError: () => void) => {
        expect(err.message).toContain('Network')
        suppressError()
      })
      mockFetch.mockRejectedValue(new TypeError('Network fail'))
      const fetchInstance = createInstance()
      const [, error, success] = await fetchInstance
        .sendGet('/network', undefined, { onNetworkError })
        .catchNetwork(() => {})
      expect(success).toBe(false)
      expect(error?.type).toBe('network')
      expect(onNetworkError).toHaveBeenCalledTimes(1)
    })
  })

  describe('重试机制', () => {
    it('网络错误按配置重试直到成功', async () => {
      let attempt = 0
      mockFetch.mockImplementation(() => {
        attempt += 1
        if (attempt < 3) {
          return Promise.reject(new TypeError('Network'))
        }
        return Promise.resolve(createJsonResponse(mockUser))
      })
      const fetchInstance = createInstance()
      const request = fetchInstance
        .sendGet('/retry', undefined, {
          retry: { enabled: true, maxRetryCount: 3, delay: 100 },
        })
        .catchNetwork(() => {})
      await vi.runAllTimersAsync()
      const [data, error, success] = await request
      expect(attempt).toBe(3)
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
    })

    it('shouldRetry 自定义逻辑控制重试', async () => {
      let attempt = 0
      const shouldRetry = vi.fn((count: number, fetchError: FetchError) => {
        expect(fetchError).toBeDefined()
        return count < 3
      })
      mockFetch.mockImplementation(() => {
        attempt += 1
        if (attempt < 3) {
          return Promise.reject(new Error('custom error'))
        }
        return Promise.resolve(createJsonResponse(mockUser))
      })
      const fetchInstance = createInstance()
      const request = fetchInstance
        .sendGet('/retry-custom', undefined, {
          retry: { enabled: true, maxRetryCount: 3, delay: 100, shouldRetry },
        })
        .catchNetwork(() => {})
      await vi.runAllTimersAsync()
      const [data, error, success] = await request
      expect(attempt).toBe(3)
      expect(shouldRetry).toHaveBeenCalled()
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
    })
  })

  describe('链式与解构', () => {
    it('then 回调仅在成功时得到数据', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance()
      const thenSpy = vi.fn((user: MockUser) => {})
      await fetchInstance.sendGet('/users').then(thenSpy)
      expect(thenSpy).toHaveBeenCalledWith(mockUser)
    })

    it('catchHttp 捕获 HTTP 错误', async () => {
      mockFetch.mockResolvedValue(createJsonResponse({ msg: '404' }, 404, 'Not Found'))
      const fetchInstance = createInstance()
      const httpSpy = vi.fn()
      await fetchInstance.sendGet('/users/404').catchHttp(httpSpy)
      const error = httpSpy.mock.calls[0][0] as FetchError
      expect(error.type).toBe('http')
      expect(error.status).toBe(404)
    })

    it('catchBusiness 捕获业务错误', async () => {
      mockFetch.mockResolvedValue(createJsonResponse({ code: 2, message: 'biz' }))
      const fetchInstance = createInstance()
      const bizSpy = vi.fn()
      await fetchInstance
        .sendGet('/biz', undefined, { validateResponse: () => false })
        .catchBusiness(bizSpy)
      const error = bizSpy.mock.calls[0][0] as FetchError
      expect(error.type).toBe('business')
    })

    it('catchNetwork 捕获网络错误', async () => {
      mockFetch.mockRejectedValue(new TypeError('offline'))
      const fetchInstance = createInstance()
      const netSpy = vi.fn()
      await fetchInstance.sendGet('/network').catchNetwork(netSpy)
      const error = netSpy.mock.calls[0][0] as FetchError
      expect(error.type).toBe('network')
    })

    it('解构返回 [data, error, success]', async () => {
      mockFetch.mockResolvedValue(createJsonResponse(mockUser))
      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/users')
      expect(success).toBe(true)
      expect(data).toEqual(mockUser)
      expect(error).toBeUndefined()
    })
  })

  describe('请求类型与响应类型', () => {
    it('responseType=text 使用 text() 解析', async () => {
      mockFetch.mockResolvedValue(createTextResponse('hello'))
      const fetchInstance = createInstance()
      const [data] = await fetchInstance.sendGet('/text', undefined, { responseType: 'text' })
      expect(data).toBe('hello')
    })

    it('responseType=blob 使用 blob() 解析', async () => {
      const blob = new Blob(['x'], { type: 'text/plain' })
      mockFetch.mockResolvedValue(createBlobResponse(blob))
      const fetchInstance = createInstance()
      const [data] = await fetchInstance.sendGet('/blob', undefined, { responseType: 'blob' })
      expect(data).toBeInstanceOf(Blob)
    })
  })

  describe('取消请求', () => {
    it('cancel 方法可以中断请求并返回 network 错误', async () => {
      mockFetch.mockImplementation((_url: string, init: RequestInit) => {
        return new Promise((resolve, reject) => {
          const signal = init.signal as AbortSignal
          if (signal) {
            signal.addEventListener(
              'abort',
              () => reject(new DOMException('Aborted', 'AbortError')),
              { once: true }
            )
          }
          setTimeout(() => resolve(createJsonResponse(mockUser)), 2000)
        })
      })
      const fetchInstance = createInstance()
      const request = fetchInstance.sendGet('/users', undefined, { timeout: 5000 }).catchNetwork(() => {})
      cancelRequest(request)
      await vi.runAllTimersAsync()
      const [, error, success] = await request
      expect(success).toBe(false)
      expect(error?.type).toBe('network')
    })
  })

  describe('全局配置读写', () => {
    it('setGlobalConfig 与 mergeGlobalConfig 生效', () => {
      const fetchInstance = createInstance()
      fetchInstance.setGlobalConfig({ baseURL: 'https://api.example.com', timeout: 1000 })
      expect(fetchInstance.getGlobalConfig().timeout).toBe(1000)
      fetchInstance.mergeGlobalConfig({ timeout: 2000, credentials: 'omit' })
      const config = fetchInstance.getGlobalConfig()
      expect(config.baseURL).toBe('https://api.example.com')
      expect(config.timeout).toBe(2000)
      expect(config.credentials).toBe('omit')
    })
  })
})
