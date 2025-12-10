<template>
  <div class="demo-content">
    <button @click="handleDownloadBlob" :disabled="loading">
      {{ loading ? '下载中...' : '下载 Blob 文件' }}
    </button>
    <button @click="handleDownloadText" :disabled="loading">
      {{ loading ? '加载中...' : '获取文本文件' }}
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
import { createInstance } from '../../../src/hooks/toAwaitFetch/toAwaitFetch'

const httpInstance = createInstance()
const { sendGetBlob, sendGet } = httpInstance

const loading = ref(false)
const result = ref<any>(null)
const error = ref(false)

const handleDownloadBlob = async () => {
  loading.value = true
  error.value = false
  result.value = null

  try {
    // ✅ 使用 sendGetBlob 替代 sendGet + responseType: 'blob'
    const [data, err, success] = await sendGetBlob('https://picsum.photos/200/300')
    if (success && data instanceof Blob) {
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'demo-image.jpg'
      link.click()
      window.URL.revokeObjectURL(url)
      result.value = { message: 'Blob 文件下载成功（已触发下载）', size: data.size }
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

const handleDownloadText = async () => {
  loading.value = true
  error.value = false
  result.value = null

  try {
    // ✅ 默认使用 sendGet 获取 JSON 数据（文本会被作为 JSON 解析）
    const [data, err, success] = await sendGet('https://jsonplaceholder.typicode.com/posts/1')
    if (success) {
      result.value = { message: '数据获取成功', content: data }
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

