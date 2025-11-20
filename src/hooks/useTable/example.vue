<template>
  <div class="table-examples">
    <!-- 示例 1: API 请求模式 -->
    <div class="example-section">
      <h2>示例 1: API 请求模式 (useTableRequest)</h2>
      
      <div class="search-form">
        <input v-model="requestSearchForm.keyword" placeholder="搜索关键词" />
        <select v-model="requestSearchForm.status">
          <option value="">全部状态</option>
          <option value="active">激活</option>
          <option value="inactive">未激活</option>
        </select>
        <button @click="handleRequestSearch">搜索</button>
        <button @click="handleRequestReset">重置</button>
        <button @click="requestTable.refresh()">刷新</button>
      </div>

      <div class="table-container">
        <table v-if="!requestTable.loading" class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>年龄</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in requestTable.data" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.age }}</td>
              <td>{{ item.status }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="loading">加载中...</div>
      </div>

      <!-- 分页器：当 pagination 不为 false 时显示 -->
      <div v-if="requestTable.pagination" class="pagination">
        <button 
          :disabled="requestTable.pagination.currentPage === 1"
          @click="requestTable.changePage(requestTable.pagination.currentPage - 1)"
        >
          上一页
        </button>
        <span>
          第 {{ requestTable.pagination.currentPage }} / 
          {{ Math.ceil(requestTable.total / requestTable.pagination.pageSize) }} 页
        </span>
        <button 
          :disabled="requestTable.pagination.currentPage >= Math.ceil(requestTable.total / requestTable.pagination.pageSize)"
          @click="requestTable.changePage(requestTable.pagination.currentPage + 1)"
        >
          下一页
        </button>
        <select 
          :value="requestTable.pagination.pageSize"
          @change="(e: any) => requestTable.changePageSize(Number(e.target.value))"
        >
          <option v-for="size in requestTable.pagination.pageSizesList" :key="size" :value="size">
            {{ size }} 条/页
          </option>
        </select>
        <span>共 {{ requestTable.total }} 条</span>
      </div>
    </div>

    <!-- 示例 2: 静态数据模式 -->
    <div class="example-section">
      <h2>示例 2: 静态数据模式 (useTableStatic)</h2>
      
      <div class="search-form">
        <input 
          v-model="staticSearchParams.name" 
          placeholder="搜索姓名" 
        />
        <select v-model="staticSearchParams.city">
          <option value="">全部城市</option>
          <option value="北京">北京</option>
          <option value="上海">上海</option>
          <option value="广州">广州</option>
          <option value="深圳">深圳</option>
        </select>
        <button @click="handleStaticReset">重置</button>
        <button @click="addStaticData">添加数据</button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>年龄</th>
              <th>城市</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in staticTable.data" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.age }}</td>
              <td>{{ item.city }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页器：当 pagination 不为 false 时显示 -->
      <div v-if="staticTable.pagination" class="pagination">
        <button 
          :disabled="staticTable.pagination.currentPage === 1"
          @click="staticTable.changePage(staticTable.pagination.currentPage - 1)"
        >
          上一页
        </button>
        <span>
          第 {{ staticTable.pagination.currentPage }} / 
          {{ Math.ceil(staticTable.total / staticTable.pagination.pageSize) }} 页
        </span>
        <button 
          :disabled="staticTable.pagination.currentPage >= Math.ceil(staticTable.total / staticTable.pagination.pageSize)"
          @click="staticTable.changePage(staticTable.pagination.currentPage + 1)"
        >
          下一页
        </button>
        <select 
          :value="staticTable.pagination.pageSize"
          @change="(e: any) => staticTable.changePageSize(Number(e.target.value))"
        >
          <option v-for="size in staticTable.pagination.pageSizesList" :key="size" :value="size">
            {{ size }} 条/页
          </option>
        </select>
        <span>共 {{ staticTable.total }} 条（已过滤）</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useTableRequest, useTableStatic } from './index'

// ============= 示例 1: API 请求模式 =============

interface User {
  id: number
  name: string
  age: number
  status: string
}

// 搜索表单
const requestSearchForm = reactive({
  keyword: '',
  status: ''
})

// 模拟 API 请求函数
const mockFetchUsers = async (params: any) => {
  console.log('Request params:', params)
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 模拟数据
  const allData: User[] = Array.from({ length: 95 }, (_, i) => ({
    id: i + 1,
    name: `用户${i + 1}`,
    age: 20 + Math.floor(Math.random() * 40),
    status: i % 3 === 0 ? 'active' : 'inactive'
  }))
  
  // 模拟搜索过滤
  let filtered = allData
  if (params.keyword) {
    filtered = filtered.filter(item => 
      item.name.includes(params.keyword)
    )
  }
  if (params.status) {
    filtered = filtered.filter(item => item.status === params.status)
  }
  
  // 模拟分页
  const start = (params.pageIndex - 1) * params.pageSize
  const end = start + params.pageSize
  const pageData = filtered.slice(start, end)
  
  // 返回模拟响应
  return {
    data: {
      list: pageData,
      total: filtered.length
    }
  }
}

// 使用 useTableRequest
const requestTable = useTableRequest<User>({
  // 必需：请求函数
  fetcher: mockFetchUsers,
  
  params: requestSearchForm,
  autoFetch: true,
  autoFetchOnParamsChange: false, // 手动控制搜索
  
  pagination: {
    currentPage: 1,
    pageSize: 10,
    pageSizesList: [10, 20, 50]
  },
  
  // 请求参数映射配置
  requestKeyConfig: {
    pageIndexKey: 'pageIndex',
    pageSizeKey: 'pageSize'
  },
  
  // 响应数据映射配置
  responseKeyConfig: {
    dataKey: 'list',
    totalKey: 'total'
  },
  
  beforeFetch: (params) => {
    console.log('Before fetch:', params)
    return params
  },
  
  afterFetch: (data) => {
    console.log('After fetch:', data)
    return data
  },
  
  onError: (error) => {
    console.error('Request error:', error)
    alert('请求失败: ' + error.message)
  }
})

const handleRequestSearch = () => {
  requestTable.updateParams?.(requestSearchForm)
  requestTable.reset() // 重置到第一页并刷新
}

const handleRequestReset = () => {
  requestSearchForm.keyword = ''
  requestSearchForm.status = ''
  handleRequestSearch()
}

// ============= 示例 2: 静态数据模式 =============

interface StaticUser {
  id: number
  name: string
  age: number
  city: string
}

// 静态数据源
const staticData = ref<StaticUser[]>([
  { id: 1, name: '张三', age: 25, city: '北京' },
  { id: 2, name: '李四', age: 30, city: '上海' },
  { id: 3, name: '王五', age: 28, city: '广州' },
  { id: 4, name: '赵六', age: 35, city: '深圳' },
  { id: 5, name: '孙七', age: 26, city: '北京' },
  { id: 6, name: '周八', age: 32, city: '上海' },
  { id: 7, name: '吴九', age: 29, city: '广州' },
  { id: 8, name: '郑十', age: 27, city: '深圳' },
  { id: 9, name: '钱一', age: 31, city: '北京' },
  { id: 10, name: '孙二', age: 24, city: '上海' },
  { id: 11, name: '李三', age: 33, city: '广州' },
  { id: 12, name: '周四', age: 28, city: '深圳' },
  { id: 13, name: '吴五', age: 26, city: '北京' },
  { id: 14, name: '郑六', age: 30, city: '上海' },
  { id: 15, name: '王七', age: 29, city: '广州' },
  { id: 16, name: '赵八', age: 34, city: '深圳' },
  { id: 17, name: '钱九', age: 27, city: '北京' },
  { id: 18, name: '孙十', age: 31, city: '上海' },
  { id: 19, name: '李一', age: 25, city: '广州' },
  { id: 20, name: '周二', age: 32, city: '深圳' },
])

// 搜索参数（在外部管理，用于 filterFn）
const staticSearchParams = reactive({
  name: '',
  city: ''
})

// 使用 useTableStatic
const staticTable = useTableStatic<StaticUser>({
  data: staticData,
  
  // 自定义过滤函数（使用外部管理的搜索参数）
  filterFn: (item) => {
    // 姓名搜索
    if (staticSearchParams.name) {
      const name = staticSearchParams.name.toLowerCase()
      if (!item.name.toLowerCase().includes(name)) {
        return false
      }
    }
    
    // 城市筛选
    if (staticSearchParams.city && item.city !== staticSearchParams.city) {
      return false
    }
    
    return true
  },
  
  pagination: {
    currentPage: 1,
    pageSize: 5,
    pageSizesList: [5, 10, 20]
  }
})

// 监听搜索参数变化，重置到第一页
watch(
  () => [staticSearchParams.name, staticSearchParams.city],
  () => {
    staticTable.reset() // 重置到第一页
  }
)

const handleStaticReset = () => {
  staticSearchParams.name = ''
  staticSearchParams.city = ''
}

const addStaticData = () => {
  const newId = staticData.value.length + 1
  const cities = ['北京', '上海', '广州', '深圳']
  staticData.value.push({
    id: newId,
    name: `新用户${newId}`,
    age: 20 + Math.floor(Math.random() * 20),
    city: cities[Math.floor(Math.random() * cities.length)]
  })
}
</script>

<style scoped>
.table-examples {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 60px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-form input,
.search-form select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-form input {
  flex: 1;
  min-width: 200px;
}

.search-form button {
  padding: 8px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.search-form button:hover {
  background: #66b1ff;
}

.search-form button:active {
  background: #3a8ee6;
}

.table-container {
  margin-bottom: 20px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #333;
}

.data-table tbody tr:hover {
  background: #f5f7fa;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.pagination button {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.pagination button:not(:disabled):hover {
  color: #409eff;
  border-color: #409eff;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.pagination span {
  font-size: 14px;
  color: #666;
}
</style>

