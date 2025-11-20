# useAxiosFetch Hook 文档

基于 Vue 3 Composition API 和 Axios 的响应式数据请求 Hook，提供了完整的请求生命周期管理、错误处理、重试机制等功能。

## 特性

- ✅ **响应式数据**：基于 Vue 3 的响应式系统，自动更新组件状态
- ✅ **TypeScript 支持**：完整的类型定义，提供良好的开发体验
- ✅ **请求拦截器**：支持 `beforeFetch`、`afterFetch`、`onFetchError` 拦截器
- ✅ **自动重试**：支持配置重试次数和延迟时间，智能识别可重试的错误
- ✅ **请求取消**：支持取消正在进行的请求
- ✅ **网络状态监听**：支持网络断开/恢复时自动处理
- ✅ **页面可见性监听**：支持页面切换时自动取消或重新请求
- ✅ **链式调用**：支持链式调用设置请求方法和参数
- ✅ **URL 响应式**：支持响应式 URL，URL 变化时自动重新请求
- ✅ **多种响应类型**：支持 `json`、`text`、`blob`、`arraybuffer`、`document`、`form` 响应类型
- ✅ **FormData 支持**：自动处理 FormData 请求和响应，正确设置 `multipart/form-data` Content-Type
- ✅ **Promise 版本**：提供 `useGetPromise` 和 `usePostPromise` 方法，返回 Promise 而非响应式对象

## 安装

### NPM

```bash
npm install vue3-tools
```

### Yarn

```bash
yarn add vue3-tools
```

### PNPM

```bash
pnpm add vue3-tools
```

### 使用

```typescript
import { useAxiosFetch, useGet, usePost } from 'vue3-tools'
```

**注意：** 如果使用 `useAxiosFetch` 相关功能，需要额外安装 `axios`：

```bash
npm install axios
```

## 基础用法

### 简单 GET 请求

```typescript
import { useGet } from 'vue3-tools'

const { data, loading, error, execute } = useGet<UserInfo>('/api/user/info')

// 数据会自动更新到 data.value
// loading.value 表示请求状态
// error.value 表示错误信息
// execute() 可以手动触发请求
```

### 简单 POST 请求

```typescript
import { usePost } from 'vue3-tools'

const { data, loading, error } = usePost<CreateResult>(
  '/api/user/create',
  { name: 'John', age: 30 }
)
```

### 使用 useAxiosFetch

```typescript
import { useAxiosFetch } from 'vue3-tools'

const { data, loading, error, execute } = useAxiosFetch<UserInfo>(
  '/api/user/info',
  {
    method: 'GET',
    immediate: true, // 是否立即执行
  }
)
```

## 高级用法

### 链式调用

```typescript
const { data, loading, execute } = useAxiosFetch('/api/data')
  .post({ name: 'test' })
  .json()
  .execute()
```

### 请求拦截器

```typescript
const { data, loading } = useAxiosFetch('/api/data', {
  // 请求前拦截器
  beforeFetch: async ({ url, options, cancel }) => {
    // 可以修改 URL 或配置
    options.headers = {
      ...options.headers,
      'Authorization': 'Bearer token'
    }
    
    // 可以取消请求
    // cancel()
    
    return {
      url,
      options
    }
  },
  
  // 响应后拦截器
  afterFetch: async ({ data, response }) => {
    // 可以修改响应数据
    if (data.code === 200) {
      return { data: data.data, response }
    }
    
    // 可以抛出错误触发错误处理
    if (data.code === 401) {
      throw new Error('未授权')
    }
    
    // 可以返回 Promise.reject 触发错误处理
    // return Promise.reject(new Error('处理失败'))
    
    return { data, response }
  },
  
  // 错误拦截器
  onFetchError: async ({ error, data, response }) => {
    console.error('请求失败:', error)
    
    // 可以修改错误信息
    return {
      error: new Error('自定义错误信息'),
      data: null // 可选，配合 updateDataOnError 使用
    }
  }
})
```

### 自动重试

```typescript
const { data, loading } = useAxiosFetch('/api/data', {
  retry: true,           // 启用重试
  retryCount: 3,        // 最多重试 3 次
  retryDelay: 1000,     // 每次重试延迟 1 秒
  // 或使用函数动态计算延迟
  retryDelay: (attempt) => {
    // 指数退避：第 1 次 1 秒，第 2 次 2 秒，第 3 次 4 秒
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000)
  }
})
```

**重试机制说明：**
- 自动识别可重试的错误类型：超时错误、网络错误、服务器错误（5xx）
- 重试期间不会显示错误提示（避免重复提示）
- 最后一次重试失败后才会触发错误处理

### 网络状态监听

```typescript
const { data, loading } = useAxiosFetch('/api/data', {
  refetchOnReconnect: true, // 网络恢复后自动重新请求
})
```

### 页面可见性监听

```typescript
const { data, loading } = useAxiosFetch('/api/data', {
  refetchOnFocus: true,  // 页面可见时自动重新请求
  cancelOnBlur: true,    // 页面不可见时取消请求
})
```

### 响应式 URL

```typescript
import { ref } from 'vue'
import { useAxiosFetch } from 'vue3-tools'

const userId = ref(1)
const { data, loading } = useAxiosFetch(
  () => `/api/user/${userId.value}`, // 响应式 URL
  {
    refetch: true, // URL 变化时自动重新请求
  }
)

// 修改 userId 会自动触发新的请求
userId.value = 2
```

### FormData 请求和响应

#### 发送 FormData 请求

```typescript
import { usePost } from 'vue3-tools'

// 方式1：直接传入 FormData
const formData = new FormData()
formData.append('name', 'test')
formData.append('file', fileBlob)

const { data, loading } = usePost('/api/upload', formData, {
  responseType: 'form' // 可选，用于接收 FormData 响应
})

// 方式2：传入普通对象，自动转换为 FormData（当 responseType 为 'form' 时）
const { data, loading } = usePost('/api/upload', {
  name: 'test',
  file: fileBlob
}, {
  responseType: 'form' // 会自动将普通对象转换为 FormData
})

// 方式3：使用链式调用
const { data, loading, execute } = useAxiosFetch('/api/upload')
  .post({ name: 'test', file: fileBlob })
  .form() // 设置 responseType 为 'form'
```

**注意：**
- 当发送 FormData 时，Content-Type 会自动设置为 `multipart/form-data`（包括 boundary）
- 不要手动设置 Content-Type，浏览器/axios 会自动处理
- `responseType: 'form'` 用于接收 FormData 格式的响应，发送时如果数据不是 FormData 会自动转换

#### 接收 FormData 响应

```typescript
import { useGet } from 'vue3-tools'

const { data, loading } = useGet('/api/form-data', {}, {
  responseType: 'form' // 响应会被解析为 FormData
})

// data.value 是 FormData 类型
if (data.value instanceof FormData) {
  data.value.forEach((value, key) => {
    console.log(key, value)
  })
}
```

### 多种响应类型

支持以下响应类型：

- `json`：JSON 格式（默认）
- `text`：纯文本
- `blob`：二进制数据（用于文件下载等）
- `arraybuffer`：ArrayBuffer 格式
- `document`：HTML 文档（解析为 Document 对象）
- `form`：FormData 格式

```typescript
// 下载文件（Blob）
const { data, loading, execute } = useGet('/api/download', {}, {
  responseType: 'blob'
})

await execute()
if (data.value instanceof Blob) {
  const url = window.URL.createObjectURL(data.value)
  const link = document.createElement('a')
  link.href = url
  link.download = 'file.pdf'
  link.click()
}

// 接收 HTML 文档（Document）
const { data, loading } = useGet('/api/page', {}, {
  responseType: 'document'
})
// data.value 是 Document 类型

// 接收 FormData
const { data, loading } = useGet('/api/form', {}, {
  responseType: 'form'
})
// data.value 是 FormData 类型
```

### 延迟执行

```typescript
const { data, loading, execute } = useAxiosFetch('/api/data', {
  immediate: false, // 不立即执行
})

// 稍后手动触发
setTimeout(() => {
  execute()
}, 1000)
```

### 取消请求

```typescript
const { data, loading, abort, canAbort } = useAxiosFetch('/api/data')

// 检查是否可以取消
if (canAbort.value) {
  abort() // 取消请求
}
```

### 响应和错误钩子

```typescript
const { onFetchResponse, onFetchError } = useAxiosFetch('/api/data')

// 添加响应钩子
onFetchResponse((response) => {
  console.log('请求成功:', response)
})

// 添加错误钩子
onFetchError((error) => {
  console.error('请求失败:', error)
})
```

### Promise 版本（非响应式）

如果不需要响应式数据，可以使用 Promise 版本：

```typescript
import { useGetPromise, usePostPromise } from 'vue3-tools'

// GET 请求
const result = await useGetPromise<UserInfo>('/api/user/info', { id: 1 })
if (result.error) {
  console.error(result.error)
} else {
  console.log(result.data) // UserInfo 类型
}

// POST 请求
const result = await usePostPromise<CreateResult>('/api/user/create', {
  name: 'John',
  age: 30
})
if (result.error) {
  console.error(result.error)
} else {
  console.log(result.data) // CreateResult 类型
}
```

**Promise 版本的特点：**
- 返回 Promise，不会自动执行请求
- 只执行一次请求（不会重复）
- 适合在函数中使用，不需要响应式数据
- 错误处理通过返回值的 `error` 字段

### 自定义参数传递

```typescript
const { data, loading } = useAxiosFetch('/api/data', {
  customOptions: {
    showLoading: true,
    showError: true,
  },
  beforeFetch: ({ customOptions }) => {
    if (customOptions?.showLoading) {
      // 显示加载提示
    }
  }
})
```

### 错误时更新数据

```typescript
const { data, loading } = useAxiosFetch('/api/data', {
  updateDataOnError: true, // 允许在错误时更新数据
  onFetchError: async ({ error, data }) => {
    return {
      error,
      data: { /* 默认数据 */ } // 错误时使用默认数据
    }
  }
})
```

### 调试模式

```typescript
const { data, loading } = useAxiosFetch('/api/data', {
  retry: true,
  debug: true, // 启用调试模式，会在控制台输出详细的请求和响应信息
})
```

## API 参考

### useAxiosFetch

主要的 Hook 函数。

#### 参数

```typescript
function useAxiosFetch<T = any>(
  url: MaybeRefOrGetter<string>,
  fetchOptions?: UseAxiosFetchOptions<T>
): UseAxiosFetchReturn<T>
```

#### 选项 (UseAxiosFetchOptions)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `immediate` | `boolean` | `true` | 是否立即执行请求 |
| `refetch` | `boolean` | `false` | URL 变化时是否自动重新请求 |
| `timeout` | `number` | - | 请求超时时间（毫秒） |
| `method` | `string` | `'GET'` | HTTP 方法 |
| `data` | `any` | - | 请求体数据 |
| `params` | `any` | - | 查询参数 |
| `headers` | `Record<string, string>` | - | 请求头 |
| `responseType` | `'json' \| 'text' \| 'blob' \| 'arraybuffer' \| 'document' \| 'form'` | `'json'` | 响应类型 |
| `initialData` | `T` | - | 初始数据 |
| `beforeFetch` | `BeforeFetch<T>` | - | 请求前拦截器 |
| `afterFetch` | `AfterFetch<T>` | - | 响应后拦截器 |
| `onFetchError` | `OnFetchError<T>` | - | 错误拦截器 |
| `updateDataOnError` | `boolean` | `false` | 是否在错误时更新数据 |
| `retry` | `boolean` | `false` | 是否启用重试 |
| `retryCount` | `number` | `3` | 重试次数 |
| `retryDelay` | `number \| ((attempt: number) => number)` | `0` | 重试延迟（毫秒） |
| `refetchOnReconnect` | `boolean` | `false` | 网络恢复后是否自动重新请求 |
| `refetchOnFocus` | `boolean` | `false` | 页面可见时是否自动重新请求 |
| `cancelOnBlur` | `boolean` | `false` | 页面不可见时是否取消请求 |
| `customOptions` | `Record<string, any>` | - | 自定义参数 |
| `debug` | `boolean` | `false` | 是否启用调试模式 |

#### 返回值 (UseAxiosFetchReturn)

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | `Ref<T \| undefined>` | 响应数据 |
| `error` | `Ref<Error \| undefined>` | 错误信息 |
| `loading` | `Ref<boolean>` | 是否正在请求 |
| `isFinished` | `Ref<boolean>` | 是否已完成 |
| `statusCode` | `Ref<number \| null>` | HTTP 状态码 |
| `canAbort` | `Ref<boolean>` | 是否可以取消 |
| `aborted` | `Ref<boolean>` | 是否已取消 |
| `execute` | `() => Promise<{ data: T \| undefined; error: Error \| undefined }>` | 执行请求 |
| `abort` | `() => void` | 取消请求 |
| `onFetchResponse` | `(callback: (response: AxiosResponse<T>) => void \| Promise<void>) => void` | 添加响应钩子 |
| `onFetchError` | `(callback: (error: unknown) => void \| Promise<void>) => void` | 添加错误钩子 |
| `get` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置 GET 方法 |
| `post` | `(data?: any) => UseAxiosFetchReturn<T>` | 链式调用：设置 POST 方法 |
| `put` | `(data?: any) => UseAxiosFetchReturn<T>` | 链式调用：设置 PUT 方法 |
| `delete` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置 DELETE 方法 |
| `patch` | `(data?: any) => UseAxiosFetchReturn<T>` | 链式调用：设置 PATCH 方法 |
| `json` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置响应类型为 JSON |
| `text` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置响应类型为文本 |
| `blob` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置响应类型为 Blob |
| `arraybuffer` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置响应类型为 ArrayBuffer |
| `document` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置响应类型为 Document |
| `form` | `() => UseAxiosFetchReturn<T>` | 链式调用：设置响应类型为 FormData |

### useGet

GET 请求的便捷封装。

```typescript
function useGet<T = any>(
  url: MaybeRefOrGetter<string>,
  params?: Record<string, any>,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'params' | 'customOptions'>,
  customOptions?: Record<string, any>
): UseAxiosFetchReturn<T>
```

### usePost

POST 请求的便捷封装。

```typescript
function usePost<T = any>(
  url: MaybeRefOrGetter<string>,
  data?: any,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'data' | 'customOptions'>,
  customOptions?: Record<string, any>
): UseAxiosFetchReturn<T>
```

### useGetPromise

GET 请求的 Promise 版本，返回 Promise 而非响应式对象。

```typescript
function useGetPromise<T = any>(
  url: MaybeRefOrGetter<string>,
  params?: Record<string, any>,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'params' | 'customOptions'>,
  customOptions?: Record<string, any>
): Promise<{ data: T; error: undefined } | { data: undefined; error: Error }>
```

**使用示例：**

```typescript
import { useGetPromise } from 'vue3-tools'

const result = await useGetPromise<UserInfo>('/api/user/info', { id: 1 })
if (result.error) {
  console.error(result.error)
} else {
  console.log(result.data) // UserInfo 类型
}
```

### usePostPromise

POST 请求的 Promise 版本，返回 Promise 而非响应式对象。

```typescript
function usePostPromise<T = any>(
  url: MaybeRefOrGetter<string>,
  data?: any,
  options?: Omit<UseAxiosFetchOptions<T>, 'method' | 'data' | 'customOptions'>,
  customOptions?: Record<string, any>
): Promise<{ data: T; error: undefined } | { data: undefined; error: Error }>
```

**使用示例：**

```typescript
import { usePostPromise } from 'vue3-tools'

const result = await usePostPromise<CreateResult>('/api/user/create', {
  name: 'John',
  age: 30
})
if (result.error) {
  console.error(result.error)
} else {
  console.log(result.data) // CreateResult 类型
}
```

## 拦截器类型

### BeforeFetch

请求前拦截器。

```typescript
type BeforeFetch<T = any> = (
  ctx: BeforeFetchContext
) => Promise<BeforeFetchResult | void> | BeforeFetchResult | void

interface BeforeFetchContext {
  url: string
  options: AxiosRequestConfig
  cancel: () => void
  customOptions?: Record<string, any>
}

interface BeforeFetchResult {
  url?: string
  options?: AxiosRequestConfig
}
```

### AfterFetch

响应后拦截器。

```typescript
type AfterFetch<T = any> = (
  ctx: AfterFetchContext<T>
) => AfterFetchReturn<T>

interface AfterFetchContext<T = any> {
  data: T
  response: AxiosResponse<T>
  customOptions?: Record<string, any>
}

// 返回值类型
type AfterFetchReturn<T = any> =
  | AfterFetchResult<T>
  | string
  | Error
  | Promise<AfterFetchResult<T>>
  | Promise<string>
  | Promise<Error>
  | Promise<never>
```

**返回值说明：**
- 返回 `AfterFetchResult`：使用返回的数据替换原始数据
- 返回 `string`：保持原数据不变（通常用于表示成功状态）
- 返回 `Error` 或 `Promise.reject`：触发错误处理流程

### OnFetchError

错误拦截器。

```typescript
type OnFetchError<T = any> = (
  ctx: OnFetchErrorContext<T>
) => OnFetchErrorResult<T>

interface OnFetchErrorContext<T = any> {
  error: any
  data: T | null
  response: AxiosResponse<T> | null
  customOptions?: Record<string, any>
}

interface OnFetchErrorResult<T = any> {
  error?: any
  data?: T
}
```

## 最佳实践

### 1. 类型安全

始终为请求指定类型：

```typescript
interface UserInfo {
  id: number
  name: string
  email: string
}

const { data } = useGet<UserInfo>('/api/user/info')
// data.value 的类型是 UserInfo | undefined
```

### 2. 错误处理

使用错误拦截器统一处理错误：

```typescript
const { data, error } = useAxiosFetch('/api/data', {
  onFetchError: async ({ error, response }) => {
    if (response?.status === 401) {
      // 处理未授权
      router.push('/login')
    } else if (response?.status === 500) {
      // 处理服务器错误
      ElMessage.error('服务器错误，请稍后重试')
    }
    return { error }
  }
})
```

### 3. 请求取消

在组件卸载时自动取消请求：

```typescript
import { onUnmounted } from 'vue'

const { abort, canAbort } = useAxiosFetch('/api/data')

onUnmounted(() => {
  if (canAbort.value) {
    abort()
  }
})
```

### 4. 响应式 URL

使用计算属性创建响应式 URL：

```typescript
import { computed } from 'vue'

const userId = ref(1)
const url = computed(() => `/api/user/${userId.value}`)

const { data } = useAxiosFetch(url, {
  refetch: true
})
```

### 5. 重试策略

根据业务场景选择合适的重试策略：

```typescript
// 快速重试（适合临时网络问题）
const { data } = useAxiosFetch('/api/data', {
  retry: true,
  retryCount: 3,
  retryDelay: 500
})

// 指数退避（适合服务器压力大的情况）
const { data } = useAxiosFetch('/api/data', {
  retry: true,
  retryCount: 5,
  retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt - 1), 10000)
})
```

### 6. 数据转换

使用 `afterFetch` 转换响应数据：

```typescript
const { data } = useAxiosFetch('/api/data', {
  afterFetch: async ({ data, response }) => {
    // 转换数据格式
    return {
      data: {
        ...data,
        createdAt: new Date(data.createdAt)
      },
      response
    }
  }
})
```

## 注意事项

1. **响应式 URL**：使用响应式 URL 时，需要设置 `refetch: true` 才能自动重新请求
2. **重试机制**：重试只针对超时、网络错误和服务器错误（5xx），不会重试客户端错误（4xx）
3. **取消请求**：取消请求后，`aborted.value` 会变为 `true`，但不会触发错误处理
4. **拦截器返回值**：`afterFetch` 返回字符串时不会修改数据，通常用于表示成功状态
5. **错误处理**：`afterFetch` 返回 `Error` 或 `Promise.reject` 会触发 `onFetchError` 拦截器
6. **FormData Content-Type**：发送 FormData 时，不要手动设置 Content-Type，浏览器/axios 会自动设置 `multipart/form-data`（包括 boundary）。手动设置会导致缺少 boundary，服务器无法正确解析
7. **responseType 说明**：
   - `responseType` 是响应类型，用于指定如何解析响应数据
   - `responseType` 不影响请求的 Content-Type，请求的 Content-Type 由请求数据决定
   - 当 `responseType` 为 `'form'` 时，如果发送的数据不是 FormData，会自动转换为 FormData
8. **GET 请求参数**：GET 请求的参数会自动拼接到 URL 上，axios 会自动处理，无需手动拼接
9. **Promise 版本**：`useGetPromise` 和 `usePostPromise` 不会自动执行请求，需要 await 调用，且只执行一次请求

## 常见问题

### Q: 如何禁用自动请求？

```typescript
const { execute } = useAxiosFetch('/api/data', {
  immediate: false
})

// 手动触发
execute()
```

### Q: 如何监听请求完成？

```typescript
const { isFinished, onFetchResponse, onFetchError } = useAxiosFetch('/api/data')

onFetchResponse(() => {
  console.log('请求成功完成')
})

onFetchError(() => {
  console.log('请求失败完成')
})
```

### Q: 如何判断请求是否成功？

```typescript
const { data, error, isFinished } = useAxiosFetch('/api/data')

watch([isFinished, error], ([finished, err]) => {
  if (finished && !err) {
    console.log('请求成功')
  } else if (finished && err) {
    console.log('请求失败')
  }
})
```

### Q: 重试时如何跳过某些错误？

重试机制会自动识别可重试的错误类型（超时、网络错误、服务器错误），无需手动配置。

## 导出说明

包提供了两种实现方式，功能基本一致：

### 基于 Axios 的实现（推荐）

需要安装 `axios` 依赖：

```bash
npm install axios
```

**导出方法：**
- `useAxiosFetch` - 主要 Hook
- `useGet` - GET 请求封装
- `usePost` - POST 请求封装
- `useGetPromise` - GET 请求 Promise 版本
- `usePostPromise` - POST 请求 Promise 版本
- `setDefaultAxiosFetchOptions` - 设置全局默认配置
- `getDefaultAxiosFetchOptions` - 获取全局默认配置
- `resetDefaultAxiosFetchOptions` - 重置全局默认配置

### 基于原生 Fetch API 的实现

无需额外依赖（除了 Vue）。

**导出方法：**
- `useFetch` - 主要 Hook
- `useFetchGet` - GET 请求封装
- `useFetchPost` - POST 请求封装
- `useFetchGetPromise` - GET 请求 Promise 版本
- `useFetchPostPromise` - POST 请求 Promise 版本
- `setDefaultFetchOptions` - 设置全局默认配置
- `getDefaultFetchOptions` - 获取全局默认配置
- `resetDefaultFetchOptions` - 重置全局默认配置

### 工具函数

- `toValue` - 将 MaybeRefOrGetter 转换为值
- `deepMerge` - 深度合并配置对象
- `createDefaultOptionsManager` - 创建全局默认配置管理器
- `getRetryDelay` - 计算重试延迟时间
- `mergeUrlParams` - 合并 URL 参数
- `isTimeoutError` - 判断是否为超时错误
- `isNetworkError` - 判断是否为网络错误
- `isServerError` - 判断是否为服务器错误
- `shouldRetry` - 判断是否应该重试请求

## 两种实现对比

项目提供了两种实现方式，功能基本一致：

### useAxiosFetch（推荐）

**特点：**
- 基于 Axios，功能更完善
- 自动处理请求/响应拦截器
- 更好的错误处理和类型支持
- 支持取消令牌（CancelToken）
- 自动处理 GET 请求的 params（拼接到 URL）

**特点：**
- 基于原生 Fetch API
- 更轻量，无额外依赖（除了 Vue）
- 需要手动处理某些场景
- 使用 AbortController 取消请求
- 手动处理 GET 请求的 params（拼接到 URL，避免重复）

**建议**：优先使用 `useAxiosFetch`，除非有特殊需求需要使用原生 Fetch API。

