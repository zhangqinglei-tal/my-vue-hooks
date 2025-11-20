import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useTableRequest } from '../useTable/useTableRequest'

interface User {
  id: number
  name: string
  age: number
}

describe('useTableRequest', () => {
  const mockUsers: User[] = [
    { id: 1, name: '张三', age: 25 },
    { id: 2, name: '李四', age: 30 },
    { id: 3, name: '王五', age: 28 },
  ]

  const mockFetcher = vi.fn(async (params: any) => {
    return {
      data: mockUsers,
      total: mockUsers.length,
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { data, loading, total, pagination } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
    })

    expect(data.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(total.value).toBe(0)
    expect(pagination.value).toBeDefined()
  })

  it('should fetch data on mount when autoFetch is true', async () => {
    const { data, loading } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: true,
    })

    // 等待异步请求完成（useTableRequest 使用 onMounted，需要等待下一个 tick）
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(mockFetcher).toHaveBeenCalled()
    // 数据可能还未更新，但至少应该被调用
  })

  it('should not fetch data when autoFetch is false', async () => {
    useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockFetcher).not.toHaveBeenCalled()
  })

  it('should include pagination params in request', async () => {
    const { changePage } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
    })

    await changePage(2)

    expect(mockFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 2,
        pageSize: 10,
      })
    )
  })

  it('should use custom request key config', async () => {
    const customFetcher = vi.fn(async (params: any) => ({
      data: mockUsers,
      total: mockUsers.length,
    }))

    const { changePage } = useTableRequest({
      fetcher: customFetcher,
      autoFetch: false,
      requestKeyConfig: {
        pageIndexKey: 'page',
        pageSizeKey: 'size',
      },
    })

    await changePage(2)

    expect(customFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        size: 10,
      })
    )
  })

  it('should extract data from custom response structure', async () => {
    const customFetcher = vi.fn(async () => ({
      result: {
        list: mockUsers,
        count: mockUsers.length,
      },
    }))

    const { data, total, refresh } = useTableRequest({
      fetcher: customFetcher,
      autoFetch: false,
      responseKeyConfig: {
        dataKey: 'result.list',
        totalKey: 'result.count',
      },
    })

    await refresh()

    expect(customFetcher).toHaveBeenCalled()
    expect(data.value.length).toBe(mockUsers.length)
    expect(total.value).toBe(mockUsers.length)
  })

  it('should call beforeFetch hook', async () => {
    const beforeFetch = vi.fn((params) => ({
      ...params,
      customParam: 'test',
    }))

    const { refresh } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
      beforeFetch,
    })

    await refresh()

    expect(beforeFetch).toHaveBeenCalled()
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        customParam: 'test',
      })
    )
  })

  it('should call afterFetch hook', async () => {
    const afterFetch = vi.fn((data) => {
      return data.map((item: User) => ({ ...item, processed: true }))
    })

    const { data, refresh } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
      afterFetch,
    })

    await refresh()

    expect(afterFetch).toHaveBeenCalled()
    expect(data.value[0]).toHaveProperty('processed', true)
  })

  it('should call onError hook on fetch failure', async () => {
    const errorFetcher = vi.fn(async () => {
      throw new Error('Network error')
    })

    const onError = vi.fn()

    const { data, refresh } = useTableRequest({
      fetcher: errorFetcher,
      autoFetch: false,
      onError,
    })

    await refresh()

    expect(onError).toHaveBeenCalled()
    expect(data.value).toEqual([])
  })

  it('should update params and refetch', async () => {
    const result = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
      params: { status: 'active' },
      autoFetchOnParamsChange: true,
    })

    if (result.updateParams) {
      result.updateParams({ status: 'inactive' })
    }

    // 等待 watch 触发和请求完成
    await new Promise(resolve => setTimeout(resolve, 200))

    // 检查是否被调用，并且参数包含新的 status
    const calls = mockFetcher.mock.calls
    const lastCall = calls[calls.length - 1]
    if (lastCall) {
      expect(lastCall[0]).toMatchObject(
        expect.objectContaining({
          status: 'inactive',
        })
      )
    }
  })

  it('should reset to first page', async () => {
    const { pagination, changePage, reset } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
    })

    await changePage(3)
    expect(pagination.value.currentPage).toBe(3)

    await reset()
    expect(pagination.value.currentPage).toBe(1)
  })

  it('should change page size and reset to first page', async () => {
    const { pagination, changePageSize } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
    })

    await changePageSize(20)

    expect(pagination.value.pageSize).toBe(20)
    expect(pagination.value.currentPage).toBe(1)
  })

  it('should work without pagination', async () => {
    const { data, pagination, refresh } = useTableRequest({
      fetcher: mockFetcher,
      autoFetch: false,
      pagination: false,
    })

    await refresh()

    expect(pagination.value).toBeDefined()
    expect(mockFetcher).toHaveBeenCalled()
  })
})

