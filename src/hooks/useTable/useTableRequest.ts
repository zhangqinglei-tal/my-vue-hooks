import { reactive, ref, watch, onMounted, unref, toRefs } from 'vue'
import type { Ref } from 'vue'
import { getPropValue } from '../utils/utils'
import { createPaginationState } from './utils'
import { mergeUseTableRequestOptions } from './defaultConfig'
import type {
  UseTableRequestOptions,
  UseTableReturn,
  RequestKeyConfig,
  ResponseKeyConfig
} from './types'

/**
 * 处理请求接口的表格 Hook
 * @param options 请求配置选项
 * @returns 表格状态和操作方法
 * 
 * @example
 * ```ts
 * const { data, loading, pagination, refresh, changePage } = useTableRequest({
 *   fetcher: async (params) => {
 *     return await axios.post('/api/users', params)
 *   },
 *   params: { status: 'active' },
 *   requestKeyConfig: {
 *     pageIndexKey: 'page',
 *     pageSizeKey: 'size'
 *   },
 *   responseKeyConfig: {
 *     dataKey: 'list',
 *     totalKey: 'total'
 *   }
 * })
 * ```
 */
export function useTableRequest<T = any, P = any>(
  options: UseTableRequestOptions<T, P>
): UseTableReturn<T> {
  // 合并全局默认配置和用户配置
  const mergedOptions = mergeUseTableRequestOptions(options)
  
  const {
    fetcher,
    params,
    autoFetch = true,
    autoFetchOnParamsChange = true,
    pagination: paginationConfig,
    requestKeyConfig: requestKeyConfigOption,
    responseKeyConfig: responseKeyConfigOption,
    beforeFetch,
    afterFetch,
    onError
  } = mergedOptions

  // 请求参数映射配置
  const requestKeyConfig: Required<RequestKeyConfig> = {
    pageIndexKey: 'pageIndex',
    pageSizeKey: 'pageSize',
    ...requestKeyConfigOption
  }

  // 响应数据映射配置
  const responseKeyConfig: Required<Pick<ResponseKeyConfig, 'dataKey' | 'totalKey'>> & Pick<ResponseKeyConfig, 'pageIndexKey'> = {
    dataKey: 'data',
    totalKey: 'total',
    ...responseKeyConfigOption
  }

  // 使用 reactive 创建响应式状态对象（不包含方法）
  const state = reactive({
    data: [] as T[],
    loading: false,
    total: 0,
    pagination: createPaginationState(paginationConfig)
  } as {
    data: T[]
    loading: boolean
    total: number
    pagination: ReturnType<typeof createPaginationState>
  })
  
  // 保存原始分页配置，用于判断是否启用分页
  const isPaginationEnabled = paginationConfig !== false

  // 请求参数
  const requestParams = ref(params) as Ref<P>

  /**
   * 构建请求参数
   */
  const buildRequestParams = () => {
    const query: any = {
      ...unref(requestParams)
    }
    
    // 添加分页参数
    if (isPaginationEnabled) {
      query[requestKeyConfig.pageIndexKey] = state.pagination.currentPage
      query[requestKeyConfig.pageSizeKey] = state.pagination.pageSize
    }
    
    return query
  }

  /**
   * 执行请求
   */
  const fetchData = async () => {
    state.loading = true
    
    try {
      let requestData = buildRequestParams()
      
      // 执行 beforeFetch 钩子
      if (beforeFetch) {
        requestData = await beforeFetch(requestData)
      }

      // 使用 fetcher 执行请求
      const response = await fetcher(requestData)

      // 提取数据和总数
      let tableData = getPropValue(response, responseKeyConfig.dataKey) || []
      const tableTotal = getPropValue(response, responseKeyConfig.totalKey) || 0

      // 如果配置了 pageIndexKey，从响应中同步页码
      if (responseKeyConfig.pageIndexKey) {
        const responsePageIndex = getPropValue(response, responseKeyConfig.pageIndexKey)
        if (typeof responsePageIndex === 'number' && responsePageIndex > 0) {
          state.pagination.currentPage = responsePageIndex
        }
      }

      // 执行 afterFetch 钩子
      if (afterFetch) {
        tableData = await afterFetch(tableData)
      }

      state.data = tableData
      state.total = tableTotal
      state.pagination.total = tableTotal
    } catch (error) {
      console.error('Table fetch error:', error)
      
      // 执行错误处理钩子
      if (onError) {
        onError(error)
      }
      
      state.data = []
      state.total = 0
      state.pagination.total = 0
    } finally {
      state.loading = false
    }
  }

  /**
   * 刷新数据（保持当前页）
   */
  const refresh = async () => {
    await fetchData()
  }

  /**
   * 重置并刷新（回到第一页）
   */
  const reset = async () => {
    state.pagination.currentPage = 1
    await fetchData()
  }

  /**
   * 切换页码
   */
  const changePage = async (page: number) => {
    state.pagination.currentPage = page
    await fetchData()
  }

  /**
   * 切换每页条数
   */
  const changePageSize = async (size: number) => {
    state.pagination.pageSize = size
    state.pagination.currentPage = 1 // 重置到第一页
    await fetchData()
  }

  /**
   * 更新请求参数
   */
  const updateParams = (newParams: P) => {
    requestParams.value = newParams as any
  }

  // 监听请求参数变化
  watch(
    () => requestParams.value,
    () => {
        if (autoFetchOnParamsChange) {
            // 参数变化时重置到第一页
            state.pagination.currentPage = 1
            fetchData()
        }
    },
    { deep: true }
  )

  // 自动请求
  onMounted(() => {
    if (autoFetch) {
      fetchData()
    }
  })

  // 使用 toRefs 转换响应式属性，确保解构时也能保持响应性
  // 方法直接返回，不需要 ref 包装
  return {
    ...toRefs(state),
    refresh,
    reset,
    changePage,
    changePageSize,
    updateParams
  }
}

