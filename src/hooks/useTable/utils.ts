import { reactive } from 'vue'
import type { PaginationConfig, PaginationState } from './types'

/**
 * 创建分页状态
 * @param config 分页配置，false 表示不启用分页
 * @returns 分页状态对象
 */
export function createPaginationState(config?: PaginationConfig | false): PaginationState {
  // 如果传入 false，仍然创建分页状态，但会在使用时判断配置是否为 false
  if (config === false) {
    return reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0,
      pageSizesList: [10, 20, 50, 100]
    })
  }
  
  // 正常的分页配置
  return reactive({
    currentPage: config?.currentPage || 1,
    pageSize: config?.pageSize || 10,
    total: 0,
    pageSizesList: config?.pageSizesList || [10, 20, 50, 100]
  })
}
