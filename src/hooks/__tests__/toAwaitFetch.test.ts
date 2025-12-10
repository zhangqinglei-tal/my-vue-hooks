import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import toAwaitFetch, { createInstance } from '../toAwaitFetch/toAwaitFetch'
import type { FetchResult } from '../toAwaitFetch/toAwaitFetch.api'

// Mock fetch
const mockFetch = vi.fn()
;(globalThis as any).fetch = mockFetch

describe('toAwaitFetch', () => {
  const mockResponse = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基础请求', () => {
    it('应该成功发送 GET 请求（使用默认实例）', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const [data, error, success] = await toAwaitFetch.sendGet('/api/users')

      expect(success).toBe(true)
      expect(data).toEqual(mockResponse)
      expect(error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('应该成功发送 GET 请求（使用新实例）', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users')

      expect(success).toBe(true)
      expect(data).toEqual(mockResponse)
      expect(error).toBeUndefined()
    })

    it('应该支持作为函数调用（类似 axios(config)）', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const [data, error, success] = await toAwaitFetch({
        url: '/api/users',
        method: 'GET'
      })

      expect(success).toBe(true)
      expect(data).toEqual(mockResponse)
      expect(error).toBeUndefined()
    })

    it('应该成功发送 POST 请求（使用默认实例）', async () => {
      const postData = { name: 'New User', email: 'new@example.com' }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ ...mockResponse, ...postData }),
        headers: new Headers(),
      } as Response)

      const [data, error, success] = await toAwaitFetch.sendPost('/api/users', postData)

      expect(success).toBe(true)
      expect(data).toEqual({ ...mockResponse, ...postData })
      expect(error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      )
    })

    it('应该将 GET 请求的 data 转换为查询参数', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const params = { page: 1, limit: 10 }
      await toAwaitFetch.sendGet('/api/users', params)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users?page=1&limit=10'),
        expect.any(Object)
      )
    })

    it('应该支持自定义请求方法', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      await fetchInstance.request({
        url: '/api/users/1',
        method: 'PUT',
        data: { name: 'Updated User' },
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })
  })

  describe('全局配置', () => {
    it('应该应用全局 baseURL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance({
        baseURL: 'https://api.example.com',
      })
      await fetchInstance.sendGet('/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      )
    })

    it('应该合并全局和请求配置', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance({
        headers: { 'X-Global-Header': 'global-value' },
      })
      await fetchInstance.sendGet('/users', undefined, {
        headers: { 'X-Request-Header': 'request-value' },
      })

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('X-Global-Header')).toBe('global-value')
      expect(headers.get('X-Request-Header')).toBe('request-value')
    })

    it('应该支持更新全局配置', async () => {
      const fetchInstance = createInstance()
      fetchInstance.setGlobalConfig({
        baseURL: 'https://api.example.com',
      })

      expect(fetchInstance.getGlobalConfig().baseURL).toBe('https://api.example.com')

      fetchInstance.mergeGlobalConfig({
        timeout: 5000,
      })

      const config = fetchInstance.getGlobalConfig()
      expect(config.baseURL).toBe('https://api.example.com')
      expect(config.timeout).toBe(5000)
    })
  })

  describe('错误处理', () => {
    it('应该处理 HTTP 错误', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' }),
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users/999')

      expect(success).toBe(false)
      expect(data).toBeUndefined()
      expect(error).toBeDefined()
      expect(error?.type).toBe('http')
      expect(error?.status).toBe(404)
    })

    it('应该处理业务错误', async () => {
      const businessErrorResponse = {
        code: 1001,
        message: 'Business validation failed',
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => businessErrorResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users', undefined, {
        validateResponse: (response) => response.code === 0, // 业务验证失败
      })

      expect(success).toBe(false)
      expect(error).toBeDefined()
      expect(error?.type).toBe('business')
      expect(error?.response).toEqual(businessErrorResponse)
    })

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users')

      expect(success).toBe(false)
      expect(data).toBeUndefined()
      expect(error).toBeDefined()
      expect(error?.type).toBe('network')
    })

    it('应该处理超时错误', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              statusText: 'OK',
              json: async () => mockResponse,
              headers: new Headers(),
            } as Response)
          }, 2000)
        })
      })

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users', undefined, {
        timeout: 1000,
      })

      // 等待超时
      await vi.runAllTimersAsync()

      expect(success).toBe(false)
      expect(error).toBeDefined()
      expect(error?.type).toBe('timeout')
    })

    it('应该调用错误处理钩子', async () => {
      const onHttpError = vi.fn()
      const onBusinessError = vi.fn()
      const onNetworkError = vi.fn()

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      await fetchInstance.sendGet('/api/users', undefined, {
        onHttpError,
        onBusinessError,
        onNetworkError,
      })

      expect(onHttpError).toHaveBeenCalled()
      expect(onBusinessError).not.toHaveBeenCalled()
      expect(onNetworkError).not.toHaveBeenCalled()
    })
  })

  describe('重试机制', () => {
    it('应该在网络错误时自动重试', async () => {
      let attemptCount = 0
      mockFetch.mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject(new TypeError('Network error'))
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => mockResponse,
          headers: new Headers(),
        } as Response)
      })

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users', undefined, {
        retry: {
          enabled: true,
          maxRetryCount: 3,
          delay: 100,
        },
      })

      // 等待重试完成
      await vi.runAllTimersAsync()

      expect(attemptCount).toBe(3)
      expect(success).toBe(true)
      expect(data).toEqual(mockResponse)
    })

    it('应该支持自定义重试判断函数', async () => {
      let attemptCount = 0
      const shouldRetry = vi.fn((attempt, error) => {
        return attempt <= 2 && error.message.includes('network')
      })

      mockFetch.mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject(new Error('network error'))
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => mockResponse,
          headers: new Headers(),
        } as Response)
      })

      const fetchInstance = createInstance()
      await fetchInstance.sendGet('/api/users', undefined, {
        retry: {
          enabled: true,
          maxRetryCount: 5,
          delay: 100,
          shouldRetry,
        },
      })

      await vi.runAllTimersAsync()

      expect(shouldRetry).toHaveBeenCalled()
      expect(attemptCount).toBeGreaterThan(1)
    })
  })

  describe('链式调用', () => {
    it('应该支持链式调用 then', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const thenCallback = vi.fn()

      await fetchInstance.sendGet('/api/users').then(thenCallback)

      expect(thenCallback).toHaveBeenCalledWith(mockResponse)
    })

    it('应该支持链式调用 catchHttp', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const catchHttpCallback = vi.fn()

      await fetchInstance.sendGet('/api/users/999').catchHttp(catchHttpCallback)

      expect(catchHttpCallback).toHaveBeenCalled()
      const error = catchHttpCallback.mock.calls[0][0]
      expect(error.type).toBe('http')
      expect(error.status).toBe(404)
    })

    it('应该支持链式调用 catchBusiness', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ code: 1001, message: 'Business error' }),
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const catchBusinessCallback = vi.fn()

      await fetchInstance.sendGet('/api/users', undefined, {
        validateResponse: () => false,
      }).catchBusiness(catchBusinessCallback)

      expect(catchBusinessCallback).toHaveBeenCalled()
      const error = catchBusinessCallback.mock.calls[0][0]
      expect(error.type).toBe('business')
    })

    it('应该支持链式调用 catch（网络错误）', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network error'))

      const fetchInstance = createInstance()
      const catchCallback = vi.fn()

      await fetchInstance.sendGet('/api/users').catchNetwork(catchCallback)

      expect(catchCallback).toHaveBeenCalled()
      const error = catchCallback.mock.calls[0][0]
      expect(error.type).toBe('network')
    })
  })

  describe('请求类型和响应类型', () => {
    it('应该支持 form 请求类型', async () => {
      const formData = { name: 'Test', file: new Blob(['test']) }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      await fetchInstance.sendPost('/api/upload', formData, {
        requestType: 'form',
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1].body).toBeInstanceOf(FormData)
    })

    it('应该支持 text 响应类型', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => 'Plain text response',
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data] = await fetchInstance.sendGet('/api/text', undefined, {
        responseType: 'text',
      })

      expect(data).toBe('Plain text response')
    })

    it('应该支持 blob 响应类型', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' })
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        blob: async () => blob,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data] = await fetchInstance.sendGet('/api/file', undefined, {
        responseType: 'blob',
      })

      expect(data).toBeInstanceOf(Blob)
    })
  })

  describe('请求头处理', () => {
    it('应该支持函数形式的请求头配置', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      await fetchInstance.sendGet('/api/users', undefined, {
        headers: ({ url, method }) => ({
          'X-URL': url,
          'X-Method': method || 'GET',
        }),
      })

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('X-URL')).toBe('/api/users')
      expect(headers.get('X-Method')).toBe('GET')
    })

    it('应该自动设置 JSON Content-Type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      await fetchInstance.sendPost('/api/users', { name: 'Test' })

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('应该为 form 类型移除 Content-Type（让浏览器自动设置）', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      await fetchInstance.sendPost('/api/upload', { file: new Blob(['test']) }, {
        requestType: 'form',
      })

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.has('Content-Type')).toBe(false)
    })
  })

  describe('自定义验证函数', () => {
    it('应该支持自定义 validateStatus', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 201,
        statusText: 'Created',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users', undefined, {
        validateStatus: (status) => status === 201, // 接受 201 状态码
      })

      expect(success).toBe(true)
      expect(data).toEqual(mockResponse)
      expect(error).toBeUndefined()
    })

    it('应该支持自定义 validateResponse', async () => {
      const response = { code: 0, data: mockResponse }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => response,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users', undefined, {
        validateResponse: (res) => res.code === 0,
      })

      expect(success).toBe(true)
      expect(data).toEqual(response)
    })
  })

  describe('解构使用', () => {
    it('应该支持解构方式使用', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const result = await fetchInstance.sendGet('/api/users')
      const [data, error, success] = result

      expect(success).toBe(true)
      expect(data).toEqual(mockResponse)
      expect(error).toBeUndefined()
    })

    it('应该支持在 async 函数中直接解构', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      
      async function fetchUser() {
        const [data, error, success] = await fetchInstance.sendGet('/api/users')
        return { data, error, success }
      }

      const result = await fetchUser()
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })
  })

  describe('边界情况', () => {
    it('应该处理完整 URL（不拼接 baseURL）', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance({
        baseURL: 'https://api.example.com',
      })
      await fetchInstance.sendGet('https://external-api.com/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.com/users',
        expect.any(Object)
      )
    })

    it('应该处理空响应体', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        json: async () => null,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      const [data, error, success] = await fetchInstance.sendGet('/api/users')

      expect(success).toBe(true)
      expect(data).toBeNull()
    })

    it('应该处理数组查询参数', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response)

      const fetchInstance = createInstance()
      await fetchInstance.sendGet('/api/users', { tags: ['tag1', 'tag2'] })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('tags=tag1&tags=tag2'),
        expect.any(Object)
      )
    })
  })
})

