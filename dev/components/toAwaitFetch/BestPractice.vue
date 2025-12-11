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

        <div class="tab-list">
          <button
            v-for="tab in testTabs"
            :key="tab.id"
            class="tab-item"
            :class="['tone-' + tab.tone, { active: activeTab === tab.id }]"
            :disabled="loading && activeTab === tab.id"
            @click="handleSelectTab(tab.id)"
          >
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-desc">{{ tab.description }}</span>
          </button>
        </div>

        <div class="tab-panel">
          <div class="tab-header">
            <div>
              <div class="tab-title">{{ currentTab?.label }}</div>
              <div class="tab-subtitle">{{ currentTab?.description }}</div>
            </div>
            <div class="tab-actions">
              <button
                class="action-button"
                :disabled="loading"
                @click="handleRerunCurrent"
              >
                {{ loading ? '运行中...' : '重新运行' }}
              </button>
              <button
                v-if="activeTab === 'cancel'"
                class="action-button danger"
                :disabled="!cancelableRequest"
                @click="handleCancelNow"
              >
                立即取消
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'formData'" class="file-input-wrapper">
            <input type="file" @change="handleFileSelect" />
            <div v-if="selectedFile" class="file-info">
              已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </div>
            <button
              class="action-button primary"
              :disabled="loading || !selectedFile"
              @click="handleFormData"
            >
              {{ loading ? '上传中...' : '开始上传' }}
            </button>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { sendGet, sendPostForm } from '../../utils/http'

type TestId =
  | 'success'
  | 'business'
  | 'not-found'
  | 'bad-gateway'
  | 'chain-error'
  | 'timeout'
  | 'formData'
  | 'cancel'
  | 'promise-all'

type Tone = 'success' | 'warning' | 'danger' | 'info'

interface TestTab {
  id: TestId
  label: string
  description: string
  tone: Tone
}

interface ParallelError {
  message?: string
  type?: string
  status?: number
}

interface ParallelResultItem {
  index: number
  url: string
  success: boolean
  data: unknown
  error: ParallelError | null
}

type UploadResult = {
  message: string
  filename: string
  filesize: string
  response: unknown
}

type GenericResult =
  | ParallelResultItem[]
  | UploadResult
  | ParallelError
  | { message?: string; type?: string; status?: number }
  | Record<string, unknown>
  | null

const testTabs: TestTab[] = [
  {
    id: 'success',
    label: '1. 成功测试',
    description: '标准成功响应，返回数据与状态',
    tone: 'success'
  },
  {
    id: 'business',
    label: '2. 业务错误（catchBusiness）',
    description: '业务错误由 catchBusiness 内部处理，不提示',
    tone: 'warning'
  },
  {
    id: 'not-found',
    label: '3. 404 错误',
    description: '常见 HTTP 404 错误示例',
    tone: 'danger'
  },
  {
    id: 'bad-gateway',
    label: '4. 500 错误',
    description: '网关错误示例，演示错误捕获',
    tone: 'danger'
  },
  {
    id: 'chain-error',
    label: '5. 链式调用错误处理',
    description: '使用 catchHttp 链式处理 404 错误',
    tone: 'info'
  },
  {
    id: 'timeout',
    label: '6. 超时测试',
    description: '设置 2s 超时，触发网络超时异常',
    tone: 'warning'
  },
  {
    id: 'formData',
    label: '7. 文件上传',
    description: '使用 sendPostForm 上传文件',
    tone: 'info'
  },
  {
    id: 'cancel',
    label: '8. 可取消请求',
    description: '触发可取消请求，可手动终止',
    tone: 'warning'
  },
  {
    id: 'promise-all',
    label: '9. Promise.all 并行',
    description: '并行请求并归并结果',
    tone: 'info'
  }
]

const loading = ref(false)
const result = ref<GenericResult>(null)
const error = ref(false)
const testType = ref<string>('')
const selectedFile = ref<File | null>(null)
const cancelableRequest = ref<ReturnType<typeof sendGet> | null>(null)
const activeTab = ref<TestId>('success')

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const base = 1024
  const units = ['Bytes', 'KB', 'MB', 'GB']
  const index = Math.floor(Math.log(bytes) / Math.log(base))
  return `${Math.round((bytes / base ** index) * 100) / 100} ${units[index]}`
}

// 重置状态
function resetState(): void {
  error.value = false
  result.value = null
  testType.value = ''
}

const currentTab = computed<TestTab | undefined>(() =>
  testTabs.find((tab) => tab.id === activeTab.value)
)

async function handleSelectTab(id: TestId): Promise<void> {
  if (loading.value && activeTab.value === id) return
  activeTab.value = id
  await executeTest(id)
}

async function handleRerunCurrent(): Promise<void> {
  await executeTest(activeTab.value)
}

// 1. 成功测试
async function handleSuccess(): Promise<void> {
  loading.value = true
  resetState()
  const [data, fetchError, success] = await sendGet('/api/test/success', {})
  if (success) {
    result.value = data as Record<string, unknown>
    testType.value = '成功请求'
  } else {
    error.value = true
    result.value = { error: fetchError?.message, type: fetchError?.type }
    testType.value = `错误类型: ${fetchError?.type || 'unknown'}`
  }
  loading.value = false
}

// 2. 业务错误测试
async function handleBusinessError(): Promise<void> {
  loading.value = true
  resetState()
  await sendGet('/api/test/success-1').catchBusiness((businessError) => {
    result.value = {
      message: '业务错误已在 catchBusiness 中处理',
      type: businessError?.type
    }
    testType.value = '业务错误'
  })
  loading.value = false
}

// 3. 404错误测试
async function handleNotFound(): Promise<void> {
  loading.value = true
  resetState()
  const [, fetchError] = await sendGet('/api/test/not-found111')
  error.value = true
  result.value = {
    message: fetchError?.message,
    type: fetchError?.type,
    status: fetchError?.status
  }
  testType.value = `HTTP错误: ${fetchError?.status || 'unknown'}`
  loading.value = false
}

// 4. 500 错误测试
async function handleBadGateway(): Promise<void> {
  loading.value = true
  resetState()
  const [, fetchError] = await sendGet('http://localhost:3200/testApi/api/test/bad-gateway')
  if (fetchError) {
    error.value = true
    result.value = {
      message: fetchError.message,
      type: fetchError.type,
      status: fetchError.status
    }
    testType.value = '500 错误'
  }
  loading.value = false
}

// 5. 链式调用错误处理测试（404错误）
async function handleChainError(): Promise<void> {
  loading.value = true
  resetState()
  sendGet('/api/test/not-found').catchHttp((fetchError) => {
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
  loading.value = false
}

// 6. 超时测试
async function handleTimeout(): Promise<void> {
  loading.value = true
  resetState()
  await sendGet('/api/test/timeout', undefined, {
    timeout: 2000
  }).catchNetwork((fetchError) => {
    error.value = true
    result.value = { error: fetchError.message }
    testType.value = '网络错误'
  })
  loading.value = false
}

// 7. 文件上传测试
function handleFileSelect(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

async function handleFormData(): Promise<void> {
  resetState()
  if (!selectedFile.value) {
    testType.value = '请选择文件后再上传'
    return
  }
  loading.value = true
  try {
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
  } catch (uploadError) {
    error.value = true
    result.value = {
      error: uploadError instanceof Error ? uploadError.message : '未知错误'
    }
    testType.value = '异常错误'
  } finally {
    loading.value = false
  }
}

// 8. 可取消请求示例
async function handleCancelableRequest(): Promise<void> {
  loading.value = true
  resetState()
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
    result.value = data as Record<string, unknown>
    testType.value = '可取消请求成功'
  } else if (err) {
    error.value = true
    result.value = { error: err?.message, type: err?.type }
    testType.value = `错误类型: ${err?.type || 'unknown'}`
  }
  cancelableRequest.value = null
  loading.value = false
}

async function handlePromiseAll(): Promise<void> {
  loading.value = true
  resetState()
  const urls = ['/api/test/success', '/api/test/success-1', '/api/test/not-found']
  const responses = await Promise.all(urls.map((url) => sendGet(url)))
  const parallelResults: ParallelResultItem[] = responses.map(
    ([data, fetchError, success], index) => ({
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
    })
  )
  const hasError = parallelResults.some((item) => !item.success)
  if (hasError) {
    error.value = true
    testType.value = 'Promise.all 部分失败'
  } else {
    testType.value = 'Promise.all 全部成功'
  }
  result.value = parallelResults
  loading.value = false
}

function handleCancelNow(): void {
  if (!cancelableRequest.value) return
  cancelableRequest.value.cancel?.()
  result.value = { message: '请求已取消' }
  testType.value = '取消请求'
  cancelableRequest.value = null
  loading.value = false
}

const testExecutors: Record<TestId, () => Promise<void>> = {
  success: handleSuccess,
  business: handleBusinessError,
  'not-found': handleNotFound,
  'bad-gateway': handleBadGateway,
  'chain-error': handleChainError,
  timeout: handleTimeout,
  formData: handleFormData,
  cancel: handleCancelableRequest,
  'promise-all': handlePromiseAll
}

async function executeTest(id: TestId): Promise<void> {
  const executor = testExecutors[id]
  if (!executor) return
  await executor()
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

.tab-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  background: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  color: #2c3e50;
}

.tab-item:hover:not(:disabled) {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.tab-item:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.tab-item.active {
  border-color: #3498db;
  background: #e8f4ff;
}

.tab-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.tab-desc {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.tab-item.tone-success { border-left: 4px solid #27ae60; }
.tab-item.tone-warning { border-left: 4px solid #f39c12; }
.tab-item.tone-danger { border-left: 4px solid #e74c3c; }
.tab-item.tone-info { border-left: 4px solid #3498db; }

.tab-panel {
  background: #fff;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 1rem;
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tab-title {
  font-size: 1rem;
  font-weight: 700;
  color: #2c3e50;
}

.tab-subtitle {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.tab-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  background: #ecf0f1;
  color: #2c3e50;
  border: 1px solid #dfe6e9;
  border-radius: 6px;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.action-button:hover:not(:disabled) {
  background: #d0e6ff;
  border-color: #3498db;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.action-button.primary {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
}

.action-button.primary:hover:not(:disabled) {
  background: #2980b9;
}

.action-button.danger {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.action-button.danger:hover:not(:disabled) {
  background: #c0392b;
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

