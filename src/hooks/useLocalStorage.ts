import { ref, watch, onMounted, type Ref } from 'vue'

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

  // 检查是否在浏览器环境（SSR 安全）
  const isClient = typeof window !== 'undefined'

  // 尝试从 localStorage 读取
  let storedValue: T
  if (isClient) {
    try {
      const item = localStorage.getItem(key)
      storedValue = item ? serializer.read(item) : initialValue
    } catch (error) {
      onError(error as Error)
      storedValue = initialValue
    }
  } else {
    // SSR 环境，使用初始值
    storedValue = initialValue
  }

  const state = ref<T>(storedValue) as Ref<T>

  // 在客户端挂载后，再次尝试从 localStorage 读取（处理 SSR hydration）
  if (isClient) {
    onMounted(() => {
      try {
        const item = localStorage.getItem(key)
        if (item) {
          state.value = serializer.read(item)
        }
      } catch (error) {
        onError(error as Error)
      }
    })
  }

  // 监听变化并同步到 localStorage
  watch(
    state,
    (newValue) => {
      // 只在客户端环境同步到 localStorage
      if (isClient) {
        try {
          localStorage.setItem(key, serializer.write(newValue))
        } catch (error) {
          onError(error as Error)
        }
      }
    },
    { deep: true }
  )

  return state
}

