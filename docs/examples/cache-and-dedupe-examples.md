# 缓存和请求队列使用示例

本文档提供了 `useFetch` 和 `useAxiosFetch` 的缓存和请求队列功能的详细使用示例。

## 目录

- [基础缓存使用](#基础缓存使用)
- [请求队列（去重）使用](#请求队列去重使用)
- [组合使用](#组合使用)
- [实际场景示例](#实际场景示例)
- [高级用法](#高级用法)

## 基础缓存使用

### 示例 1: 简单的 GET 请求缓存

```vue
<template>
  <div>
    <button @click="refresh">刷新数据</button>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <div v-else>{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'

// 启用缓存，默认缓存 5 分钟
const { data, loading, error, execute: refresh } = useFetchGet('/api/user/info', {}, {
  cache: true
})
</script>
```

### 示例 2: 自定义缓存时间

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'

// 缓存 10 分钟
const { data, loading } = useFetchGet('/api/products', {}, {
  cache: true,
  cacheTTL: 10 * 60 * 1000 // 10 分钟
})
</script>
```

### 示例 3: 自定义缓存键生成器

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'
import type { CacheKeyGenerator } from 'my-vue-hooks'

// 只基于 URL 和方法生成缓存键，忽略参数
const customKeyGenerator: CacheKeyGenerator = (config) => {
  return `${config.method}:${config.url}`
}

const { data, loading } = useFetchGet('/api/products', { page: 1 }, {
  cache: true,
  cacheKeyGenerator: customKeyGenerator
})

// 即使参数不同，也会使用相同的缓存
const { data: data2 } = useFetchGet('/api/products', { page: 2 }, {
  cache: true,
  cacheKeyGenerator: customKeyGenerator
})
</script>
```

### 示例 4: 手动管理缓存

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'
import { globalCacheManager } from 'my-vue-hooks'

const { data, loading, execute } = useFetchGet('/api/user/info', {}, {
  cache: true
})

// 清除特定缓存
const clearCache = () => {
  globalCacheManager.delete('GET:/api/user/info?&')
  execute() // 重新请求
}

// 清空所有缓存
const clearAllCache = () => {
  globalCacheManager.clear()
}

// 清理过期缓存
const cleanupExpired = () => {
  globalCacheManager.cleanup()
}

// 查看缓存统计
const viewStats = () => {
  const stats = globalCacheManager.getStats()
  console.log('缓存统计:', stats)
}
</script>
```

## 请求队列（去重）使用

### 示例 1: 防止重复请求

```vue
<template>
  <div>
    <button @click="handleClick" :disabled="loading">
      {{ loading ? '加载中...' : '获取数据' }}
    </button>
    <div v-if="data">{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'

const { data, loading, execute } = useFetchGet('/api/user/info', {}, {
  dedupe: true // 启用请求队列
})

// 快速点击按钮，只会发送一次请求
const handleClick = () => {
  execute()
}
</script>
```

### 示例 2: 多个组件共享请求

```vue
<!-- ComponentA.vue -->
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'

// 组件 A 请求用户信息
const { data: userInfo, loading } = useFetchGet('/api/user/info', {}, {
  dedupe: true
})
</script>

<!-- ComponentB.vue -->
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'

// 组件 B 也请求相同的用户信息
// 由于启用了 dedupe，两个组件会共享同一个请求
const { data: userInfo, loading } = useFetchGet('/api/user/info', {}, {
  dedupe: true
})
</script>
```

### 示例 3: 手动管理请求队列

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'
import { globalRequestQueue } from 'my-vue-hooks'

const { data, loading } = useFetchGet('/api/user/info', {}, {
  dedupe: true
})

// 取消队列中的请求
const cancelRequest = () => {
  globalRequestQueue.cancel('GET:/api/user/info?&')
}

// 清空所有队列
const clearQueue = () => {
  globalRequestQueue.clear()
}

// 查看队列统计
const viewQueueStats = () => {
  const stats = globalRequestQueue.getStats()
  console.log('队列统计:', stats)
}
</script>
```

## 组合使用

### 示例 1: 缓存 + 队列

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'

// 同时启用缓存和请求队列
const { data, loading } = useFetchGet('/api/user/info', {}, {
  cache: true,        // 启用缓存
  dedupe: true,      // 启用请求队列
  cacheTTL: 5 * 60 * 1000 // 缓存 5 分钟
})
</script>
```

**执行流程：**
1. 第一次请求：检查缓存 → 无缓存 → 执行请求 → 更新缓存
2. 第二次请求（缓存未过期）：检查缓存 → 有缓存 → 直接返回缓存
3. 第三次请求（缓存已过期，但第一个请求正在进行）：检查缓存 → 无缓存 → 检查队列 → 有相同请求 → 等待并共享结果

### 示例 2: 列表页面的优化

```vue
<template>
  <div>
    <div v-for="item in items" :key="item.id">
      <UserCard :user-id="item.userId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'
import UserCard from './UserCard.vue'

// 获取列表数据
const { data: items } = useFetchGet('/api/users', {}, {
  cache: true,
  cacheTTL: 2 * 60 * 1000 // 列表数据缓存 2 分钟
})
</script>
```

```vue
<!-- UserCard.vue -->
<template>
  <div v-if="user">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFetchGet } from 'my-vue-hooks'

const props = defineProps<{
  userId: number
}>()

// 每个卡片都请求用户详情
// 由于启用了 dedupe，相同用户的请求只会执行一次
const { data: user } = useFetchGet(
  computed(() => `/api/users/${props.userId}`),
  {},
  {
    dedupe: true,  // 去重：相同用户的请求只执行一次
    cache: true,  // 缓存：用户详情缓存 5 分钟
    cacheTTL: 5 * 60 * 1000
  }
)
</script>
```

## 实际场景示例

### 场景 1: 搜索功能优化

```vue
<template>
  <div>
    <input v-model="keyword" @input="handleSearch" placeholder="搜索..." />
    <div v-if="loading">搜索中...</div>
    <div v-else>
      <div v-for="item in results" :key="item.id">{{ item.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFetchGet } from 'my-vue-hooks'

const keyword = ref('')

// 使用缓存和队列优化搜索
const { data: results, loading, execute } = useFetchGet(
  () => `/api/search?q=${keyword.value}`,
  {},
  {
    cache: true,
    dedupe: true,  // 防止用户快速输入时重复请求
    cacheTTL: 2 * 60 * 1000, // 搜索结果缓存 2 分钟
    immediate: false
  }
)

const handleSearch = () => {
  if (keyword.value.trim()) {
    execute()
  }
}
</script>
```

### 场景 2: 数据看板

```vue
<template>
  <div class="dashboard">
    <MetricCard title="总用户数" :data="userCount" />
    <MetricCard title="总订单数" :data="orderCount" />
    <MetricCard title="总收入" :data="revenue" />
  </div>
</template>

<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'
import MetricCard from './MetricCard.vue'

// 所有指标都使用缓存和队列
const options = {
  cache: true,
  dedupe: true,
  cacheTTL: 1 * 60 * 1000, // 指标数据缓存 1 分钟
  refetch: true // 自动刷新
}

const { data: userCount } = useFetchGet('/api/metrics/users', {}, options)
const { data: orderCount } = useFetchGet('/api/metrics/orders', {}, options)
const { data: revenue } = useFetchGet('/api/metrics/revenue', {}, options)
</script>
```

### 场景 3: 无限滚动列表

```vue
<template>
  <div>
    <div v-for="item in allItems" :key="item.id">{{ item.name }}</div>
    <button v-if="hasMore" @click="loadMore" :disabled="loading">
      加载更多
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFetchGet } from 'my-vue-hooks'

const page = ref(1)
const allItems = ref<any[]>([])

const { data, loading, execute } = useFetchGet(
  () => `/api/items?page=${page.value}`,
  {},
  {
    cache: true,
    dedupe: true, // 防止快速点击"加载更多"时重复请求
    cacheTTL: 5 * 60 * 1000,
    immediate: false,
    afterFetch: ({ data }) => {
      // 合并数据
      allItems.value = [...allItems.value, ...data.items]
      return { data, response: {} as any }
    }
  }
)

const hasMore = computed(() => data.value?.hasMore ?? false)

const loadMore = () => {
  page.value++
  execute()
}
</script>
```

### 场景 4: 表单提交防重复

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" />
    <button type="submit" :disabled="loading">
      {{ loading ? '提交中...' : '提交' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFetchPost } from 'my-vue-hooks'

const form = ref({ name: '' })

// 使用 dedupe 防止重复提交
const { loading, execute } = useFetchPost(
  '/api/submit',
  () => form.value,
  {
    dedupe: true, // 防止用户快速点击提交按钮
    immediate: false
  }
)

const handleSubmit = () => {
  execute()
}
</script>
```

## 高级用法

### 示例 1: 条件缓存

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'
import type { CacheKeyGenerator } from 'my-vue-hooks'

// 只缓存 GET 请求
const cacheKeyGenerator: CacheKeyGenerator = (config) => {
  if (config.method === 'GET') {
    return `${config.method}:${config.url}?${JSON.stringify(config.params || {})}`
  }
  return null as any // POST 等请求不缓存
}

const { data } = useFetchGet('/api/data', {}, {
  cache: true,
  cacheKeyGenerator
})
</script>
```

### 示例 2: 基于用户角色的缓存

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-vue-hooks'
import { useUserStore } from '@/stores/user'
import type { CacheKeyGenerator } from 'my-vue-hooks'

const userStore = useUserStore()

// 缓存键包含用户角色，不同角色使用不同的缓存
const cacheKeyGenerator: CacheKeyGenerator = (config) => {
  return `${config.method}:${config.url}?role=${userStore.role}`
}

const { data } = useFetchGet('/api/data', {}, {
  cache: true,
  cacheKeyGenerator
})
</script>
```

### 示例 3: 定时清理缓存

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { globalCacheManager } from 'my-vue-hooks'

// 每 5 分钟清理一次过期缓存
let cleanupTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  cleanupTimer = setInterval(() => {
    globalCacheManager.cleanup()
    console.log('已清理过期缓存')
  }, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
  }
})
</script>
```

### 示例 4: 监控请求队列

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { globalRequestQueue } from 'my-vue-hooks'

// 监控请求队列状态
let monitorTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  monitorTimer = setInterval(() => {
    const stats = globalRequestQueue.getStats()
    if (stats.pendingRequests > 0 || stats.queuedRequests > 0) {
      console.log('请求队列状态:', stats)
    }
  }, 1000)
})

onUnmounted(() => {
  if (monitorTimer) {
    clearInterval(monitorTimer)
  }
})
</script>
```

### 示例 5: 全局配置缓存和队列

```ts
// main.ts 或 setup.ts
import { setDefaultFetchOptions } from 'my-vue-hooks'

// 全局启用缓存和队列
setDefaultFetchOptions({
  cache: true,
  dedupe: true,
  cacheTTL: 5 * 60 * 1000, // 默认缓存 5 分钟
})
```

## 最佳实践

1. **缓存策略**
   - 静态数据：使用较长的缓存时间（10-30 分钟）
   - 动态数据：使用较短的缓存时间（1-5 分钟）
   - 实时数据：不使用缓存或使用很短的缓存时间（几秒）

2. **队列使用**
   - 在列表页面中，为每个子组件启用 `dedupe`
   - 在搜索功能中，使用 `dedupe` 防止快速输入时的重复请求
   - 在表单提交中，使用 `dedupe` 防止重复提交

3. **组合使用**
   - 对于频繁访问的数据，同时启用缓存和队列
   - 对于一次性数据，只使用队列
   - 对于静态数据，只使用缓存

4. **性能优化**
   - 定期清理过期缓存
   - 监控缓存和队列的使用情况
   - 根据实际需求调整缓存大小和 TTL

