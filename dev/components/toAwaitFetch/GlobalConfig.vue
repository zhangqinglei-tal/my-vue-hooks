<template>
  <div class="demo-content">
    <div style="margin-bottom: 1rem;">
      <input 
        v-model="globalConfig.baseURL" 
        placeholder="BaseURL"
        style="padding: 0.5rem; width: 300px; margin-right: 0.5rem;"
      />
      <button @click="handleSetGlobalConfig">设置全局配置</button>
    </div>
    <button @click="handleGet" :disabled="loading">
      {{ loading ? '加载中...' : '使用全局配置 GET' }}
    </button>

    <div v-if="result" class="result" :class="error ? 'error' : 'success'">
      <strong>{{ error ? '错误' : '结果' }}:</strong>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// @ts-expect-error - 开发环境类型解析
import { sendGet, setGlobalConfig } from '../../../src/hooks/toAwaitFetch/toAwaitFetch'

const loading = ref(false)
const result = ref<any>(null)
const error = ref(false)
const globalConfig = ref({
  baseURL: 'https://jsonplaceholder.typicode.com'
})

const handleSetGlobalConfig = () => {
  setGlobalConfig({
    baseURL: globalConfig.value.baseURL,
    timeout: 5000
  })
  result.value = { message: '全局配置已设置', config: globalConfig.value }
  error.value = false
}

const handleGet = async () => {
  loading.value = true
  error.value = false
  result.value = null

  try {
    const [data, err, success] = await sendGet('/posts/1')
    if (success) {
      result.value = data
    } else {
      error.value = true
      result.value = { error: err?.message }
    }
  } catch (err) {
    error.value = true
    result.value = { error: err instanceof Error ? err.message : '未知错误' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.demo-content {
  margin-top: 1rem;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #2980b9;
}

button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.result {
  margin-top: 1rem;
  padding: 1rem;
  background: #ecf0f1;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}

.result pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.result.error {
  border-left-color: #e74c3c;
  background: #fee;
}

.result.success {
  border-left-color: #27ae60;
  background: #efe;
}
</style>

