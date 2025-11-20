# useTable

基于 Vue 3 Composition API 的表格数据管理 Hook，提供完整的分页、请求和数据过滤功能。

## 特性

- 🚀 支持 API 请求和静态数据两种模式
- 📄 内置分页功能，支持自定义配置
- 🔄 自动请求和参数变化自动刷新
- 🎯 灵活的字段映射配置
- 🔍 静态数据支持自定义过滤
- 💪 完整的 TypeScript 支持

## 安装

```bash
npm install vue3-tools
```

## 使用方法

### 1. API 请求模式 - useTableRequest

用于处理需要发送 HTTP 请求获取数据的表格场景。

#### 基础用法

```vue
<template>
  <div>
    <el-table :data="data" v-loading="loading">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="age" label="年龄" />
    </el-table>
    
    <el-pagination
      v-if="pagination"
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :total="total"
      :page-sizes="pagination.pageSizesList"
      @current-change="changePage"
      @size-change="changePageSize"
    />
  </div>
</template>

<script setup lang="ts">
import { useTableRequest } from 'vue3-tools'

interface User {
  id: number
  name: string
  age: number
}

const { data, loading, pagination, total, refresh, changePage, changePageSize } = useTableRequest<User>({
  fetcher: async (params) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    })
    return await response.json()
  },
  params: {
    status: 'active'
  }
})
</script>
```

#### 高级配置

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTableRequest } from 'vue3-tools'

const searchForm = ref({
  keyword: '',
  status: 'active'
})

const { 
  data, 
  loading, 
  pagination, 
  total, 
  refresh,
  reset,
  updateParams 
} = useTableRequest({
  fetcher: async (params) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    })
    return await response.json()
  },
  params: searchForm.value,
  autoFetch: true, // 组件挂载时自动请求
  autoFetchOnParamsChange: true, // 参数变化时自动请求
  
  // 分页配置
  pagination: {
    currentPage: 1,
    pageSize: 20,
    pageSizesList: [10, 20, 50, 100]
  },
  
  // 请求参数映射配置
  requestKeyConfig: {
    pageIndexKey: 'page', // 请求参数中的页码字段名
    pageSizeKey: 'size' // 请求参数中的每页条数字段名
  },
  
  // 响应数据映射配置
  responseKeyConfig: {
    dataKey: 'data.list', // 响应数据中的列表字段路径（支持点号分隔）
    totalKey: 'data.total' // 响应数据中的总数字段路径（支持点号分隔）
  },
  
  // 请求前处理
  beforeFetch: (params) => {
    console.log('Request params:', params)
    // 可以修改参数
    return {
      ...params,
      timestamp: Date.now()
    }
  },
  
  // 请求成功后处理
  afterFetch: (data) => {
    console.log('Response data:', data)
    // 可以对数据进行转换
    return data.map(item => ({
      ...item,
      fullName: `${item.firstName} ${item.lastName}`
    }))
  },
  
  // 错误处理
  onError: (error) => {
    console.error('Request failed:', error)
    // 可以显示错误提示
  }
})

// 搜索
const handleSearch = () => {
  updateParams(searchForm.value)
}

// 重置
const handleReset = () => {
  searchForm.value = {
    keyword: '',
    status: 'active'
  }
  reset() // 重置到第一页并刷新
}
</script>
```

#### 自定义请求函数

```vue
<script setup lang="ts">
import { useTableRequest } from 'vue3-tools'
import { myCustomRequest } from '@/api'

const { data, loading } = useTableRequest({
  fetcher: async (params) => {
    // 使用自定义的请求函数
    return await myCustomRequest('/api/users', params)
  },
  responseKeyConfig: {
    dataKey: 'result.items',
    totalKey: 'result.count'
  }
})
</script>
```

### 2. 静态数据模式 - useTableStatic

用于处理已有完整数据集，需要在前端进行分页和过滤的场景。

#### 基础用法

```vue
<template>
  <div>
    <el-input v-model="searchParams.keyword" placeholder="搜索..." @input="handleSearch" />
    
    <el-table :data="data" v-loading="loading">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="age" label="年龄" />
    </el-table>
    
    <el-pagination
      v-if="pagination"
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :total="total"
      :page-sizes="pagination.pageSizesList"
      @current-change="changePage"
      @size-change="changePageSize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTableStatic } from 'vue3-tools'

interface User {
  id: number
  name: string
  age: number
  city: string
}

// 所有数据
const allUsers = ref<User[]>([
  { id: 1, name: '张三', age: 25, city: '北京' },
  { id: 2, name: '李四', age: 30, city: '上海' },
  // ... 更多数据
])

// 搜索参数
const searchParams = ref({
  keyword: '',
  city: ''
})

const { 
  data, 
  loading, 
  pagination, 
  total, 
  changePage, 
  changePageSize,
  refresh
} = useTableStatic({
  data: allUsers, // 可以传入 ref 或普通数组
  
  // 自定义过滤函数
  filterFn: (item) => {
    // 关键词搜索（使用外部定义的 searchParams）
    if (searchParams.value.keyword) {
      const keyword = searchParams.value.keyword.toLowerCase()
      const matchName = item.name.toLowerCase().includes(keyword)
      const matchCity = item.city.toLowerCase().includes(keyword)
      if (!matchName && !matchCity) return false
    }
    
    // 城市筛选
    if (searchParams.value.city && item.city !== searchParams.value.city) {
      return false
    }
    
    return true
  },
  
  // 分页配置
  pagination: {
    currentPage: 1,
    pageSize: 10
  }
})

// 监听搜索参数变化，重新筛选
watch(
  () => [searchParams.value.keyword, searchParams.value.city],
  () => {
    refresh() // 刷新数据
  }
)
</script>
```

#### 响应式数据源

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTableStatic } from 'vue3-tools'

// 响应式数据源
const users = ref([
  { id: 1, name: '张三', status: 'active' },
  { id: 2, name: '李四', status: 'inactive' }
])

const searchParams = ref({ status: 'active' })

const { data, pagination, refresh } = useTableStatic({
  data: users, // 传入 ref，数据变化时自动更新
  filterFn: (item) => {
    return item.status === searchParams.value.status
  }
})

// 监听搜索参数变化
watch(() => searchParams.value.status, () => {
  refresh()
})

// 添加新数据
const addUser = () => {
  users.value.push({
    id: users.value.length + 1,
    name: '新用户',
    status: 'active'
  })
}

// 修改筛选条件
const changeStatus = (status: string) => {
  searchParams.value.status = status
}
</script>
```

## API

### useTableRequest 选项

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| fetcher | 请求函数（必需） | `(params: any) => Promise<any>` | - |
| params | 请求参数 | `any` | - |
| autoFetch | 是否自动发起请求 | `boolean` | `true` |
| autoFetchOnParamsChange | 参数变化时是否自动重新请求 | `boolean` | `true` |
| pagination | 分页配置 | `PaginationConfig` | - |
| requestKeyConfig | 请求参数映射配置 | `RequestKeyConfig` | - |
| responseKeyConfig | 响应数据映射配置 | `ResponseKeyConfig` | - |
| beforeFetch | 请求前的处理函数 | `(params: any) => any \| Promise<any>` | - |
| afterFetch | 请求成功后的处理函数 | `(data: any) => T[] \| Promise<T[]>` | - |
| onError | 请求失败后的处理函数 | `(error: any) => void` | - |

### useTableStatic 选项

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| data | 静态数据 | `T[] \| Ref<T[]>` | - |
| filterFn | 数据过滤函数 | `(item: T) => boolean` | - |
| pagination | 分页配置 | `PaginationConfig` | - |

### 返回值

两个方法都返回相同的接口：

| 属性/方法 | 说明 | 类型 |
| --- | --- | --- |
| data | 表格数据 | `Ref<T[]>` |
| loading | 加载状态 | `Ref<boolean>` |
| pagination | 分页状态 | `Ref<PaginationState>` |
| total | 总条数 | `Ref<number>` |
| refresh | 刷新数据（保持当前页） | `() => Promise<void>` |
| reset | 重置并刷新（回到第一页） | `() => Promise<void>` |
| changePage | 切换页码 | `(page: number) => Promise<void>` |
| changePageSize | 切换每页条数 | `(size: number) => Promise<void>` |
| updateParams | 更新请求参数（仅 useTableRequest） | `(params: any) => void` |

**注意**：由于使用了 `toRefs()`，所有响应式属性都是 `Ref` 类型。在模板中会自动解包，但在 script 中需要使用 `.value` 访问。

### PaginationConfig

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| currentPage | 当前页码 | `number` | `1` |
| pageSize | 每页显示条数 | `number` | `10` |
| pageSizesList | 每页显示条数选项 | `number[]` | `[10, 20, 50, 100]` |

**注意**：`pagination` 可以设置为 `false` 来禁用分页功能。当设置为 `false` 时，不会进行分页处理，也不会添加分页参数。

### RequestKeyConfig

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| pageIndexKey | 请求参数中页码的字段名 | `string` | `'pageIndex'` |
| pageSizeKey | 请求参数中每页条数的字段名 | `string` | `'pageSize'` |

### ResponseKeyConfig

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| dataKey | 响应数据中数据列表的字段名（支持点号分隔的路径） | `string` | `'data'` |
| totalKey | 响应数据中总数的字段名（支持点号分隔的路径） | `string` | `'total'` |
| pageIndexKey | 响应数据中页码的字段名（可选，用于同步页码） | `string` | `undefined` |

## 使用场景

### 场景 1: 服务端分页

```vue
<script setup lang="ts">
import { useTableRequest } from 'vue3-tools'

// 服务端返回格式: { data: { list: [], total: 100 } }
const table = useTableRequest({
  fetcher: async (params) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    })
    return await response.json()
  },
  responseKeyConfig: {
    dataKey: 'data.list',
    totalKey: 'data.total'
  }
})
</script>
```

### 场景 2: 前端分页

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTableStatic } from 'vue3-tools'

const allData = ref([...]) // 所有数据

const table = useTableStatic({
  data: allData,
  pagination: {
    pageSize: 20
  }
})
</script>
```

### 场景 3: 带搜索的前端分页

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTableStatic } from 'vue3-tools'

const allData = ref([...])
const keyword = ref('')

const keyword = ref('')

const table = useTableStatic({
  data: allData,
  filterFn: (item) => {
    if (!keyword.value) return true
    return item.name.includes(keyword.value)
  }
})

// 搜索时刷新数据
watch(keyword, () => {
  table.refresh()
})
</script>
```

### 场景 4: 禁用分页

```vue
<template>
  <div>
    <el-table :data="data" v-loading="loading">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="age" label="年龄" />
    </el-table>
    <!-- 禁用分页时，不显示分页器 -->
  </div>
</template>

<script setup lang="ts">
import { useTableRequest } from 'vue3-tools'

const { data, loading } = useTableRequest({
  fetcher: async (params) => {
    const response = await fetch('/api/all-users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return await response.json()
  },
  pagination: false // 禁用分页，获取所有数据，不会添加分页参数
})
</script>
```

## 注意事项

1. **参数变化监听**: 使用 `autoFetchOnParamsChange` 时，参数对象会被深度监听
2. **字段路径**: `responseKeyConfig.dataKey` 和 `responseKeyConfig.totalKey` 支持点号分隔的路径，如 `'data.result.list'`
3. **分页重置**: 参数变化时会自动重置到第一页，可以通过设置 `autoFetchOnParamsChange: false` 来禁用
4. **响应式数据**: `useTableStatic` 的 `data` 参数可以传入 `ref`，数据变化时会自动更新表格
5. **响应性保持**: 使用解构方式 `const { data, pagination } = useTableStatic(...)` 时，响应性会保持。在模板中可以直接使用，在 script 中需要使用 `.value` 访问
6. **必需参数**: `useTableRequest` 的 `fetcher` 参数是必需的，需要提供自定义的请求函数
7. **禁用分页**: 将 `pagination` 设置为 `false` 可以禁用分页功能。禁用后不会添加分页参数，也不会进行分页处理，适合获取所有数据的场景

## License

MIT

