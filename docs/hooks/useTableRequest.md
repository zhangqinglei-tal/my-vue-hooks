# useTableRequest

用于处理需要发送 HTTP 请求获取数据的表格场景，提供完整的分页、请求和数据管理功能。

## 特性

- 🚀 支持 API 请求获取表格数据
- 📄 内置分页功能，支持自定义配置
- 🔄 自动请求和参数变化自动刷新
- 🎯 灵活的字段映射配置
- 💪 完整的 TypeScript 支持

## 安装

```bash
npm install my-vue-hooks
# 或
pnpm add my-vue-hooks
```

## 基础用法

<TableRequestDemo />

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
import { useTableRequest } from 'my-vue-hooks'

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

## 高级配置

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTableRequest } from 'my-vue-hooks'

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
    return {
      ...params,
      timestamp: Date.now()
    }
  },
  
  // 请求成功后处理
  afterFetch: (data) => {
    return data.map(item => ({
      ...item,
      fullName: `${item.firstName} ${item.lastName}`
    }))
  },
  
  // 错误处理
  onError: (error) => {
    console.error('Request failed:', error)
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

## API

### useTableRequest

```ts
function useTableRequest<T = any>(
  options: UseTableRequestOptions<T>
): UseTableReturn<T>
```

#### 参数

```ts
interface UseTableRequestOptions<T> {
  // 请求函数
  fetcher: (params: any) => Promise<any>
  
  // 请求参数
  params?: any
  
  // 是否自动请求（组件挂载时）
  autoFetch?: boolean
  
  // 参数变化时是否自动请求
  autoFetchOnParamsChange?: boolean
  
  // 分页配置，设置为 false 时禁用分页
  pagination?: PaginationConfig | false
  
  // 请求参数映射配置
  requestKeyConfig?: RequestKeyConfig
  
  // 响应数据映射配置
  responseKeyConfig?: ResponseKeyConfig
  // dataKey: 数据列表字段路径（支持点号分隔，如 'data.list'）
  // totalKey: 总数字段路径（支持点号分隔，如 'data.total'）
  // pageIndexKey: 页码字段路径（可选，用于从响应中同步页码）
  
  // 请求前处理
  beforeFetch?: (params: any) => any | Promise<any>
  
  // 请求成功后处理
  afterFetch?: (data: any[]) => T[] | Promise<T[]>
  
  // 错误处理
  onError?: (error: any) => void
}
```

#### 返回值

```ts
interface UseTableReturn<T> {
  data: Ref<T[]>           // 表格数据
  loading: Ref<boolean>    // 加载状态
  pagination: Ref<PaginationState>  // 分页状态
  total: Ref<number>       // 总条数
  refresh: () => Promise<void>      // 刷新数据（保持当前页）
  reset: () => Promise<void>        // 重置到第一页并刷新
  changePage: (page: number) => Promise<void>  // 切换页码
  changePageSize: (size: number) => Promise<void>  // 切换每页条数
  updateParams: (params: any) => void  // 更新请求参数
}
```

**注意：** 由于使用了 `toRefs()`，所有响应式属性都是 `Ref` 类型。在模板中会自动解包，但在 script 中需要使用 `.value` 访问。

## 高级用法

### 禁用分页

如果需要获取所有数据而不进行分页：

```vue
<script setup lang="ts">
const { data, loading } = useTableRequest({
  fetcher: async (params) => {
    const response = await fetch('/api/all-users')
    return await response.json()
  },
  pagination: false // 禁用分页，不会添加分页参数
})
</script>
```

### 同步响应中的页码

如果后端响应中包含当前页码，可以通过 `responseKeyConfig.pageIndexKey` 同步：

```ts
const { data, pagination } = useTableRequest({
  fetcher: async (params) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    return await response.json()
  },
  responseKeyConfig: {
    dataKey: 'data.list',
    totalKey: 'data.total',
    pageIndexKey: 'data.currentPage' // 从响应中同步页码
  }
})
```

### 深层路径访问

`responseKeyConfig` 支持点号分隔的深层路径：

```ts
responseKeyConfig: {
  dataKey: 'data.result.list',  // 支持多层级访问
  totalKey: 'data.result.total'
}
```

对应的响应格式：
```json
{
  "data": {
    "result": {
      "list": [...],
      "total": 100
    }
  }
}
```

## 默认配置

可以通过 `setUseTableRequestDefaults` 设置全局默认配置：

```ts
import { setUseTableRequestDefaults } from 'my-vue-hooks'

setUseTableRequestDefaults({
  pagination: {
    currentPage: 1,
    pageSize: 20,
    pageSizesList: [10, 20, 50, 100]
  },
  requestKeyConfig: {
    pageIndexKey: 'pageIndex',
    pageSizeKey: 'pageSize'
  },
  responseKeyConfig: {
    dataKey: 'data',
    totalKey: 'total'
  }
})
```

## 注意事项

1. **参数变化监听**: 使用 `autoFetchOnParamsChange` 时，参数对象会被深度监听，参数变化时会自动重置到第一页并重新请求
2. **字段路径**: `responseKeyConfig.dataKey` 和 `responseKeyConfig.totalKey` 支持点号分隔的路径，如 `'data.result.list'`
3. **分页重置**: 参数变化时会自动重置到第一页，可以通过设置 `autoFetchOnParamsChange: false` 来禁用
4. **禁用分页**: 将 `pagination` 设置为 `false` 可以禁用分页功能。禁用后不会添加分页参数，也不会进行分页处理
5. **必需参数**: `fetcher` 参数是必需的，需要提供自定义的请求函数
6. **响应性保持**: 使用解构方式 `const { data, pagination } = useTableRequest(...)` 时，响应性会保持。在模板中可以直接使用，在 script 中需要使用 `.value` 访问

## 相关

- [useTableStatic](/hooks/useTableStatic) - 静态数据表格管理 Hook
- [useFetch](/hooks/useFetch) - 数据请求 Hook
- [useAxiosFetch](/hooks/useAxiosFetch) - 基于 Axios 的数据请求 Hook

