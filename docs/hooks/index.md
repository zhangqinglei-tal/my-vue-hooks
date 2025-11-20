# Hooks

所有可用的 Composition API hooks 列表。

## 状态管理

### [useCounter](/hooks/useCounter)

响应式计数器 hook，提供增加、减少、设置和重置功能。

```vue
<script setup lang="ts">
import { useCounter } from 'my-hooks'

const { count, inc, dec, reset } = useCounter(0)
</script>
```

### [useToggle](/hooks/useToggle)

切换布尔值或两个值之间的切换 hook。

```vue
<script setup lang="ts">
import { useToggle } from 'my-hooks'

const { value, toggle } = useToggle(false)
</script>
```

## 存储

### [useLocalStorage](/hooks/useLocalStorage)

响应式 localStorage hook，自动同步到 localStorage。

```vue
<script setup lang="ts">
import { useLocalStorage } from 'my-hooks'

const name = useLocalStorage('name', 'Vue')
</script>
```

## 数据请求

### [useFetch](/hooks/useFetch)

基于原生 Fetch API 的响应式数据请求 hook，零依赖，提供完整的请求生命周期管理。

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-hooks'

const { data, loading, error } = useFetchGet('/api/user/info')
</script>
```

### [useAxiosFetch](/hooks/useAxiosFetch)

基于 Axios 的响应式数据请求 hook，完全兼容 Axios 配置和拦截器。

```vue
<script setup lang="ts">
import { useAxiosGet } from 'my-hooks'

const { data, loading, error } = useAxiosGet('/api/user/info')
</script>
```

## 表格管理

### [useTableRequest](/hooks/useTableRequest)

用于处理需要发送 HTTP 请求获取数据的表格场景，提供完整的分页和请求管理。

```vue
<script setup lang="ts">
import { useTableRequest } from 'my-hooks'

const { data, loading, pagination, total } = useTableRequest({
  fetcher: async (params) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    return res.json()
  }
})
</script>
```

### [useTableStatic](/hooks/useTableStatic)

用于处理已有完整数据集，需要在前端进行分页和过滤的场景。

```vue
<script setup lang="ts">
import { useTableStatic } from 'my-hooks'

const { data, loading, pagination, total } = useTableStatic({
  data: allUsers,
  pagination: { currentPage: 1, pageSize: 10 }
})
</script>
```

## 完整列表

- [useCounter](/hooks/useCounter) - 响应式计数器
- [useToggle](/hooks/useToggle) - 切换布尔值
- [useLocalStorage](/hooks/useLocalStorage) - 响应式 localStorage
- [useFetch](/hooks/useFetch) - 基于原生 Fetch API 的数据请求
- [useAxiosFetch](/hooks/useAxiosFetch) - 基于 Axios 的数据请求
- [useTableRequest](/hooks/useTableRequest) - API 请求表格管理
- [useTableStatic](/hooks/useTableStatic) - 静态数据表格管理

## 按需导入

所有 hooks 都支持按需导入，减少打包体积：

```ts
// 从主入口导入
import { useCounter, useToggle, useFetchGet, useAxiosGet, useTableRequest, useTableStatic } from 'my-hooks'

// 从具体路径导入（更好的 tree shaking）
import { useCounter } from 'my-hooks/hooks/useCounter'
import { useToggle } from 'my-hooks/hooks/useToggle'
import { useFetchGet } from 'my-hooks/hooks/useFetch'
import { useAxiosGet } from 'my-hooks/hooks/useFetch'
import { useTableRequest } from 'my-hooks/hooks/useTable'
import { useTableStatic } from 'my-hooks/hooks/useTable'
```

