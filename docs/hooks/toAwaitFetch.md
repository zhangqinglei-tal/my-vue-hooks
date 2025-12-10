# toAwaitFetch

一个强大的 HTTP 请求工具，支持链式调用和解构两种使用方式，提供了完整的错误处理、重试机制和全局配置功能。

## 特性

- ✅ **双模式使用**：支持链式调用和解构两种使用方式
- ✅ **完整错误处理**：区分 HTTP、业务、网络错误，提供专门的错误处理钩子
- ✅ **自动重试机制**：支持自定义重试策略和判断函数
- ✅ **全局配置**：支持全局配置和单次请求配置，灵活合并
- ✅ **请求超时控制**：支持请求超时设置和自动取消
- ✅ **多种请求/响应类型**：支持 JSON、FormData、Blob
- ✅ **TypeScript 支持**：完整的类型定义，提供良好的开发体验
- ✅ **零依赖**：基于原生 Fetch API，无需安装额外依赖

## 安装

```bash
npm install toAwaitFetch
# 或
pnpm add toAwaitFetch
```

## 用法

### 1. 基本用法

```typescript
import { sendGet, sendPost } from 'toAwaitFetch'

// GET 请求
const [data, error, success] = await sendGet('/api/users')

// POST 请求
const [created] = await sendPost('/api/users', { name: 'John' })
```

### 2. 完整封装（推荐）

```typescript
// src/utils/http.ts - 项目内的统一 HTTP 封装
import { createInstance } from 'toAwaitFetch'

// 从存储读取 token（可按需替换为你的鉴权逻辑）
const getToken = () => localStorage.getItem('token')

// 创建实例并集中配置：超时、头、校验、转换、重试、错误处理
const httpInstance = createInstance({
  // 保持相对路径，交由本地代理处理
  baseURL: '',
  // 超时时间
  timeout: 5000,
  headers: ({ url, method }) => ({
    // header中增加 Authorization
    Authorization: `Bearer ${getToken() || ''}`,
  }),
  // 业务成功判定
  validateResponse: (response) => response.code === 200,
  // 统一使用接口返回的 data 字段作为返回的内容
  transformResponse: (response) => response.data,
  // HTTP 错误集中处理，按需抑制异常抛出
  onHttpError: async (_error, status, _response, suppressError) => {
    if (status === 401) {
      // 如果是401的错误，抑制错误抛出，并跳转到登录地址
      // 调用suppressError()方法，401的http错误业务侧不处理也不会抛出错误
      window.locatin.href = '/login'
      suppressError()
    }
    if (status > 401 && status <= 500) {
      // 统一处理错误
      message.error('请求错误')
      suppressError()
    }
  },
  onNetworkError: async (error, suppressError) => {
    // 网络错误/超时/取消：统一不抛错
    console.log('network error', error)
    suppressError()
  },
  retry: {
    // 是否开启重试功能
    enabled: true,
    // 最多重试3次，不计算首次调用，共调用4次后会失败
    maxRetryCount: 3,
    // 每次重试间隔的时间
    delay: 1000,
    // 仅对包含 network 字样的错误重试，最多 3 次
    shouldRetry: async (attempt, fetchError) => {
      // 如果是业务错误
      if (fetchError.type === 'business') {
        // 接口返回的code码为401 代表无权限，不再进行重试
        if (fetchError?.response.data.code === 401) {
          return false;
        }
      }
      return true
    }
  },
  mode: 'cors',
  credentials: 'include',
})

export default httpInstance
```

```typescript
import { sendGet } from 'src/utils/http.ts'

// 使用封装的实例，本次请求根据全局配置5秒后超时
const [list, listError, ok] = await sendGet('/api/users')
if (ok) {
  console.log('users', list)
}

// 单次请求覆盖全局超时配置，本次请求2秒后超时
const [detail] = await sendGet('/api/users/1', undefined, {
  timeout: 2000,
})
```

### 3. 设置请求头

```typescript
import { createInstance } from 'toAwaitFetch'

// 方式一：静态配置 headers（简单场景）
const httpStatic = createInstance({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'X-Request-Path': '/api/users',
  },
})

// 方式二：函数生成 headers（需要上下文时）
const httpDynamic = createInstance({
  headers: ({ url, method }) => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'X-Request-Path': url,
    'X-Request-Method': method || 'GET',
  }),
})
```

### 4. 重试

```typescript
import { createInstance } from 'toAwaitFetch'

// 配置重试：最多 3 次，每次间隔 1 秒，仅网络错误时重试
const http = createInstance({
  retry: {
    enabled: true,
    maxRetryCount: 3,
    delay: 1000,
    shouldRetry: (attempt, error) => attempt < 3 && error.type === 'network',
  },
})

const [data, error, success] = await http.sendGet('/api/test/retry')
```

### 5. 请求正确性验证（validateStatus）

```typescript
// 覆盖默认状态码校验，允许 201
const [data, error, success] = await sendGet('/api/users', undefined, {
  validateStatus: (status) => (status >= 200 && status < 300) || status === 201,
})
```

### 6. 业务数据正确性验证（validateResponse）

```typescript
// 业务校验：仅接口数据返回的 code === 1 时视为成功
const [data, error, success] = await sendGet('/api/users', undefined, {
  validateResponse: (response) => response.code === 1,
})
```

### 7. 业务数据转换（transformResponse）

```typescript
import { createInstance } from 'toAwaitFetch'

const http = createInstance({
  validateResponse: (res) => res.code === 0,
  transformResponse: (res) => res.data,
})

const [data] = await http.sendGet('/api/users') // data 已是业务数据
```

### 8. Promise.all 并行请求

```typescript
import { sendGet } from 'toAwaitFetch'

const urls = ['/api/users', '/api/permissions', '/api/notifications']
const responses = await Promise.all(urls.map((url) => sendGet(url)))

const normalized = responses.map(([data, fetchError, success], index) => ({
  url: urls[index],
  success,
  data,
  error: fetchError
    ? {
        message: fetchError.message,
        type: fetchError.type,
        status: fetchError.status,
      }
    : undefined,
}))
```

### 9. 取消请求

```typescript
import { sendGet } from 'toAwaitFetch'

// 触发请求
const request = sendGet('/api/users', undefined, { timeout: 8000 })

// 条件满足时取消（AbortController 内置）
request.cancel()

// 解构获取结果（被取消时 error.type === 'timeout' 或 'network'，success 为 false）
const [data, error, success] = await request
```

## 错误处理
默认会在错误时抛出异常；若使用链式处理、解构，或在钩子中调用 `suppressError()`，将不再弹出错误提示，但仍可获得错误对象：
- 配置钩子：`onHttpError` / `onBusinessError` / `onNetworkError`，调用 `suppressError()` 可阻止错误冒泡，依然能在链式或解构中取到错误。
- 解构模式：第二项 `error` 返回错误对象，不会再提示，需要自行读取 `error.type` / `status` / `message` 做分支。
- 链式处理：`catchHttp`（HTTP 校验失败）、`catchBusiness`（业务校验失败）、`catchNetwork`（网络/超时/取消）可自行处理错误，无额外提示。


示例：

```typescript
sendGet('/api/test/not-found')
  .catchHttp((error) => console.error('HTTP 错误', error))
  .catchBusiness((error) => console.error('业务错误', error))
  .catchNetwork((error) => console.error('网络/超时错误', error))
```


## Instance

| 名称 | 签名 | 说明 |
| --- | --- | --- |
| `create` | `(globalConfig?: GlobalConfig<TResponse>) => FetchInstance<TResponse>` | 等同于 createInstance |
| `sendGet` | `<TRequest, TResponse>(url: string, params?: TRequest, config?: Omit<RequestConfig<TRequest, TResponse>, 'url' \| 'method' \| 'data'>) => FetchResultPromise<TResponse>` | GET，请求参数自动拼接为查询字符串 |
| `sendPost` | `<TRequest, TResponse>(url: string, data?: TRequest, config?: Omit<RequestConfig<TRequest, TResponse>, 'url' \| 'method' \| 'data'>) => FetchResultPromise<TResponse>` | POST，默认 JSON |
| `sendPostForm` | `<TRequest, TResponse>(url: string, data?: TRequest, config?: Omit<RequestConfig<TRequest, TResponse>, 'url' \| 'method' \| 'data'>) => FetchResultPromise<TResponse>` | POST FormData（自动将 data 转为 FormData，自动设置 multipart/form-data 并保留自定义 headers） |
| `sendPostBlob` | `<TRequest>(url: string, data?: TRequest, config?: Omit<RequestConfig<TRequest, Blob>, 'url' \| 'method' \| 'data'>) => FetchResultPromise<Blob>` | POST 发送 JSON，响应返回 Blob（导出/下载） |
| `sendGetBlob` | `<TRequest>(url: string, params?: TRequest, config?: Omit<RequestConfig<TRequest, Blob>, 'url' \| 'method' \| 'data'>) => FetchResultPromise<Blob>` | GET，返回 Blob（下载文件） |
| `setGlobalConfig` | `(config: GlobalConfig<TResponse>) => void` | 覆盖当前实例的全局配置 |

> 每个返回的 `FetchResultPromise` 都支持 `.cancel()` 取消正在进行的请求。
>
> 取消示例：
> ```typescript
> const request = sendGet('/api/users');
> // 某些条件下取消
> request.cancel();
> ```

## API

### Params

| 属性 | 说明 | 类型 | 默认 |
| --- | --- | --- | --- |
| baseURL | 基础 URL，自动与 url 拼接，如url中是http\|https开头则不拼接，全局配置单例中没有此属性 | `string` | - |
| validateStatus | 全局状态码校验 | `(status: number) => boolean` | `status >= 200 && status < 300` |
| validateResponse | 全局业务数据校验 | `(response: TResponse) => boolean` | `true` |
| transformResponse | 全局业务数据转换 | `(response: TResponse) => TResponse` | 不转换 |
| onHttpError | HTTP 错误回调 | `HttpErrorHandler<TResponse>` | - |
| onBusinessError | 业务错误回调 | `BusinessErrorHandler<TResponse>` | - |
| onNetworkError | 网络/超时错误回调 | `NetworkErrorHandler` | - |
| retry | 重试配置 | `RetryConfig` | - |
| timeout | 超时时间(ms) | `number` | - |
| headers | 请求头（可函数） | `HeadersConfig` | - |
| mode | 请求模式 | `'cors' \| 'no-cors' \| 'same-origin' \| 'navigate' \| 'websocket'` | `cors` |
| credentials | 凭证模式 | `'include' \| 'same-origin' \| 'omit'` | `include` |

### Result

| 类型 | 说明 | 结构 |
| --- | --- | --- |
| `FetchResultPromise<TResponse>` | 可链式的 Promise，支持 then/catchHttp/catchBusiness/catchNetwork/cancel | `Promise<FetchResult<TResponse>> & { then(callback:(data:TResponse)=>void): this; catchHttp(fn): this; catchBusiness(fn): this; catchNetwork(fn): this; cancel(): void }` |
| `FetchResult<TResponse>` | 解构返回值 | `[TResponse \| undefined, FetchError<TResponse> \| undefined, boolean]` |
| `FetchError<TResponse>` | 统一错误对象 | `{ message: string; type: 'http' \| 'business' \| 'network' \| 'timeout'; status?: number; response?: TResponse; error?: Error | TypeError | DOMException }` |
| `FetchResponse<TResponse>` | 原始响应包装（内部使用） | `{ data: TResponse; status: number; statusText: string; headers: Headers; response: Response }` |

## types

常用 TypeScript 类型说明（适用于所有请求/响应场景）：

- `TResponse`：接口返回的业务数据类型，默认 `any`，建议为每个接口定义具体类型。
- `FetchError<TResponse>`：统一错误结构，`type` 区分 `http/business/network/timeout`，`response` 持有服务端返回体（若有）。
- `FetchResult<TResponse>`：解构返回 `[data, error, success]` 的元组。

#### FetchError

| 字段 | 说明 |
| --- | --- |
| `message: string` | 统一错误文案，可直接用于提示或日志 |
| `type: 'http' \| 'business' \| 'network' \| 'timeout'` | 错误类型：HTTP 校验失败 / 业务校验失败 / 网络或跨域、超时 / 主动超时 |
| `status?: number` | HTTP 状态码（仅 http 类型时可能存在） |
| `response?: TResponse` | 服务端返回体（若有），可用于展示业务码或文案 |
| `error?: Error \| TypeError \| DOMException` | 原始错误对象，便于调试或上报 |


#### RetryConfig（重试）

| 属性 | 说明 | 类型 | 默认 |
| --- | --- | --- | --- |
| enabled | 是否开启重试 | `boolean` | `false` |
| maxRetryCount | 最大重试次数 | `number` | `3` |
| delay | 重试间隔(ms) | `number` | `1000` |
| shouldRetry | 自定义重试判断 | `(attempt: number, error: FetchError<TResponse>) => boolean \| Promise<boolean>` | 仅在 enabled 时生效 |

