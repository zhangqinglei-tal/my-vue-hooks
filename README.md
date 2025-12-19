# xn-fe-tools

基于 Vue 3 Composition API 的工具库，当前主力能力是 `toAwaitFetch`：一个支持链式和解构两种模式的 HTTP 请求工具，内置错误处理、重试、全局配置与取消能力。

## ✨ 特性

- 双模式：链式调用与解构 `[data, error, success]`
- 完整错误处理：HTTP / 业务 / 网络 / 超时，支持钩子与抑制抛错
- 重试与超时：内置重试策略、可自定义 shouldRetry，支持超时与取消
- 多种请求/响应类型：JSON、FormData、Blob
- 全局配置：baseURL、headers、validateStatus、validateResponse、transformResponse 等
- TypeScript 全量类型定义，零外部依赖（基于原生 Fetch）

## 📦 安装

```bash
# npm
npm install xn-fe-tools
# pnpm
pnpm add xn-fe-tools
# yarn
yarn add xn-fe-tools
```

## 🚀 快速使用

### 解构模式

```ts
import { sendGet, sendPost } from 'xn-fe-tools'

const [list, listError, ok] = await sendGet('/api/users')
const [created] = await sendPost('/api/users', { name: 'John' })
```

### 链式模式

```ts
import toAwaitFetch from 'xn-fe-tools'

toAwaitFetch
  .sendGet('/api/users')
  .catchHttp((err) => console.error('HTTP 错误', err))
  .catchBusiness((err) => console.error('业务错误', err))
  .catchNetwork((err) => console.error('网络/超时错误', err))
```

### 创建实例并统一配置（推荐）

```ts
import { createInstance } from 'xn-fe-tools'

const http = createInstance({
  baseURL: '',
  timeout: 5000,
  headers: ({ url, method }) => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'X-Request-Path': url,
    'X-Request-Method': method || 'GET',
  }),
  validateResponse: (res) => res.code === 200,
  transformResponse: (res) => res.data,
  retry: {
    enabled: true,
    maxRetryCount: 3,
    delay: 1000,
    shouldRetry: async (attempt, fetchError) => {
      if (fetchError.type === 'business' && fetchError.response?.code === 401) {
        return false
      }
      return true
    },
  },
  mode: 'cors',
  credentials: 'include',
})

const [data] = await http.sendGet('/api/users', undefined, { timeout: 2000 })
```

### 取消请求

```ts
import { sendGet } from 'xn-fe-tools'

const request = sendGet('/api/users', undefined, { timeout: 8000 })
request.cancel()
const [, error, success] = await request // 被取消时 error.type === 'timeout' 或 'network'
```


## 📦 版本信息

```ts
import { VERSION, getVersion } from 'xn-fe-tools'

console.log(VERSION)
console.log(getVersion())
```

## 📄 License

MIT
