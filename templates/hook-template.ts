import { ref, type Ref } from 'vue'

export interface Use{{HookName}}Options {
  // TODO: 定义选项类型
}

export interface Use{{HookName}}Return {
  // TODO: 定义返回值类型
}

/**
 * {{HookDescription}}
 * 
 * @param param - 参数说明
 * @param options - 配置选项
 * @returns 返回值说明
 * 
 * @example
 * ```ts
 * const { value } = use{{HookName}}('param')
 * ```
 */
export function use{{HookName}}(
  param: string,
  options: Use{{HookName}}Options = {}
): Use{{HookName}}Return {
  // TODO: 实现逻辑
  const value = ref(0)

  return {
    value,
    // TODO: 返回其他值
  }
}

