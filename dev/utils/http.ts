/**
 * HTTP 请求封装 - 最佳实践示例
 * 在真实项目中，这个文件通常放在 src/utils/http.ts 或 src/api/http.ts
 */
// @ts-ignore - 开发环境类型解析
import { createInstance } from '../../src/hooks/toAwaitFetch/toAwaitFetch'

// 模拟的工具函数
const getToken = () => {
  return localStorage.getItem('token') || 'demo-token'
}

const showErrorToast = (message: string) => {
  console.error('[Error Toast]:', message)
  // 在实际项目中，这里会调用 UI 库的 toast 组件
}

// 创建实例并配置所有选项
const httpInstance = createInstance({
  // 基础配置
  // 开发环境：使用相对路径，通过 Vite 代理转发到 http://localhost:9900
  // 生产环境：可以设置为实际的 API 地址
  baseURL: 'http://localhost:9900/',  // 使用相对路径，通过 Vite 代理
  timeout: 30000,                                      // 请求超时时间（毫秒）
  
  // 请求头配置
  // headers: {
  //   'Content-Type': 'application/json'
  // },
  // 或使用函数形式动态生成请求头
  headers: ({ url, method }) => {
    return {
      'Authorization': `Bearer ${getToken()}`,
      'X-Request-ID': Date.now().toString()
    }
  },
  validateResponse: (response) => {
    return response.code === 200;
  },
  transformResponse: (response) => {
    console.log('response', response)
    return response.data;
  },
  
  // 错误处理钩子
  onHttpError: async (error, status, response, suppressError) => {
    console.log('response', response)
    console.log('status', status)
    // 统一处理 HTTP 错误（如 404, 500）
    if (status === 401) {
      // 未授权，跳转登录（实际项目中）
      console.warn('[HTTP Error 401]: 未授权，需要登录')
      // window.location.href = '/login'
      alert('这里是401的错误处理钩子，并且调用了suppressError() 来取消抛错，用户不处理也不会抛出错误')
      // 如果已经在错误处理钩子中处理了错误，可以调用 suppressError() 来取消抛错
      suppressError()
    } else if (status === 404) {
      alert('这里是404的错误处理钩子，不处理会抛出错误')
    } else if (status === 502) {
      // ✅ 先检查特定状态码（502）
      alert('这里是502的错误处理钩子，并且调用了suppressError() 来取消抛错，用户不处理也不会抛出错误')
      suppressError()
    } else if (status >= 402 && status <= 500) {
      // ✅ 然后检查范围（使用 >= 更清晰）
      alert('这里是402-500的错误处理钩子，并且未调用suppressError() 来取消抛错，用户必须处理错误，否则会抛出错误')
      suppressError();
    } else if (status >= 503) {
      // ✅ 其他 5xx 错误（503, 504 等）
      alert('这里是503+的错误处理钩子，并且调用了suppressError() 来取消抛错')
      suppressError()
    }
  },
  onBusinessError: async (error, response, suppressError) => {
  },
  onNetworkError: async (error, suppressError) => {
    console.log('onNetworkError', error)
    // 统一处理网络错误（无网络、跨域等）
    showErrorToast('网络连接失败，请检查网络')
    // 如果已经在错误处理钩子中处理了错误，可以调用 suppressError() 来取消抛错
    // suppressError()
  },
  
  // 重试配置
  retry: {
    enabled: true,                               // 启用重试
    maxRetryCount: 3,                            // 最大重试次数
    delay: 1000,                                 // 重试延迟（毫秒）
    shouldRetry: async (attempt, error) => {     // 自定义重试判断
      // 只对网络错误重试，且最多重试 3 次
      return attempt <= 3 && error.message.includes('network')
    }
  },

  // 响应数据转换（可选）
  // transformResponse: (data) => {
  //   // 将原始响应数据转换为业务使用的格式
  //   // 例如：提取嵌套的 data 字段
  //   return data.data || data
  // },
  
  // 其他配置
  mode: 'cors',                                   // 请求模式
  credentials: 'include'                          // 凭证模式
  
  // 注意：不再需要配置 requestType 和 responseType
  // 使用对应的方法即可：sendPost/sendPostForm/sendPostBlob/sendGetBlob
})

// 解构导出方法（无需手动 bind，已自动绑定）
const { sendGet, sendPost, sendPostForm, sendPostBlob, sendGetBlob, setGlobalConfig } = httpInstance

// 导出使用
export { sendGet, sendPost, sendPostForm, sendPostBlob, sendGetBlob, setGlobalConfig }
export default httpInstance