<template>
  <pre>
    import { sendGet, sendPost } from '../../../src/hooks/toAwaitFetch/toAwaitFetch'
    const [data, error, success] = await sendGet('https://jsonplaceholder.typicode.com/posts/1')
    if (success) {
      result.value = data
    } else {
      error.value = true
      result.value = { error: err?.message }
    }
    const [data, error, success] = await sendPost('https://jsonplaceholder.typicode.com/posts', {
      title: '测试标题',
      body: '测试内容',
      userId: 1
    })
    if (success) {
      result.value = data
    } else {
      error.value = true
      result.value = { error: err?.message }
    }
  </pre>
  <div class="demo-content">
    <button @click="handleGet" :disabled="loading">
      {{ loading ? '加载中...' : 'GET 请求' }}
    </button>
    <button @click="handlePost" :disabled="loading">
      {{ loading ? '加载中...' : 'POST 请求' }}
    </button>

    <div v-if="result" class="result" :class="error ? 'error' : 'success'">
      <strong>{{ error ? '错误' : '结果' }}:</strong>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { sendGet, sendPost } from '../../../src/hooks/toAwaitFetch/toAwaitFetch'

const loading = ref(false)
const result = ref<any>(null)
const error = ref(false)

const handleGet = async () => {
  loading.value = true
  error.value = false
  result.value = null

  try {
    const [data, err, success] = await sendGet('https://jsonplaceholder.typicode.com/posts/1')
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

const handlePost = async () => {
  loading.value = true
  error.value = false
  result.value = null

  try {
    const [data, err, success] = await sendPost('https://jsonplaceholder.typicode.com/posts', {
      title: '测试标题',
      body: '测试内容',
      userId: 1
    })
    if (success) {
      console.log('data', data)
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

