<template>
  <ClientOnly>
    <div class="demo-container">
      <div class="demo-preview">
        <div class="demo-header">
          <h4>useTableStatic 演示</h4>
          <div class="demo-search">
            <input 
              v-model="searchKeyword" 
              placeholder="搜索姓名..." 
              class="demo-input"
              @input="handleSearch"
            />
            <button class="demo-button" @click="handleReset">重置</button>
          </div>
        </div>

        <div class="demo-table-info">
          <span>共 {{ total }} 条数据（已过滤）</span>
          <span>当前第 {{ pagination.currentPage }} 页</span>
          <span>每页 {{ pagination.pageSize }} 条</span>
        </div>

        <table class="demo-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>年龄</th>
              <th>城市</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.age }}</td>
              <td>{{ item.city }}</td>
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
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTableStatic } from 'my-hooks'

interface User {
  id: number
  name: string
  age: number
  city: string
}

// 静态数据
const allUsers = ref<User[]>([
  { id: 1, name: '张三', age: 25, city: '北京' },
  { id: 2, name: '李四', age: 30, city: '上海' },
  { id: 3, name: '王五', age: 28, city: '北京' },
  { id: 4, name: '赵六', age: 35, city: '广州' },
  { id: 5, name: '钱七', age: 22, city: '上海' },
  { id: 6, name: '孙八', age: 27, city: '深圳' },
  { id: 7, name: '周九', age: 32, city: '北京' },
  { id: 8, name: '吴十', age: 29, city: '上海' },
  { id: 9, name: '郑一', age: 26, city: '广州' },
  { id: 10, name: '王二', age: 31, city: '深圳' },
  { id: 11, name: '李三', age: 24, city: '北京' },
  { id: 12, name: '张四', age: 33, city: '上海' },
])

const searchKeyword = ref('')

const { 
  data, 
  pagination, 
  total, 
  changePage, 
  changePageSize,
  reset
} = useTableStatic<User>({
  data: allUsers,
  filterFn: (item) => {
    if (!searchKeyword.value) return true
    return item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  },
  pagination: {
    currentPage: 1,
    pageSize: 5,
    pageSizesList: [5, 10, 20]
  }
})

// 监听搜索关键词变化，重置到第一页
watch(searchKeyword, () => {
  reset()
})

const handleSearch = () => {
  reset()
}

const handleReset = () => {
  searchKeyword.value = ''
  reset()
}
</script>

<style scoped>
.demo-header {
  margin-bottom: 1rem;
}

.demo-header h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.demo-search {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.demo-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  font-size: 0.875rem;
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

