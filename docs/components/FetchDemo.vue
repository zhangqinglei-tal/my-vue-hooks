<template>
  <ClientOnly>
    <div class="demo-container">
      <div class="demo-preview">
        <div class="demo-header">
          <h4>useFetch 演示</h4>
          <button class="demo-button" @click="handleExecute" :disabled="isLoading">
            {{ isLoading ? '加载中...' : '重新请求' }}
          </button>
        </div>
        
        <div v-if="isLoading" class="demo-loading">加载中...</div>
        <div v-else-if="errorMessage" class="demo-error">
          <p>错误: {{ errorMessage }}</p>
          <button class="demo-button" @click="handleExecute">重试</button>
        </div>
        <div v-else-if="responseData" class="demo-data">
          <pre>{{ JSON.stringify(responseData, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFetchGet } from 'my-hooks'

// 模拟数据
const mockData = {
  id: 1,
  title: '示例数据',
  body: '这是一个使用 useFetch 获取数据的演示',
  userId: 1,
  timestamp: Date.now()
}

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const responseData = ref<any>(null)

// 模拟请求函数
const handleExecute = async () => {
  isLoading.value = true
  errorMessage.value = null
  responseData.value = null
  
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟随机成功/失败
    if (Math.random() > 0.1) {
      responseData.value = { ...mockData, timestamp: Date.now() }
    } else {
      throw new Error('网络请求失败，请重试')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时执行一次
onMounted(() => {
  setTimeout(() => {
    handleExecute()
  }, 100)
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

.demo-loading,
.demo-error,
.demo-data {
  padding: 1rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}

.demo-error {
  color: var(--vp-c-red);
}

.demo-data pre {
  margin: 0;
  font-size: 0.875rem;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}
</style>

