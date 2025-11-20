# useTableStatic

用于处理已有完整数据集，需要在前端进行分页和过滤的场景。

## 特性

- 📄 内置分页功能，支持自定义配置
- 🔍 支持自定义过滤函数
- 💪 完整的 TypeScript 支持
- 🚀 零依赖，无需 API 请求

## 安装

```bash
npm install my-hooks
# 或
pnpm add my-hooks
```

## 基础用法

<TableStaticDemo />

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
import { useTableStatic } from 'my-hooks'

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
  refresh,
  reset
} = useTableStatic({
  data: allUsers, // 可以传入 ref 或普通数组
  pagination: {
    currentPage: 1,
    pageSize: 10,
    pageSizesList: [10, 20, 50]
  },
  // 自定义过滤函数
  filterFn: (item) => {
    const keyword = searchParams.value.keyword?.toLowerCase() || ''
    const city = searchParams.value.city || ''
    
    return (
      (!keyword || item.name.toLowerCase().includes(keyword)) &&
      (!city || item.city === city)
    )
  }
})

// 监听搜索参数变化，重置到第一页
watch(
  () => [searchParams.value.keyword, searchParams.value.city],
  () => {
    reset() // 重置到第一页并刷新
  }
)
</script>
```

## API

### useTableStatic

```ts
function useTableStatic<T = any>(
  options: UseTableStaticOptions<T>
): UseTableReturn<T>
```

#### 参数

```ts
interface UseTableStaticOptions<T> {
  // 数据源（可以是 ref 或普通数组）
  data: Ref<T[]> | T[]
  
  // 分页配置，设置为 false 时禁用分页
  pagination?: PaginationConfig | false
  
  // 自定义过滤函数
  filterFn?: (item: T) => boolean
}
```

**注意：**
- `filterFn` 只接收一个参数 `item`，如果需要使用外部参数，可以在函数内部访问外部的响应式变量
- `pagination` 可以设置为 `false` 来禁用分页功能，此时会返回所有数据

#### 返回值

```ts
interface UseTableReturn<T> {
  data: Ref<T[]>           // 表格数据
  loading: Ref<boolean>    // 加载状态
  pagination: Ref<PaginationState>  // 分页状态
  total: Ref<number>       // 总条数
  refresh: () => Promise<void>      // 刷新数据（保持当前页）
  reset: () => Promise<void>        // 重置并刷新（回到第一页）
  changePage: (page: number) => Promise<void>  // 切换页码
  changePageSize: (size: number) => Promise<void>  // 切换每页条数
}
```

**注意：** 由于使用了 `toRefs()`，所有响应式属性都是 `Ref` 类型。在模板中会自动解包，但在 script 中需要使用 `.value` 访问。

## 高级用法

### 响应式数据源

`useTableStatic` 支持响应式数据源，数据变化时会自动更新：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTableStatic } from 'my-hooks'

const allUsers = ref<User[]>([...])

const { data, refresh } = useTableStatic({
  data: allUsers, // 传入 ref，数据变化时自动更新
  filterFn: (item) => item.status === 'active'
})

// 添加新数据
const addUser = () => {
  allUsers.value.push({
    id: allUsers.value.length + 1,
    name: '新用户',
    status: 'active'
  })
  // 数据会自动更新，无需手动调用 refresh
}
</script>
```

### 禁用分页

如果需要获取所有数据而不进行分页：

```vue
<script setup lang="ts">
const { data, pagination } = useTableStatic({
  data: allUsers,
  pagination: false // 禁用分页，返回所有数据
})
</script>
```

## 相关

- [useTableRequest](/hooks/useTableRequest) - API 请求表格管理 Hook
- [useFetch](/hooks/useFetch) - 数据请求 Hook

