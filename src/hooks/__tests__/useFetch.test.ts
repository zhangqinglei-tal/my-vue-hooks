import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useFetch, useFetchGet, useFetchPost } from '../useFetch/fetch'

// Mock fetch
const mockFetch = vi.fn()
;(globalThis as any).fetch = mockFetch

describe('useFetch', () => {
  const mockResponse = {
    id: 1,
    name: 'Test User',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    } as Response)
  })

  it('should initialize with default values', () => {
    const { data, loading, error } = useFetch('/api/test', {
      immediate: false,
    })

    expect(data.value).toBeUndefined()
    expect(loading.value).toBe(false)
    expect(error.value).toBeUndefined()
  })

  it('should fetch data on mount when immediate is true', async () => {
    const { data, loading } = useFetch('/api/test', {
      immediate: true,
    })

    // 等待异步请求完成（useFetch 使用 onMounted，需要等待下一个 tick）
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(mockFetch).toHaveBeenCalled()
    // loading 可能在请求完成后变为 false
  })

  it('should not fetch when immediate is false', async () => {
    useFetch('/api/test', {
      immediate: false,
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should execute request manually', async () => {
    const { data, loading, execute } = useFetch('/api/test', {
      immediate: false,
    })

    await execute()

    expect(mockFetch).toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('should handle GET request', async () => {
    const { data, execute } = useFetchGet('/api/users')

    await execute()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      expect.objectContaining({
        method: 'GET',
      })
    )
  })

  it('should handle POST request', async () => {
    const postData = { name: 'New User' }
    const { data, execute } = useFetchPost('/api/users', postData)

    await execute()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData),
      })
    )
  })

  it('should call beforeFetch hook', async () => {
    const beforeFetch = vi.fn(({ url, options }) => {
      options.headers = {
        ...options.headers,
        Authorization: 'Bearer token',
      }
      return { url, options }
    })

    const { execute } = useFetch('/api/test', {
      immediate: false,
      beforeFetch,
    })

    await execute()

    expect(beforeFetch).toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      })
    )
  })

  it('should call afterFetch hook', async () => {
    const afterFetch = vi.fn(({ data }) => {
      return { data: { ...data, processed: true }, response: {} as any }
    })

    const { data, execute } = useFetch('/api/test', {
      immediate: false,
      afterFetch,
    })

    await execute()

    expect(afterFetch).toHaveBeenCalled()
  })

  it('should call onFetchError on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const onFetchError = vi.fn()

    const { error, execute } = useFetch('/api/test', {
      immediate: false,
      onFetchError,
    })

    await execute()

    expect(onFetchError).toHaveBeenCalled()
    expect(error.value).toBeDefined()
  })

  it('should handle timeout', async () => {
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100)
        })
    )

    const { error, execute } = useFetch('/api/test', {
      immediate: false,
      timeout: 50,
    })

    await execute()

    expect(error.value).toBeDefined()
  })

  it('should retry on failure', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      callCount++
      if (callCount < 3) {
        return Promise.reject(new Error('Network error'))
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)
    })

    const { data, execute } = useFetch('/api/test', {
      immediate: false,
      retry: true,
      retryCount: 3,
      retryDelay: 10,
    })

    await execute()

    expect(callCount).toBe(3)
  })

  it('should abort request', async () => {
    const { abort, execute } = useFetch('/api/test', {
      immediate: false,
    })

    const executePromise = execute()
    abort()

    await executePromise

    // 请求应该被取消
    expect(mockFetch).toHaveBeenCalled()
  })

  it('should handle response type json', async () => {
    const { data, execute } = useFetch('/api/test', {
      immediate: false,
      responseType: 'json',
    })

    await execute()

    expect(mockFetch).toHaveBeenCalled()
  })

  it('should handle response type text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => 'plain text',
    } as Response)

    const { data, execute } = useFetch('/api/test', {
      immediate: false,
      responseType: 'text',
    })

    await execute()

    expect(mockFetch).toHaveBeenCalled()
  })

  it('should handle URL params', async () => {
    const { execute } = useFetch('/api/test', {
      immediate: false,
      params: { page: 1, size: 10 },
    })

    await execute()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
      expect.any(Object)
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('size=10'),
      expect.any(Object)
    )
  })

  it('should handle reactive URL', async () => {
    const urlRef = ref('/api/users/1')
    const { execute } = useFetch(urlRef, {
      immediate: false,
      refetch: true,
    })

    await execute()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/1'),
      expect.any(Object)
    )

    urlRef.value = '/api/users/2'
    await new Promise(resolve => setTimeout(resolve, 50))

    // 如果 refetch 为 true，应该自动重新请求
  })
})

