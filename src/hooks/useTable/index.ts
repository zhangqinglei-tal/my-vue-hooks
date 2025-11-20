/**
 * useTable - Vue 3 Composition API 表格管理 Hook
 * 
 * 提供两个主要方法：
 * - useTableRequest: 处理 API 请求的表格
 * - useTableStatic: 处理静态数据的表格
 */

// 导出请求方法
export { useTableRequest } from './useTableRequest'

// 导出静态数据方法
export { useTableStatic } from './useTableStatic'

// 导出工具函数
export { createPaginationState } from './utils'

// 导出默认配置相关函数
export {
  setUseTableRequestDefaults,
  getUseTableRequestDefaults,
  resetUseTableRequestDefaults
} from './defaultConfig'

// 导出类型
export * from './types'

