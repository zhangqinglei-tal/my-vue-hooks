import { reactive, ref, watch, computed, unref, toRefs } from 'vue'
import type { Ref } from 'vue'
import { createPaginationState } from './utils'
import { mergeUseTableStaticOptions } from './defaultConfig'
import type {
  UseTableStaticOptions,
  UseTableReturn
} from './types'

/**
 * 处理静态数据的表格 Hook
 * @param options 静态数据配置选项
 * @returns 表格状态和操作方法
 * 
 * @example
 * ```ts
 * const allData = ref([...])
 * const { data, pagination, changePage } = useTableStatic({
 *   data: allData,
 *   filterFn: (item) => {
 *     return item.status === 'active'
 *   }
 * })
 * ```
 */
export function useTableStatic<
  T extends Record<string, any> = Record<string, any>
>(
  options: UseTableStaticOptions<T>
): UseTableReturn<T> {
 

  const mergedOptions = mergeUseTableStaticOptions(options as UseTableStaticOptions)

  const {
    data: sourceData,
    filterFn,
    pagination: paginationConfig
  } = mergedOptions
  
  // 使用 reactive 创建响应式状态对象（不包含方法）
  const state = reactive({
    data: [] as T[],
    loading: false,
    total: 0,
    pagination: createPaginationState(mergedOptions.pagination)
  } as {
    data: T[]
    loading: boolean
    total: number
    pagination: ReturnType<typeof createPaginationState>
  })
  
  // 保存原始分页配置，用于判断是否启用分页
  const isPaginationEnabled = mergedOptions.pagination !== false

  /**
   * 过滤数据
   */
  const filteredData = computed(() => {
    const sourceDataValue = unref(sourceData)

    // 如果没有过滤函数，直接返回原数据
    if (!filterFn) {
      return sourceDataValue
    }

    // 执行过滤
    return sourceDataValue.filter(item => filterFn(item))
  })

  /**
   * 计算分页后的数据
   */
  const paginatedData = computed(() => {
    const filtered = filteredData.value
    
    // 更新总数
    state.total = filtered.length
    state.pagination.total = filtered.length

    // 如果不启用分页，返回全部数据
    if (!isPaginationEnabled) {
      return filtered
    }

    // 计算分页
    const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
    const end = start + state.pagination.pageSize
    
    return filtered.slice(start, end)
  })

  /**
   * 刷新数据（重新计算）
   */
  const refresh = async () => {
    state.loading = true
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 0))
    ;(state.data as any) = paginatedData.value
    state.loading = false
  }

  /**
   * 重置并刷新（回到第一页）
   */
  const reset = async () => {
    state.pagination.currentPage = 1
    await refresh()
  }

  /**
   * 切换页码
   */
  const changePage = async (page: number) => {
    state.pagination.currentPage = page
    await refresh()
  }

  /**
   * 切换每页条数
   */
  const changePageSize = async (size: number) => {
    state.pagination.pageSize = size
    state.pagination.currentPage = 1 // 重置到第一页
    await refresh()
  }

  // 监听分页数据变化，自动更新 data
  watch(
    paginatedData,
    (newData) => {
      ;(state.data as any) = newData
    },
    { immediate: true }
  )

  // 监听源数据变化
  watch(
    () => unref(sourceData),
    () => {
      // 源数据变化时，如果当前页超出范围，重置到第一页
      const maxPage = Math.ceil(filteredData.value.length / state.pagination.pageSize)
      if (state.pagination.currentPage > maxPage && maxPage > 0) {
        state.pagination.currentPage = maxPage
      }
    },
    { deep: true }
  )

  // 使用 toRefs 转换响应式属性，确保解构时也能保持响应性
  // 方法直接返回，不需要 ref 包装
  return {
    ...toRefs(state),
    refresh,
    reset,
    changePage,
    changePageSize
  }
}

