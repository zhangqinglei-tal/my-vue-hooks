import type { 
  UseTableRequestDefaultOptions, UseTableRequestOptions, UseTableStaticOptions, PaginationConfig } from './types'

/**
 * 全局默认配置存储
 */
let globalDefaultOptions: Partial<UseTableRequestDefaultOptions> = {}

/**
 * 设置全局默认配置
 * 可以设置除 fetcher 和 params 外的所有属性
 * 
 * @param options 默认配置选项
 * 
 * @example
 * ```ts
 * setUseTableRequestDefaults({
 *   autoFetch: false,
 *   pagination: {
 *     pageSize: 20
 *   },
 *   requestKeyConfig: {
 *     pageIndexKey: 'page',
 *     pageSizeKey: 'size'
 *   },
 *   responseKeyConfig: {
 *     dataKey: 'data.list',
 *     totalKey: 'data.total'
 *   },
 *   onError: (error) => {
 *     console.error('Request failed:', error)
 *   }
 * })
 * ```
 */
export function setUseTableRequestDefaults(options: Partial<UseTableRequestDefaultOptions>): void {
  globalDefaultOptions = { ...globalDefaultOptions, ...options }
}

/**
 * 获取全局默认配置
 * @returns 全局默认配置
 */
export function getUseTableRequestDefaults(): Partial<UseTableRequestDefaultOptions> {
  return { ...globalDefaultOptions }
}

/**
 * 重置全局默认配置
 */
export function resetUseTableRequestDefaults(): void {
  globalDefaultOptions = {}
}

/**
 * 合并默认配置和用户配置
 * @param userOptions 用户配置
 * @returns 合并后的配置
 */
export function mergeUseTableRequestOptions<T = any, P = any>(
  userOptions: UseTableRequestOptions<T, P>
): UseTableRequestOptions<T, P> {
  // 处理分页配置：如果用户设置为 false，直接使用 false；否则深度合并
  let mergedPagination: PaginationConfig | false | undefined
  if (userOptions.pagination === false) {
    mergedPagination = false
  } else if (userOptions.pagination || globalDefaultOptions.pagination) {
    mergedPagination = {
      ...(globalDefaultOptions.pagination && typeof globalDefaultOptions.pagination === 'object' ? globalDefaultOptions.pagination : {}),
      ...(userOptions.pagination && typeof userOptions.pagination === 'object' ? userOptions.pagination : {})
    }
  }
  
  // 深度合并配置
  const merged: UseTableRequestOptions<T, P> = {
    ...globalDefaultOptions,
    ...userOptions,
    // 使用处理后的分页配置
    pagination: mergedPagination,
    // 深度合并请求参数映射配置
    requestKeyConfig: {
      ...globalDefaultOptions.requestKeyConfig,
      ...userOptions.requestKeyConfig
    },
    // 深度合并响应数据映射配置
    responseKeyConfig: {
      ...globalDefaultOptions.responseKeyConfig,
      ...userOptions.responseKeyConfig
    }
  }

  return merged
}


let globalDefaultStaticOptions: Partial<UseTableStaticOptions> = {
  pagination: {
    pageSize: 10,
    pageSizesList: [10, 20, 50, 100],
    currentPage: 1
  }
}
export const setUseTableStaticDefaults = (options: Partial<UseTableStaticOptions>): void => {
  // 处理分页配置：如果设置为 false，直接使用 false；否则深度合并
  let mergedPagination: PaginationConfig | false | undefined
  if (options.pagination === false) {
    mergedPagination = false
  } else if (options.pagination || globalDefaultStaticOptions.pagination) {
    mergedPagination = {
      ...(globalDefaultStaticOptions.pagination && typeof globalDefaultStaticOptions.pagination === 'object' ? globalDefaultStaticOptions.pagination : {}),
      ...(options.pagination && typeof options.pagination === 'object' ? options.pagination : {})
    }
  }
  
  globalDefaultStaticOptions = { 
    ...globalDefaultStaticOptions,
    ...options,
    pagination: mergedPagination
  }
}
export function mergeUseTableStaticOptions(
  userOptions: UseTableStaticOptions
): UseTableStaticOptions {
  // 处理分页配置：如果用户设置为 false，直接使用 false；否则深度合并
  let mergedPagination: PaginationConfig | false | undefined
  if (userOptions.pagination === false) {
    mergedPagination = false
  } else if (userOptions.pagination || globalDefaultStaticOptions.pagination) {
    mergedPagination = {
      ...(globalDefaultStaticOptions.pagination && typeof globalDefaultStaticOptions.pagination === 'object' ? globalDefaultStaticOptions.pagination : {}),
      ...(userOptions.pagination && typeof userOptions.pagination === 'object' ? userOptions.pagination : {})
    }
  }
  
  return {
    ...globalDefaultStaticOptions,
    ...userOptions,
    // 使用处理后的分页配置
    pagination: mergedPagination
  }
}

