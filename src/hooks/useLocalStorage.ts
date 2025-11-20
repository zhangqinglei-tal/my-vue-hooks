import { ref, watch, type Ref } from 'vue'

export interface UseLocalStorageOptions<T> {
  defaultValue?: T
  serializer?: {
    read: (value: string) => T
    write: (value: T) => string
  }
  onError?: (error: Error) => void
}

/**
 * 响应式 localStorage
 * @param key - localStorage 键名
 * @param initialValue - 初始值
 * @param options - 配置选项
 * @returns 响应式值
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): Ref<T> {
  const {
    serializer = {
      read: (v: string) => {
        try {
          return JSON.parse(v) as T
        } catch {
          return v as T
        }
      },
      write: (v: T) => JSON.stringify(v),
    },
    onError = (e: Error) => {
      console.error(e)
    },
  } = options

  // 尝试从 localStorage 读取
  let storedValue: T
  try {
    const item = localStorage.getItem(key)
    storedValue = item ? serializer.read(item) : initialValue
  } catch (error) {
    onError(error as Error)
    storedValue = initialValue
  }

  const state = ref<T>(storedValue) as Ref<T>

  // 监听变化并同步到 localStorage
  watch(
    state,
    (newValue) => {
      try {
        localStorage.setItem(key, serializer.write(newValue))
      } catch (error) {
        onError(error as Error)
      }
    },
    { deep: true }
  )

  return state
}

