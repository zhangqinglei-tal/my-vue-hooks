<template>
  <div class="demo-content">
    <input 
      type="file" 
      @change="handleFileSelect"
      style="margin-bottom: 1rem;"
    />
    <div v-if="selectedFile" style="margin-bottom: 1rem; color: #7f8c8d;">
      已选择: {{ selectedFile.name }}
    </div>
    <button 
      @click="handleUpload" 
      :disabled="loading || !selectedFile"
    >
      {{ loading ? '上传中...' : '上传文件' }}
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
const { sendPostForm } = httpInstance

const loading = ref(false)
const result = ref<any>(null)
const error = ref(false)
const selectedFile = ref<File | null>(null)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  loading.value = true
  error.value = false
  result.value = null

  try {
    // ✅ 使用 sendPostForm 替代 sendPost + requestType: 'form'
    const [data, err, success] = await sendPostForm('https://httpbin.org/post', {
      file: selectedFile.value,
      name: 'avatar'
    })
    if (success) {
      result.value = {
        message: '上传成功',
        filename: selectedFile.value.name,
        response: data
      }
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

