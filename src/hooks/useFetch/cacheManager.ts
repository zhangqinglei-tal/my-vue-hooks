/**
 * 缓存项接口
 */
interface CacheItem<T = any> {
  data: T
  timestamp: number
  expiresAt: number
}

/**
 * 缓存键生成函数类型
 */
export type CacheKeyGenerator = (config: {
  url: string
  method: string
  params?: any
  data?: any
  headers?: Record<string, string>
}) => string

/**
 * 默认缓存键生成器：基于 URL + method + params + data
 */
export function defaultCacheKeyGenerator(config: {
  url: string
  method: string
  params?: any
  data?: any
  headers?: Record<string, string>
}): string {
  const { url, method, params, data } = config
  
  // 对 params 和 data 进行序列化
  const paramsStr = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
  const dataStr = data ? JSON.stringify(data, Object.keys(data).sort()) : ''
  
  return `${method}:${url}?${paramsStr}&${dataStr}`
}

/**
 * 缓存管理器
 */
class CacheManager {
  private cache = new Map<string, CacheItem>()
  private maxSize: number
  private defaultTTL: number
  private keyGenerator: CacheKeyGenerator

  constructor(options: {
    maxSize?: number
    defaultTTL?: number
    keyGenerator?: CacheKeyGenerator
  } = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 默认5分钟
    this.keyGenerator = options.keyGenerator || defaultCacheKeyGenerator
  }

  /**
   * 生成缓存键
   */
  generateKey(config: {
    url: string
    method: string
    params?: any
    data?: any
    headers?: Record<string, string>
  }): string {
    return this.keyGenerator(config)
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // 如果缓存已满，删除最旧的项（FIFO）
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    })
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now()
    let expiredCount = 0
    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expiredCount++
      }
    }
    return {
      size: this.cache.size,
      expiredCount,
      maxSize: this.maxSize,
    }
  }
}

// 创建全局缓存管理器实例
export const globalCacheManager = new CacheManager()

// 导出缓存管理器类，允许创建自定义实例
export { CacheManager }

