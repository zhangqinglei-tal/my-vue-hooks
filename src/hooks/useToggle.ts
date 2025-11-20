import { ref, type Ref } from 'vue'

export type ToggleValue = boolean | string | number

export interface UseToggleOptions<T extends ToggleValue> {
  truthyValue?: T
  falsyValue?: T
}

export interface UseToggleReturn<T extends ToggleValue> {
  value: Ref<T>
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
  set: (value: T) => void
}

/**
 * 切换布尔值或两个值之间的切换
 * @param initialValue - 初始值
 * @param options - 配置选项
 * @returns 切换对象
 */
export function useToggle<T extends ToggleValue = boolean>(
  initialValue: T = false as T,
  options: UseToggleOptions<T> = {}
): UseToggleReturn<T> {
  const { truthyValue = true as T, falsyValue = false as T } = options

  const value = ref(initialValue) as Ref<T>

  const toggle = () => {
    value.value = value.value === truthyValue ? falsyValue : truthyValue
  }

  const setTrue = () => {
    value.value = truthyValue
  }

  const setFalse = () => {
    value.value = falsyValue
  }

  const set = (val: T) => {
    value.value = val
  }

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    set,
  }
}

