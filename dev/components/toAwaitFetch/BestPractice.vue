<template>
  <div class="demo-wrapper">
    <div class="code-example">
      <h4>http.ts - 项目封装文件</h4>
      <pre><code>import { createInstance } from 'my-vue-hooks/hooks/toAwaitFetch/toAwaitFetch'

// 创建实例并配置所有选项
const httpInstance = createInstance({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  onHttpError: async (error, status, response, suppressError) => {
    if (status === 401) {
      window.location.href = '/login'
      suppressError?.() // 取消抛错
    } else if (status >= 500) {
      showErrorToast('服务器错误，请稍后重试')
      suppressError?.() // 取消抛错
    }
  },
  onBusinessError: async (error, response, suppressError) => {
    if (response.code === 1001) {
      showErrorToast(response.message)
      suppressError?.() // 取消抛错
    }
  },
  onNetworkError: async (error, suppressError) => {
    showErrorToast('网络连接失败，请检查网络')
    suppressError?.() // 取消抛错
  },
  retry: {
    enabled: true,
    maxRetryCount: 3,
    delay: 1000
  },
  validateStatus: (status) => status >= 200 && status < 300,
  validateResponse: (response) => response.code === 0
})

// 解构导出方法（包含新增的文件上传和下载方法）
const { sendGet, sendPost, sendPostForm, sendPostBlob, sendGetBlob, setGlobalConfig } = httpInstance

export { sendGet, sendPost, sendPostForm, sendPostBlob, sendGetBlob, setGlobalConfig }
export default httpInstance</code></pre>
    </div>

    <div class="code-example">
      <h4>在组件中使用</h4>
      <pre><code>import { sendGet, sendPost } from '@/utils/http'

// 直接使用，已包含所有配置
const [data, error, success] = await sendGet('/api/users')
if (success) {
  console.log('数据:', data)
} else {
  console.error('错误:', error)
}

const [data, error, success] = await sendPost('/api/users', {
  name: 'John',
  email: 'john@example.com'
})</code></pre>
    </div>

    <div class="code-example">
      <h4>Promise.all 并行请求</h4>
      <pre><code>import { sendGet } from '@/utils/http'

const urls = ['/api/users', '/api/permissions', '/api/notifications']
const responses = await Promise.all(urls.map((url) => sendGet(url)))

const normalized = responses.map(([data, fetchError, success], index) => ({
  url: urls[index],
  success,
  data,
  error: fetchError ? {
    message: fetchError.message,
    type: fetchError.type,
    status: fetchError.status
  } : null
}))</code></pre>
    </div>

    <div class="demo-content">
      <div class="test-section">
        <h5>测试示例</h5>
        <div class="test-buttons">
          <button @click="handleSuccess" :disabled="loading" class="test-button success">
            {{ loading && currentTest === 'success' ? '测试中...' : '1. 成功测试' }}
          </button>
          <button @click="handleBusinessError" :disabled="loading" class="test-button business">
            {{ loading && currentTest === 'business' ? '测试中...' : '2. 业务错误，解构处理不提示' }}
          </button>
          <button @click="handleNotFound" :disabled="loading" class="test-button http">
            {{ loading && currentTest === 'not-found' ? '测试中...' : '3. 404错误，不解构提示' }}
          </button>
          <button @click="handleBadGateway" :disabled="loading" class="test-button http">
            {{ loading && currentTest === 'bad-gateway' ? '测试中...' : '4. 502错误' }}
          </button>
          <button @click="handleChainError" :disabled="loading" class="test-button http">
            {{ loading && currentTest === 'chain-error' ? '测试中...' : '5. 404错误，链式调用处理不提示' }}
          </button>
          <button @click="handleTimeout" :disabled="loading" class="test-button timeout">
            {{ loading && currentTest === 'timeout' ? '测试中...' : '6. 超时测试' }}
          </button>
          <button @click="handleFormData" :disabled="loading || !selectedFile" class="test-button upload">
            {{ loading && currentTest === 'formData' ? '上传中...' : '7. 文件上传' }}
          </button>
          <button @click="handleCancelableRequest" :disabled="loading" class="test-button http">
            {{ loading && currentTest === 'cancel' ? '请求中...' : '8. 可取消请求' }}
          </button>
          <button @click="handleCancelNow" :disabled="!cancelableRequest" class="test-button http">
            立即取消
          </button>
          <button @click="handlePromiseAll" :disabled="loading" class="test-button">
            {{ loading && currentTest === 'promise-all' ? '请求中...' : '9. Promise.all 并行' }}
          </button>
        </div>
        
        <div v-if="currentTest === 'formData'" class="file-input-wrapper">
          <input 
            type="file" 
            @change="handleFileSelect"
            style="margin: 0.5rem 0;"
          />
          <div v-if="selectedFile" class="file-info">
            已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
          </div>
        </div>

        <div v-if="result" class="result" :class="error ? 'error' : 'success'">
          <div class="result-header">
            <strong>{{ error ? '❌ 错误' : '✅ 成功' }}</strong>
            <span class="test-type">{{ testType }}</span>
          </div>
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// 从封装的 http.ts 导入（模拟真实项目）
import { sendGet, sendPost, sendPostForm, setGlobalConfig } from '../../utils/http'

const loading = ref(false)
const result = ref<any>(null)
const error = ref(false)
const currentTest = ref<string | null>(null)
const testType = ref<string>('')
const selectedFile = ref<File | null>(null)
const cancelableRequest = ref<ReturnType<typeof sendGet> | null>(null)
interface ParallelResultItem {
  index: number
  url: string
  success: boolean
  data: unknown
  error: {
    message?: string
    type?: string
    status?: number
  } | null
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 重置状态
const resetState = () => {
  error.value = false
  result.value = null
  testType.value = ''
}

// 1. 成功测试
const handleSuccess = async () => {
  loading.value = true
  currentTest.value = 'success'
  resetState()

  const [data, err, success] = await sendGet('/api/test/success', {})
  if (success) {
    console.log('data', data)
      result.value = data
      testType.value = '成功请求'
    } else {
      error.value = true
      result.value = { error: err?.message, type: err?.type }
      testType.value = `错误类型: ${err?.type || 'unknown'}`
    }
    loading.value = false
    currentTest.value = null
    return
}

// 2. 业务错误测试
const handleBusinessError = async () => {
  loading.value = true
  currentTest.value = 'business'
  resetState()
  const [data] = await sendGet('/api/test/success-1').catchBusiness((error) => {
    console.log('error', error)
  })
 
  loading.value = false
  currentTest.value = null
}

// 3. 404错误测试
const handleNotFound = async () => {
  loading.value = true
  currentTest.value = 'not-found'
  resetState()

  const [data, error] = await sendGet('/api/test/not-found')
  console.log('error', error)
  // if (success) {
  //   result.value = data
  //   testType.value = '成功请求'
  // } else {
  //   error.value = true
  //   result.value = { error: err?.message, type: err?.type, status: err?.status }
  //   testType.value = `HTTP错误: ${err?.status || 'unknown'}`
  // }
  loading.value = false
  currentTest.value = null
}

// 4. 502错误测试
const handleBadGateway = async () => {
  loading.value = true
  currentTest.value = 'bad-gateway'
  resetState()
  await sendGet('/api/test/bad-gateway')
  
    loading.value = false
    currentTest.value = null
}

// 5. 链式调用错误处理测试（404错误）
const handleChainError = async () => {
  loading.value = true
  currentTest.value = 'chain-error'
  resetState()

  // ✅ 链式调用不需要 await！错误已经被 catchHttp 处理了
  sendGet('/api/test/not-found')
    .catchHttp((fetchError) => {
      // 链式调用处理错误，不会抛出未处理错误
      error.value = true
      result.value = {
        message: '通过链式调用 catchHttp 处理了错误（无需 await）',
        error: {
          message: fetchError.message,
          type: fetchError.type,
          status: fetchError.status
        }
      }
      testType.value = `链式调用处理: ${fetchError.status || 'unknown'}`
    })
  
  // 注意：因为没有 await，这里会立即执行
  // 实际项目中，如果需要等待请求完成，还是建议使用 await
  loading.value = false
  currentTest.value = null
}

// 6. 超时测试
const handleTimeout = async () => {
  loading.value = true
  currentTest.value = 'timeout'
  resetState()

 await sendGet('/api/test/timeout', undefined, {
    timeout: 2000 // 2秒超时
  }).catchNetwork((fetchError) => {
    console.log('error', fetchError)
    error.value = true
    result.value = { error: fetchError.message }
    testType.value = '网络错误'
  })
  loading.value = false
    currentTest.value = null
}

// 7. 文件上传测试
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

const handleFormData = async () => {
  if (!selectedFile.value) return

  loading.value = true
  currentTest.value = 'formData'
  resetState()

  try {
    // ✅ 使用 sendPostForm 替代 sendPost + requestType: 'form'
    const [data, err, success] = await sendPostForm('/api/test/formData', {
      file: selectedFile.value,
      name: 'test-file',
      description: '测试文件上传'
    })
    if (success) {
      result.value = {
        message: '上传成功',
        filename: selectedFile.value.name,
        filesize: formatFileSize(selectedFile.value.size),
        response: data
      }
      testType.value = '文件上传成功'
    } else {
      error.value = true
      result.value = { error: err?.message, type: err?.type }
      testType.value = `上传错误: ${err?.type || 'unknown'}`
    }
  } catch (err) {
    error.value = true
    result.value = { error: err instanceof Error ? err.message : '未知错误' }
    testType.value = '异常错误'
  } finally {
    loading.value = false
    currentTest.value = null
  }
}

// 8. 可取消请求示例
const handleCancelableRequest = async () => {
  loading.value = true
  currentTest.value = 'cancel'
  resetState()

  // 触发一个可取消的超时请求
  const req = sendGet('/api/test/timeout', undefined, {
    timeout: 8000
  }).catchNetwork((fetchErr) => {
    error.value = true
    result.value = { error: fetchErr?.message, type: fetchErr?.type }
    testType.value = '网络/超时错误'
  })

  cancelableRequest.value = req

  const [data, err, success] = await req
  if (success) {
    result.value = data
    testType.value = '可取消请求成功'
  } else if (err) {
    error.value = true
    result.value = { error: err?.message, type: err?.type }
    testType.value = `错误类型: ${err?.type || 'unknown'}`
  }

  cancelableRequest.value = null
  loading.value = false
  currentTest.value = null
}

const handlePromiseAll = async () => {
  loading.value = true
  currentTest.value = 'promise-all'
  resetState()
  const urls = ['/api/test/success', '/api/test/success-1', '/api/test/not-found']
  const responses = await Promise.all(urls.map((url) => sendGet(url)))
  const parallelResults: ParallelResultItem[] = responses.map(([data, fetchError, success], index) => ({
    index: index + 1,
    url: urls[index],
    success: Boolean(success),
    data,
    error: fetchError
      ? {
          message: fetchError.message,
          type: fetchError.type,
          status: fetchError.status
        }
      : null
  }))
  const hasError = parallelResults.some((item) => !item.success)
  if (hasError) {
    error.value = true
    testType.value = 'Promise.all 部分失败'
  } else {
    testType.value = 'Promise.all 全部成功'
  }
  result.value = parallelResults
  loading.value = false
  currentTest.value = null
}

const handleCancelNow = () => {
  if (cancelableRequest.value) {
    cancelableRequest.value.cancel?.()
    result.value = { message: '请求已取消' }
    testType.value = '取消请求'
    cancelableRequest.value = null
    loading.value = false
    currentTest.value = null
  }
}
</script>

<style scoped>
.demo-wrapper {
  margin-top: 1rem;
}

.code-example {
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
  border-left: 4px solid #3498db;
}

.code-example h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 600;
}

.code-example pre {
  margin: 0;
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.5;
}

.code-example code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.demo-content {
  margin-top: 1rem;
}

.test-section {
  margin-top: 1rem;
}

.test-section h5 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
}

.test-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.test-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;
  text-align: center;
}

.test-button:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.test-button.success {
  background: #27ae60;
}

.test-button.success:hover:not(:disabled) {
  background: #229954;
}

.test-button.business {
  background: #f39c12;
}

.test-button.business:hover:not(:disabled) {
  background: #e67e22;
}

.test-button.http {
  background: #e74c3c;
}

.test-button.http:hover:not(:disabled) {
  background: #c0392b;
}

.test-button.timeout {
  background: #9b59b6;
}

.test-button.timeout:hover:not(:disabled) {
  background: #8e44ad;
}

.test-button.upload {
  background: #16a085;
}

.test-button.upload:hover:not(:disabled) {
  background: #138d75;
}

.file-input-wrapper {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.file-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #7f8c8d;
}

.result {
  margin-top: 1rem;
  padding: 1rem;
  background: #ecf0f1;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-header strong {
  font-size: 1rem;
}

.test-type {
  font-size: 0.75rem;
  color: #7f8c8d;
  background: rgba(127, 140, 141, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.result pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  max-height: 400px;
  overflow-y: auto;
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

