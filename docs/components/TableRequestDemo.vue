<template>
  <ClientOnly>
    <div class="demo-container">
      <div class="demo-preview">
        <div class="demo-header">
          <h4>useTableRequest 演示</h4>
          <button class="demo-button" @click="refresh" :disabled="loading">
            {{ loading ? '加载中...' : '刷新' }}
          </button>
        </div>

        <div v-if="loading" class="demo-loading">加载中...</div>
        <div v-else>
          <div class="demo-table-info">
            <span>共 {{ total }} 条数据</span>
            <span>当前第 {{ pagination.currentPage }} 页</span>
            <span>每页 {{ pagination.pageSize }} 条</span>
          </div>

          <table class="demo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>年龄</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.age }}</td>
                <td>{{ item.status }}</td>
              </tr>
            </tbody>
          </table>

          <div v-if="data.length === 0" class="demo-empty">
            暂无数据
          </div>

          <div class="demo-pagination">
            <button 
              class="demo-button" 
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
            >
              上一页
            </button>
            <span class="demo-page-info">
              第 {{ pagination.currentPage }} / {{ Math.ceil(total / pagination.pageSize) }} 页
            </span>
            <button 
              class="demo-button" 
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage >= Math.ceil(total / pagination.pageSize)"
            >
              下一页
            </button>
            <select 
              :value="pagination.pageSize" 
              @change="(e: any) => changePageSize(Number(e.target.value))"
              class="demo-select"
            >
              <option v-for="size in pagination.pageSizesList" :key="size" :value="size">
                {{ size }} 条/页
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTableRequest } from 'my-hooks'

interface User {
  id: number
  name: string
  age: number
  status: string
}

// 模拟 API 请求
const mockFetcher = async (params: any) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 模拟数据
  const allData: User[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `用户${i + 1}`,
    age: 20 + Math.floor(Math.random() * 40),
    status: i % 3 === 0 ? 'active' : 'inactive'
  }))
  
  // 模拟分页
  const start = (params.pageIndex - 1) * params.pageSize
  const end = start + params.pageSize
  const pageData = allData.slice(start, end)
  
  return {
    data: pageData,
    total: allData.length
  }
}

const { 
  data, 
  loading, 
  pagination, 
  total, 
  refresh, 
  changePage, 
  changePageSize 
} = useTableRequest<User>({
  fetcher: mockFetcher,
  autoFetch: true,
  pagination: {
    currentPage: 1,
    pageSize: 5,
    pageSizesList: [5, 10, 20]
  }
})
</script>

<style scoped>
.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.demo-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.demo-loading {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-2);
}

.demo-table-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.demo-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.demo-table th,
.demo-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

.demo-table th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}

.demo-table tbody tr:hover {
  background: var(--vp-c-bg-soft);
}

.demo-empty {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-2);
}

.demo-pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.demo-page-info {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.demo-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  font-size: 0.875rem;
}
</style>

