/**
 * 工具函数集合
 */

/**
 * 从对象中根据路径字符串获取值
 * 支持点号分隔的路径，如 'data.list' 或 'data.items[0].name'
 * 
 * @param obj - 目标对象
 * @param path - 路径字符串，支持点号和数组索引
 * @returns 获取到的值，如果路径不存在则返回 undefined
 * 
 * @example
 * ```ts
 * const obj = { data: { list: [1, 2, 3] } }
 * getPropValue(obj, 'data.list') // [1, 2, 3]
 * getPropValue(obj, 'data.list[0]') // 1
 * ```
 */
export function getPropValue(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined
  }

  // 处理数组索引，如 'data.list[0]' -> ['data', 'list', '0']
  const keys = path
    .replace(/\[(\d+)\]/g, '.$1') // 将 [0] 转换为 .0
    .split('.')
    .filter(Boolean)

  let result = obj
  for (const key of keys) {
    if (result == null) {
      return undefined
    }
    result = result[key]
  }

  return result
}

