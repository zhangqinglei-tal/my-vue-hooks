# useFetch

基于原生 Fetch API 的响应式数据请求 Hook，提供了完整的请求生命周期管理、错误处理、重试机制等功能。

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
- ✅ **FormData 支持**：自动处理 FormData 请求和响应
- ✅ **零依赖**：基于原生 Fetch API，无需安装 axios

## 安装

```bash
npm install my-hooks
# 或
pnpm add my-hooks
```

## 基础用法

<FetchDemo />

### 简单 GET 请求

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-hooks'

const { data, loading, error, execute } = useFetchGet<UserInfo>('/api/user/info')
</script>
```

### 简单 POST 请求

```vue
<script setup lang="ts">
import { useFetchPost } from 'my-hooks'

const { data, loading, error } = useFetchPost<CreateResult>(
  '/api/user/create',
  { name: 'John', age: 30 }
)
</script>
```

### 使用 useFetch

```vue
<script setup lang="ts">
import { useFetch } from 'my-hooks'

const { data, loading, error, execute } = useFetch<UserInfo>(
  '/api/user/info',
  {
    method: 'GET',
    immediate: true, // 是否立即执行
  }
)
</script>
```

## 高级用法

### 链式调用

```ts
const { data, loading, execute } = useFetch('/api/data')
  .post({ name: 'test' })
  .json()
  .execute()
```

### 请求拦截器

```ts
const { data, loading } = useFetch('/api/data', {
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
    
    return { data, response }
  },
  
  // 错误拦截器
  onFetchError: async ({ error, data, response }) => {
    console.error('请求失败:', error)
    
    // 可以修改错误信息
    return {
      error: new Error('自定义错误信息'),
      data: null
    }
  }
})
```

### 自动重试

```ts
const { data, loading } = useFetch('/api/data', {
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

```ts
const { data, loading } = useFetch('/api/data', {
  refetchOnReconnect: true, // 网络恢复后自动重新请求
})
```

### 页面可见性监听

```ts
const { data, loading } = useFetch('/api/data', {
  refetchOnFocus: true,  // 页面可见时自动重新请求
  cancelOnBlur: true,    // 页面不可见时取消请求
})
```

### 响应式 URL

```ts
import { ref } from 'vue'
import { useFetch } from 'my-hooks'

const userId = ref(1)
const { data, loading } = useFetch(
  () => `/api/user/${userId.value}`, // 响应式 URL
  {
    refetch: true, // URL 变化时自动重新请求
  }
)

// 修改 userId 会自动触发新的请求
userId.value = 2
```

### FormData 请求

```ts
import { useFetchPost } from 'my-hooks'

// 方式1：直接传入 FormData
const formData = new FormData()
formData.append('name', 'test')
formData.append('file', fileBlob)

const { data, loading } = useFetchPost('/api/upload', formData, {
  responseType: 'form' // 可选，用于接收 FormData 响应
})

// 方式2：传入普通对象，自动转换为 FormData
const { data, loading } = useFetchPost('/api/upload', {
  name: 'test',
  file: fileBlob
}, {
  responseType: 'form' // 会自动将普通对象转换为 FormData
})
```

### Promise 版本

如果不需要响应式，可以使用 Promise 版本：

```ts
import { useFetchGetPromise, useFetchPostPromise } from 'my-hooks'

// GET 请求
const data = await useFetchGetPromise<UserInfo>('/api/user/info')

// POST 请求
const result = await useFetchPostPromise<CreateResult>(
  '/api/user/create',
  { name: 'John', age: 30 }
)
```

## API

### useFetch

```ts
function useFetch<T = any>(
  url: MaybeRefOrGetter<string>,
  options?: UseFetchOptions
): UseFetchReturn<T>
```

#### 主要选项

```ts
interface UseFetchOptions {
  method?: string              // 请求方法
  immediate?: boolean          // 是否立即执行
  refetch?: boolean           // URL 变化时是否重新请求
  retry?: boolean             // 是否启用重试
  retryCount?: number         // 重试次数
  retryDelay?: number | ((attempt: number) => number)  // 重试延迟
  timeout?: number             // 超时时间（毫秒）
  beforeFetch?: BeforeFetch   // 请求前拦截器
  afterFetch?: AfterFetch     // 响应后拦截器
  onFetchError?: OnFetchError // 错误拦截器
  refetchOnReconnect?: boolean // 网络恢复后重新请求
  refetchOnFocus?: boolean    // 页面可见时重新请求
  cancelOnBlur?: boolean      // 页面不可见时取消请求
}
```

#### 返回值

```ts
interface UseFetchReturn<T> {
  data: Ref<T | null>         // 响应数据
  loading: Ref<boolean>        // 加载状态
  error: Ref<Error | null>     // 错误信息
  execute: () => Promise<void> // 手动执行请求
  cancel: () => void           // 取消请求
  abort: () => void            // 中止请求（同 cancel）
}
```

### 快捷方法

```ts
// 原生 Fetch API
useFetchGet<T>(url, options?)
useFetchPost<T>(url, data?, options?)
useFetchGetPromise<T>(url, options?)
useFetchPostPromise<T>(url, data?, options?)
```

## 默认配置

可以通过 `setDefaultFetchOptions` 设置全局默认配置：

```ts
import { setDefaultFetchOptions } from 'my-hooks'

setDefaultFetchOptions({
  timeout: 10000,
  retry: true,
  retryCount: 3,
  retryDelay: 1000,
  beforeFetch: ({ options }) => {
    options.headers = {
      ...options.headers,
      'Authorization': 'Bearer token'
    }
    return { options }
  }
})
```

## 工具函数

```ts
import {
  isTimeoutError,
  isNetworkError,
  isServerError,
  shouldRetry,
  mergeUrlParams
} from 'my-hooks'

// 判断错误类型
if (isTimeoutError(error)) {
  // 处理超时错误
}

// 合并 URL 参数
const url = mergeUrlParams('/api/data', { page: 1, size: 10 })
// => '/api/data?page=1&size=10'
```

## 相关

- [useAxiosFetch](/hooks/useAxiosFetch) - 基于 Axios 的数据请求 Hook
- [useTableRequest](/hooks/useTableRequest) - 表格数据管理 Hook
