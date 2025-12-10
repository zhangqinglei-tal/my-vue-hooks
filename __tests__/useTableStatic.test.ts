import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useTableStatic } from '../useTable/useTableStatic'

interface User {
  id: number
  name: string
  age: number
  city: string
}

describe('useTableStatic', () => {
  const mockData: User[] = [
    { id: 1, name: '张三', age: 25, city: '北京' },
    { id: 2, name: '李四', age: 30, city: '上海' },
    { id: 3, name: '王五', age: 28, city: '北京' },
    { id: 4, name: '赵六', age: 35, city: '广州' },
    { id: 5, name: '钱七', age: 22, city: '上海' },
  ]

  beforeEach(() => {
    // 每个测试前重置
  })

  it('should initialize with data', async () => {
    const { data, total } = useTableStatic({
      data: mockData,
    })

    // 等待响应式更新
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(data.value.length).toBeGreaterThan(0)
    expect(total.value).toBe(mockData.length)
  })

  it('should paginate data correctly', async () => {
    const { data, pagination, total, changePage } = useTableStatic({
      data: mockData,
      pagination: {
        currentPage: 1,
        pageSize: 2,
      },
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(data.value.length).toBe(2)
    expect(total.value).toBe(5)
    expect(pagination.value.currentPage).toBe(1)

    // 切换到第二页
    await changePage(2)
    expect(data.value.length).toBe(2)
    expect(pagination.value.currentPage).toBe(2)

    // 切换到第三页
    await changePage(3)
    expect(data.value.length).toBe(1) // 最后一页只有一条数据
  })

  it('should filter data with custom filter function', async () => {
    const { data, total } = useTableStatic({
      data: mockData,
      filterFn: (item) => {
        return item.city === '北京'
      },
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(data.value.length).toBe(2) // 北京有2条数据
    expect(total.value).toBe(2)
    expect(data.value.every(item => item.city === '北京')).toBe(true)
  })

  it('should change page size', async () => {
    const { data, pagination, changePageSize } = useTableStatic({
      data: mockData,
      pagination: {
        currentPage: 1,
        pageSize: 2,
      },
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(data.value.length).toBe(2)

    // 改变每页条数
    await changePageSize(3)
    expect(pagination.value.pageSize).toBe(3)
    expect(pagination.value.currentPage).toBe(1) // 应该重置到第一页
    expect(data.value.length).toBe(3)
  })

  it('should refresh data', async () => {
    const dataRef = ref([...mockData])
    const { data, refresh } = useTableStatic({
      data: dataRef,
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const initialLength = data.value.length

    // 添加新数据
    dataRef.value.push({ id: 6, name: '孙八', age: 27, city: '深圳' })

    // 刷新
    await refresh()

    expect(data.value.length).toBeGreaterThan(initialLength)
  })

  it('should reset to first page', async () => {
    const { pagination, changePage, reset } = useTableStatic({
      data: mockData,
      pagination: {
        currentPage: 1,
        pageSize: 2,
      },
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    // 切换到第三页
    await changePage(3)
    expect(pagination.value.currentPage).toBe(3)

    // 重置
    await reset()
    expect(pagination.value.currentPage).toBe(1)
  })

  it('should work with ref data', async () => {
    const dataRef = ref([...mockData])
    const { data, total } = useTableStatic({
      data: dataRef,
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(data.value.length).toBeGreaterThan(0)
    expect(total.value).toBe(mockData.length)

    // 修改数据源
    dataRef.value = [{ id: 1, name: '新用户', age: 20, city: '北京' }]

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(total.value).toBe(1)
  })

  it('should handle empty data', async () => {
    const { data, total } = useTableStatic({
      data: [],
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(data.value.length).toBe(0)
    expect(total.value).toBe(0)
  })

  it('should work without pagination', async () => {
    const { data, total, pagination } = useTableStatic({
      data: mockData,
      pagination: false,
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(data.value.length).toBe(mockData.length)
    expect(total.value).toBe(mockData.length)
    expect(pagination.value).toBeDefined()
  })
})

