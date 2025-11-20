import { ref, type Ref } from 'vue'

export interface UseCounterOptions {
  min?: number
  max?: number
  initial?: number
}

export interface UseCounterReturn {
  count: Ref<number>
  inc: (delta?: number) => void
  dec: (delta?: number) => void
  set: (value: number) => void
  reset: () => void
}

/**
 * 响应式计数器
 * @param initialValue - 初始值
 * @param options - 配置选项
 * @returns 计数器对象
 */
export function useCounter(
  initialValue: number = 0,
  options: UseCounterOptions = {}
): UseCounterReturn {
  const { min = -Infinity, max = Infinity } = options
  const initial = options.initial ?? initialValue

  const count = ref(initial)

  const inc = (delta: number = 1) => {
    count.value = Math.min(max, count.value + delta)
  }

  const dec = (delta: number = 1) => {
    count.value = Math.max(min, count.value - delta)
  }

  const set = (value: number) => {
    count.value = Math.max(min, Math.min(max, value))
  }

  const reset = () => {
    count.value = initial
  }

  return {
    count,
    inc,
    dec,
    set,
    reset,
  }
}

