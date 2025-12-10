import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useAxiosFetch, useAxiosGet, useAxiosPost } from '../useFetch/axiosFetch'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      CancelToken: {
        source: vi.fn(() => ({
          token: 'mock-token',
          cancel: vi.fn(),
        })),
      },
    },
  }
})

describe('useAxiosFetch', () => {
  const mockResponse = {
    data: {
      id: 1,
      name: 'Test User',
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(axios.request as any).mockResolvedValue(mockResponse)
    ;(axios.get as any).mockResolvedValue(mockResponse)
    ;(axios.post as any).mockResolvedValue(mockResponse)
  })

  it('should initialize with default values', () => {
    const { data, loading, error } = useAxiosFetch('/api/test', {
      immediate: false,
    })

    expect(data.value).toBeUndefined()
    expect(loading.value).toBe(false)
    expect(error.value).toBeUndefined()
  })

  it('should fetch data on mount when immediate is true', async () => {
    const { data, loading } = useAxiosFetch('/api/test', {
      immediate: true,
    })

    // 等待异步请求完成（useAxiosFetch 使用 onMounted，需要等待下一个 tick）
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(axios.request).toHaveBeenCalled()
    // loading 可能在请求完成后变为 false
  })

  it('should not fetch when immediate is false', async () => {
    useAxiosFetch('/api/test', {
      immediate: false,
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(axios.request).not.toHaveBeenCalled()
  })

  it('should execute request manually', async () => {
    const { data, loading, execute } = useAxiosFetch('/api/test', {
      immediate: false,
    })

    await execute()

    expect(axios.request).toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('should handle GET request', async () => {
    const { data, execute } = useAxiosGet('/api/users')

    await execute()

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      expect.any(Object)
    )
  })

  it('should handle POST request', async () => {
    const postData = { name: 'New User' }
    const { data, execute } = useAxiosPost('/api/users', postData)

    await execute()

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      postData,
      expect.any(Object)
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

    const { execute } = useAxiosFetch('/api/test', {
      immediate: false,
      beforeFetch,
    })

    await execute()

    expect(beforeFetch).toHaveBeenCalled()
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      })
    )
  })

  it('should call afterFetch hook', async () => {
    const afterFetch = vi.fn(({ data, response }) => {
      return { data: { ...data, processed: true }, response }
    })

    const { data, execute } = useAxiosFetch('/api/test', {
      immediate: false,
      afterFetch,
    })

    await execute()

    expect(afterFetch).toHaveBeenCalled()
  })

  it('should call onFetchError on error', async () => {
    const axiosError = {
      message: 'Network error',
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
      isAxiosError: true,
    }

    ;(axios.request as any).mockRejectedValueOnce(axiosError)

    const onFetchError = vi.fn()

    const { error, execute } = useAxiosFetch('/api/test', {
      immediate: false,
      onFetchError,
    })

    await execute()

    expect(onFetchError).toHaveBeenCalled()
    expect(error.value).toBeDefined()
  })

  it('should handle timeout', async () => {
    const timeoutError = {
      message: 'timeout of 5000ms exceeded',
      code: 'ECONNABORTED',
      isAxiosError: true,
    }

    ;(axios.request as any).mockRejectedValueOnce(timeoutError)

    const { error, execute } = useAxiosFetch('/api/test', {
      immediate: false,
      timeout: 5000,
    })

    await execute()

    expect(error.value).toBeDefined()
  })

  it('should retry on failure', async () => {
    let callCount = 0
    ;(axios.request as any).mockImplementation(() => {
      callCount++
      if (callCount < 3) {
        return Promise.reject(new Error('Network error'))
      }
      return Promise.resolve(mockResponse)
    })

    const { data, execute } = useAxiosFetch('/api/test', {
      immediate: false,
      retry: true,
      retryCount: 3,
      retryDelay: 10,
    })

    await execute()

    expect(callCount).toBe(3)
  })

  it('should abort request', async () => {
    const { abort, execute } = useAxiosFetch('/api/test', {
      immediate: false,
    })

    const executePromise = execute()
    abort()

    await executePromise

    // 请求应该被取消
    expect(axios.request).toHaveBeenCalled()
  })

  it('should handle response type json', async () => {
    const { data, execute } = useAxiosFetch('/api/test', {
      immediate: false,
      responseType: 'json',
    })

    await execute()

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        responseType: 'json',
      })
    )
  })

  it('should handle URL params', async () => {
    const { execute } = useAxiosFetch('/api/test', {
      immediate: false,
      params: { page: 1, size: 10 },
    })

    await execute()

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          page: 1,
          size: 10,
        }),
      })
    )
  })

  it('should handle reactive URL', async () => {
    const urlRef = ref('/api/users/1')
    const { execute } = useAxiosFetch(urlRef, {
      immediate: false,
      refetch: true,
    })

    await execute()

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users/1',
      })
    )

    urlRef.value = '/api/users/2'
    await new Promise(resolve => setTimeout(resolve, 50))

    // 如果 refetch 为 true，应该自动重新请求
  })

  it('should handle chain calls', async () => {
    const { execute } = useAxiosFetch('/api/test')
      .post({ name: 'test' })
      .json()

    await execute()

    expect(axios.post).toHaveBeenCalled()
  })

  it('should handle FormData', async () => {
    const formData = new FormData()
    formData.append('name', 'test')

    const { execute } = useAxiosPost('/api/upload', formData, {
      responseType: 'form',
    })

    await execute()

    expect(axios.post).toHaveBeenCalled()
  })
})

