/**
 * 请求队列项
 */
interface QueueItem<T = any> {
  resolve: (value: { data: T | undefined; error: Error | undefined }) => void
  reject: (error: Error) => void
  timestamp: number
}

/**
 * 请求队列管理器
 */
class RequestQueue {
  private queues = new Map<string, QueueItem[]>()
  private pendingRequests = new Map<string, Promise<{ data: any; error: Error | undefined }>>()

  /**
   * 生成队列键（用于标识相同的请求）
   */
  generateKey(config: {
    url: string
    method: string
    params?: any
    data?: any
    headers?: Record<string, string>
  }): string {
    // 使用与缓存相同的键生成逻辑
    const { url, method, params, data } = config
    const paramsStr = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
    const dataStr = data ? JSON.stringify(data, Object.keys(data).sort()) : ''
    return `${method}:${url}?${paramsStr}&${dataStr}`
  }

  /**
   * 加入队列或执行请求
   */
  async enqueue<T>(
    key: string,
    requestFn: () => Promise<{ data: T | undefined; error: Error | undefined }>
  ): Promise<{ data: T | undefined; error: Error | undefined }> {
    // 如果已经有相同的请求正在进行，加入队列等待
    if (this.pendingRequests.has(key)) {
      return new Promise((resolve, reject) => {
        const queue = this.queues.get(key) || []
        queue.push({
          resolve: resolve as any,
          reject,
          timestamp: Date.now(),
        })
        this.queues.set(key, queue)
      })
    }

    // 创建新的请求 Promise
    const requestPromise = requestFn()
    this.pendingRequests.set(key, requestPromise)

    try {
      const result = await requestPromise
      
      // 请求完成，通知队列中的所有等待者
      const queue = this.queues.get(key)
      if (queue) {
        queue.forEach(item => {
          item.resolve(result)
        })
        this.queues.delete(key)
      }

      return result
    } catch (error) {
      // 请求失败，通知队列中的所有等待者
      const queue = this.queues.get(key)
      if (queue) {
        queue.forEach(item => {
          item.reject(error instanceof Error ? error : new Error(String(error)))
        })
        this.queues.delete(key)
      }

      throw error
    } finally {
      // 清除正在进行的请求标记
      this.pendingRequests.delete(key)
    }
  }

  /**
   * 取消队列中的请求（可选功能）
   */
  cancel(key: string): void {
    const queue = this.queues.get(key)
    if (queue) {
      queue.forEach(item => {
        item.reject(new Error('Request cancelled'))
      })
      this.queues.delete(key)
    }
    this.pendingRequests.delete(key)
  }

  /**
   * 清空所有队列
   */
  clear(): void {
    this.queues.clear()
    this.pendingRequests.clear()
  }

  /**
   * 获取队列统计信息
   */
  getStats() {
    let totalQueued = 0
    for (const queue of this.queues.values()) {
      totalQueued += queue.length
    }
    return {
      pendingRequests: this.pendingRequests.size,
      queuedRequests: totalQueued,
    }
  }
}

// 创建全局请求队列管理器实例
export const globalRequestQueue = new RequestQueue()

// 导出请求队列管理器类，允许创建自定义实例
export { RequestQueue }

