import type { Ref, UnwrapRef } from 'vue'

/**
 * 分页配置
 */
export interface PaginationConfig {
  /**
   * 当前页码
   */
  currentPage?: number
  /**
   * 每页显示条数
   */
  pageSize?: number
  /**
   * 每页显示条数选项
   */
  pageSizesList?: number[]
}

/**
 * 请求参数映射配置
 */
export interface RequestKeyConfig {
  /**
   * 请求参数中页码的字段名
   * @default 'pageIndex'
   */
  pageIndexKey?: string
  /**
   * 请求参数中每页条数的字段名
   * @default 'pageSize'
   */
  pageSizeKey?: string
}

/**
 * 响应数据映射配置
 */
export interface ResponseKeyConfig {
  /**
   * 响应数据中数据列表的字段名（支持点号分隔的路径）
   * @default 'data'
   */
  dataKey?: string
  /**
   * 响应数据中总数的字段名（支持点号分隔的路径）
   * @default 'total'
   */
  totalKey?: string
  /**
   * 响应数据中页码的字段名（支持点号分隔的路径）
   * 如果提供，将从响应中同步页码到分页状态
   * @default undefined
   */
  pageIndexKey?: string
}

/**
 * 请求配置选项（排除 fetcher 和 params，用于全局默认配置）
 */
export type UseTableRequestDefaultOptions = Omit<UseTableRequestOptions<any, any>, 'fetcher' | 'params'>

/**
 * 请求配置选项
 */
export interface UseTableRequestOptions<T = any, P = any> {
  /**
   * 请求函数（必需）
   */
  fetcher: (params: any) => Promise<any>
  /**
   * 请求参数
   */
  params?: P
  /**
   * 是否自动发起请求
   * @default true
   */
  autoFetch?: boolean
  /**
   * 请求参数变化时是否自动重新请求
   * @default true
   */
  autoFetchOnParamsChange?: boolean
  /**
   * 分页配置。设置为 false 时不进行分页处理
   */
  pagination?: PaginationConfig | false
  /**
   * 请求参数映射配置
   */
  requestKeyConfig?: RequestKeyConfig
  /**
   * 响应数据映射配置
   */
  responseKeyConfig?: ResponseKeyConfig
  /**
   * 请求前的处理函数
   */
  beforeFetch?: (params: any) => any | Promise<any>
  /**
   * 请求成功后的处理函数
   */
  afterFetch?: (data: any) => T[] | Promise<T[]>
  /**
   * 请求失败后的处理函数
   */
  onError?: (error: any) => void
}

/**
 * 静态数据配置选项
 * @template T 数据项类型，必须是对象类型
 */
export interface UseTableStaticOptions<
  T extends Record<string, any> = Record<string, any>
> {
  /**
   * 静态数据
   */
  data: T[] | Ref<T[]>
  /**
   * 数据过滤函数
   */
  filterFn?: (item: T) => boolean
  /**
   * 分页配置。设置为 false 时不进行分页处理
   */
  pagination?: PaginationConfig | false
}

/**
 * 分页状态
 */
export interface PaginationState {
  /**
   * 当前页码
   */
  currentPage: number
  /**
   * 每页显示条数
   */
  pageSize: number
  /**
   * 总条数
   */
  total: number
  /**
   * 每页显示条数选项
   */
  pageSizesList: number[]
}

/**
 * 表格状态
 */
export interface TableState<T = any> {
  /**
   * 表格数据
   */
  data: T[]
  /**
   * 加载状态
   */
  loading: boolean
  /**
   * 分页状态
   */
  pagination: PaginationState
  /**
   * 总条数
   */
  total: number
}

/**
 * 表格操作方法
 */
export interface TableActions {
  /**
   * 刷新表格数据
   */
  refresh: () => Promise<void>
  /**
   * 重置并刷新（回到第一页）
   */
  reset: () => Promise<void>
  /**
   * 切换页码
   */
  changePage: (page: number) => Promise<void>
  /**
   * 切换每页条数
   */
  changePageSize: (size: number) => Promise<void>
  /**
   * 更新请求参数（仅用于请求模式）
   */
  updateParams?: (params: any) => void
}

/**
 * 将对象类型转换为 Ref 类型（用于 toRefs 的返回值）
 * toRefs 会使用 UnwrapRef 处理嵌套的响应式对象
 */
type ToRefs<T> = {
  [K in keyof T]: Ref<UnwrapRef<T[K]>>
}

/**
 * useTable 返回值
 * 使用 toRefs 转换后，响应式属性都是 Ref 类型，确保解构时也能保持响应性
 * 
 * @example
 * ```ts
 * // 解构使用，响应性保持
 * const { data, pagination, refresh } = useTableStatic({ data: sourceData })
 * 
 * // 在模板中使用（自动解包）
 * // <div v-for="item in data">{{ item.name }}</div>
 * 
 * // 在 script 中使用（需要 .value）
 * watch(() => data.value, (newData) => { ... })
 * ```
 */
export interface UseTableReturn<T = any> extends ToRefs<TableState<T>>, TableActions {}

