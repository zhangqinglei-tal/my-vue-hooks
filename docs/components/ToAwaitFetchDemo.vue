<template>
  <ClientOnly>
    <div class="demo-container">
      <div class="demo-preview">
        <div class="demo-header">
          <h4>toAwaitFetch 使用方式演示</h4>
        </div>

        <!-- 使用方式选项卡 -->
        <div class="demo-tabs">
          <button 
            v-for="mode in modes" 
            :key="mode.value"
            class="demo-tab" 
            :class="{ active: activeMode === mode.value }"
            @click="activeMode = mode.value"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- 方式一：最简单的 GET、POST -->
        <div v-if="activeMode === 'simple'" class="demo-content">
          <div class="demo-section">
            <h5>方式一：最简单的 GET、POST 使用方式</h5>
            <p class="demo-description">直接导入方法，无需配置即可使用</p>
            <div class="demo-buttons">
              <button class="demo-button" @click="handleSimpleGet" :disabled="isLoading">
                {{ isLoading ? '加载中...' : 'GET 请求' }}
              </button>
              <button class="demo-button" @click="handleSimplePost" :disabled="isLoading">
                POST 请求
              </button>
              <button class="demo-button" @click="handleSimpleGetWithParams" :disabled="isLoading">
                GET 带参数
              </button>
            </div>
          </div>
        </div>

        <!-- 方式二：全局配置 -->
        <div v-if="activeMode === 'global'" class="demo-content">
          <div class="demo-section">
            <h5>方式二：全局配置</h5>
            <p class="demo-description">配置默认实例的全局配置，之后所有请求都会使用这些配置</p>
            <div class="demo-config">
              <div class="demo-config-item">
                <label>BaseURL:</label>
                <input v-model="globalConfig.baseURL" type="text" placeholder="https://api.example.com" />
              </div>
              <div class="demo-config-item">
                <label>Timeout:</label>
                <input v-model.number="globalConfig.timeout" type="number" placeholder="5000" />
              </div>
            </div>
            <div class="demo-buttons">
              <button class="demo-button" @click="handleSetGlobalConfig">设置全局配置</button>
              <button class="demo-button" @click="handleGlobalGet" :disabled="isLoading">
                {{ isLoading ? '加载中...' : '使用全局配置 GET' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 方式三：最佳实践 -->
        <div v-if="activeMode === 'best'" class="demo-content">
          <div class="demo-section">
            <h5>方式三：最佳实践 - 在 http.ts 中封装（推荐）</h5>
            <p class="demo-description">使用 createInstance 创建实例，在项目中统一封装</p>
            <div class="demo-buttons">
              <button class="demo-button" @click="handleBestGet" :disabled="isLoading">
                {{ isLoading ? '加载中...' : 'GET 请求' }}
              </button>
              <button class="demo-button" @click="handleBestPost" :disabled="isLoading">
                POST 请求
              </button>
            </div>
          </div>
        </div>

        <!-- 方式四：上传附件 -->
        <div v-if="activeMode === 'upload'" class="demo-content">
          <div class="demo-section">
            <h5>方式四：上传附件（FormData 提交）</h5>
            <p class="demo-description">上传文件时使用 FormData</p>
            <div class="demo-upload">
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileSelect"
                accept="image/*,text/*"
                style="margin-bottom: 1rem;"
              />
              <div v-if="selectedFile" class="demo-file-info">
                <p>已选择文件: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</p>
              </div>
            </div>
            <div class="demo-buttons">
              <button 
                class="demo-button" 
                @click="handleUploadAuto" 
                :disabled="isLoading || !selectedFile"
              >
                {{ isLoading ? '上传中...' : '方式1: 自动转换 FormData' }}
              </button>
              <button 
                class="demo-button" 
                @click="handleUploadManual" 
                :disabled="isLoading || !selectedFile"
              >
                {{ isLoading ? '上传中...' : '方式2: 手动 FormData' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 方式五：文件流 -->
        <div v-if="activeMode === 'download'" class="demo-content">
          <div class="demo-section">
            <h5>方式五：解析返回的文件流</h5>
            <p class="demo-description">下载文件或处理二进制数据</p>
            <div class="demo-buttons">
              <button class="demo-button" @click="handleDownloadBlob" :disabled="isLoading">
                {{ isLoading ? '下载中...' : '下载 Blob 文件' }}
              </button>
              <button class="demo-button" @click="handleDownloadText" :disabled="isLoading">
                {{ isLoading ? '加载中...' : '获取文本文件' }}
              </button>
              <button class="demo-button" @click="handleDownloadArrayBuffer" :disabled="isLoading">
                {{ isLoading ? '加载中...' : '获取 ArrayBuffer' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 结果显示 -->
        <div v-if="isLoading" class="demo-loading">加载中...</div>
        <div v-else-if="errorMessage" class="demo-error">
          <p><strong>错误类型:</strong> {{ errorType }}</p>
          <p><strong>错误信息:</strong> {{ errorMessage }}</p>
        </div>
        <div v-else-if="responseData" class="demo-data">
          <p class="demo-success">✅ 请求成功</p>
          <pre v-if="typeof responseData === 'string'">{{ responseData }}</pre>
          <pre v-else>{{ JSON.stringify(responseData, null, 2) }}</pre>
        </div>
        <div v-else-if="downloadInfo" class="demo-data">
          <p class="demo-success">✅ {{ downloadInfo }}</p>
        </div>
        <div v-else class="demo-empty">
          <p>选择上方使用方式并点击按钮开始演示</p>
        </div>

        <!-- 请求日志 -->
        <div v-if="requestLog.length > 0" class="demo-log">
          <h5>请求日志</h5>
          <div class="demo-log-items">
            <div 
              v-for="(log, index) in requestLog" 
              :key="index" 
              class="demo-log-item"
              :class="log.type"
            >
              <span class="demo-log-time">{{ log.time }}</span>
              <span class="demo-log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// @ts-expect-error - VitePress 环境中的类型解析问题，运行时正常
import { sendGet, sendPost, setGlobalConfig } from 'my-vue-hooks/hooks/toAwaitFetch/toAwaitFetch'
// @ts-expect-error - VitePress 环境中的类型解析问题，运行时正常
import { createInstance } from 'my-vue-hooks/hooks/toAwaitFetch/toAwaitFetch'

// 使用方式选项卡
const modes = [
  { label: '方式一：简单使用', value: 'simple' },
  { label: '方式二：全局配置', value: 'global' },
  { label: '方式三：最佳实践', value: 'best' },
  { label: '方式四：文件上传', value: 'upload' },
  { label: '方式五：文件下载', value: 'download' }
]

const activeMode = ref('simple')
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const errorType = ref<string>('')
const responseData = ref<any>(null)
const downloadInfo = ref<string | null>(null)
const requestLog = ref<Array<{ time: string; message: string; type: string }>>([])
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// 全局配置
const globalConfig = ref({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000
})

// 方式三：创建实例（模拟 http.ts 封装）
const httpInstance = createInstance({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000
})
const { sendGet: httpSendGet, sendPost: httpSendPost } = httpInstance

// 添加日志
const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const time = new Date().toLocaleTimeString()
  requestLog.value.unshift({ time, message, type })
  if (requestLog.value.length > 10) {
    requestLog.value = requestLog.value.slice(0, 10)
  }
}

// 重置状态
const resetState = () => {
  isLoading.value = true
  errorMessage.value = null
  errorType.value = ''
  responseData.value = null
  downloadInfo.value = null
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 方式一：最简单的 GET、POST
const handleSimpleGet = async () => {
  resetState()
  addLog('方式一：发起简单 GET 请求...', 'info')

  try {
    const [data, error, success] = await sendGet('https://jsonplaceholder.typicode.com/posts/1')
    
    if (success) {
      responseData.value = data
      addLog('GET 请求成功', 'success')
    } else {
      errorMessage.value = error?.message || '请求失败'
      errorType.value = error?.type || 'unknown'
      addLog(`GET 请求失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`请求异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleSimplePost = async () => {
  resetState()
  addLog('方式一：发起简单 POST 请求...', 'info')

  try {
    const postData = {
      title: '测试标题',
      body: '测试内容',
      userId: 1
    }

    const [data, error, success] = await sendPost('https://jsonplaceholder.typicode.com/posts', postData)
    
    if (success) {
      responseData.value = data
      addLog('POST 请求成功', 'success')
    } else {
      errorMessage.value = error?.message || '请求失败'
      errorType.value = error?.type || 'unknown'
      addLog(`POST 请求失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`请求异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleSimpleGetWithParams = async () => {
  resetState()
  addLog('方式一：发起带参数的 GET 请求...', 'info')

  try {
    const [data, error, success] = await sendGet('https://jsonplaceholder.typicode.com/posts', {
      _limit: 5,
      _page: 1
    })
    
    if (success) {
      responseData.value = data
      addLog('GET 请求（带参数）成功', 'success')
    } else {
      errorMessage.value = error?.message || '请求失败'
      errorType.value = error?.type || 'unknown'
      addLog(`GET 请求失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`请求异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 方式二：全局配置
const handleSetGlobalConfig = () => {
  setGlobalConfig({
    baseURL: globalConfig.value.baseURL,
    timeout: globalConfig.value.timeout
  })
  addLog(`设置全局配置: baseURL=${globalConfig.value.baseURL}, timeout=${globalConfig.value.timeout}`, 'info')
}

const handleGlobalGet = async () => {
  resetState()
  addLog('方式二：使用全局配置发起 GET 请求...', 'info')

  try {
    const [data, error, success] = await sendGet('/posts/1')
    
    if (success) {
      responseData.value = data
      addLog('使用全局配置的 GET 请求成功', 'success')
    } else {
      errorMessage.value = error?.message || '请求失败'
      errorType.value = error?.type || 'unknown'
      addLog(`GET 请求失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`请求异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 方式三：最佳实践
const handleBestGet = async () => {
  resetState()
  addLog('方式三：使用封装实例发起 GET 请求...', 'info')

  try {
    const [data, error, success] = await httpSendGet('/posts/1')
    
    if (success) {
      responseData.value = data
      addLog('封装实例 GET 请求成功', 'success')
    } else {
      errorMessage.value = error?.message || '请求失败'
      errorType.value = error?.type || 'unknown'
      addLog(`GET 请求失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`请求异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleBestPost = async () => {
  resetState()
  addLog('方式三：使用封装实例发起 POST 请求...', 'info')

  try {
    const postData = {
      title: '最佳实践示例',
      body: '使用 createInstance 封装的实例',
      userId: 1
    }

    const [data, error, success] = await httpSendPost('/posts', postData)
    
    if (success) {
      responseData.value = data
      addLog('封装实例 POST 请求成功', 'success')
    } else {
      errorMessage.value = error?.message || '请求失败'
      errorType.value = error?.type || 'unknown'
      addLog(`POST 请求失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`请求异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 方式四：文件上传
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    addLog(`选择文件: ${selectedFile.value.name}`, 'info')
  }
}

const handleUploadAuto = async () => {
  if (!selectedFile.value) return
  
  resetState()
  addLog('方式四：方式1 - 自动转换 FormData 上传...', 'info')

  try {
    const [data, error, success] = await sendPost('https://httpbin.org/post', {
      file: selectedFile.value,
      name: 'avatar',
      description: '用户头像'
    }, {
      requestType: 'form'
    })
    
    if (success) {
      responseData.value = {
        message: '上传成功',
        filename: selectedFile.value.name,
        filesize: formatFileSize(selectedFile.value.size),
        response: data
      }
      addLog('文件上传成功（自动转换）', 'success')
    } else {
      errorMessage.value = error?.message || '上传失败'
      errorType.value = error?.type || 'unknown'
      addLog(`上传失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`上传异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleUploadManual = async () => {
  if (!selectedFile.value) return
  
  resetState()
  addLog('方式四：方式2 - 手动创建 FormData 上传...', 'info')

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('name', 'avatar')

    const [data, error, success] = await sendPost('https://httpbin.org/post', formData, {
      requestType: 'form'
    })
    
    if (success) {
      responseData.value = {
        message: '上传成功',
        filename: selectedFile.value.name,
        filesize: formatFileSize(selectedFile.value.size),
        response: data
      }
      addLog('文件上传成功（手动 FormData）', 'success')
    } else {
      errorMessage.value = error?.message || '上传失败'
      errorType.value = error?.type || 'unknown'
      addLog(`上传失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`上传异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 方式五：文件下载
const handleDownloadBlob = async () => {
  resetState()
  addLog('方式五：下载 Blob 文件...', 'info')

  try {
    // 使用一个返回图片的 API
    const [data, error, success] = await sendGet('https://picsum.photos/200/300', undefined, {
      responseType: 'blob'
    })
    
    if (success && data instanceof Blob) {
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'demo-image.jpg'
      link.click()
      window.URL.revokeObjectURL(url)
      downloadInfo.value = 'Blob 文件下载成功（已触发下载）'
      addLog('Blob 文件下载成功', 'success')
    } else {
      errorMessage.value = error?.message || '下载失败'
      errorType.value = error?.type || 'unknown'
      addLog(`下载失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`下载异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleDownloadText = async () => {
  resetState()
  addLog('方式五：获取文本文件...', 'info')

  try {
    // 使用一个返回文本的 API
    const [data, error, success] = await sendGet('https://jsonplaceholder.typicode.com/posts/1', undefined, {
      responseType: 'text'
    })
    
    if (success) {
      responseData.value = data
      downloadInfo.value = '文本文件获取成功'
      addLog('文本文件获取成功', 'success')
    } else {
      errorMessage.value = error?.message || '获取失败'
      errorType.value = error?.type || 'unknown'
      addLog(`获取失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`获取异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleDownloadArrayBuffer = async () => {
  resetState()
  addLog('方式五：获取 ArrayBuffer...', 'info')

  try {
    // 使用一个返回二进制数据的 API
    const [data, error, success] = await sendGet('https://picsum.photos/200/300', undefined, {
      responseType: 'arraybuffer'
    })
    
    if (success && data instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(data)
      responseData.value = {
        message: 'ArrayBuffer 获取成功',
        size: data.byteLength,
        preview: `前 20 字节: ${Array.from(uint8Array.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`
      }
      downloadInfo.value = `ArrayBuffer 获取成功，大小: ${formatFileSize(data.byteLength)}`
      addLog('ArrayBuffer 获取成功', 'success')
    } else {
      errorMessage.value = error?.message || '获取失败'
      errorType.value = error?.type || 'unknown'
      addLog(`获取失败: ${errorMessage.value}`, 'error')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    errorType.value = 'network'
    addLog(`获取异常: ${errorMessage.value}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  addLog('演示组件已加载', 'info')
})
</script>

<style scoped>
.demo-container {
  margin: 1.5rem 0;
}

.demo-preview {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--vp-c-bg);
}

.demo-header {
  margin-bottom: 1rem;
}

.demo-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.demo-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  flex-wrap: wrap;
}

.demo-tab {
  padding: 0.5rem 1rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.demo-tab:hover {
  color: var(--vp-c-text-1);
}

.demo-tab.active {
  color: var(--vp-c-brand);
  border-bottom-color: var(--vp-c-brand);
}

.demo-content {
  margin-bottom: 1.5rem;
}

.demo-section {
  margin-bottom: 1rem;
}

.demo-section h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.demo-description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.demo-config {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.demo-config-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.demo-config-item label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  min-width: 70px;
}

.demo-config-item input {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  width: 200px;
}

.demo-upload {
  margin-bottom: 1rem;
}

.demo-file-info {
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.demo-file-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.demo-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.demo-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.demo-button:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand);
}

.demo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-loading,
.demo-error,
.demo-data,
.demo-empty {
  padding: 1rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  margin-bottom: 1rem;
}

.demo-error {
  color: var(--vp-c-red);
}

.demo-error p {
  margin: 0.5rem 0;
}

.demo-success {
  color: var(--vp-c-green);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.demo-data pre {
  margin: 0;
  font-size: 0.875rem;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.demo-empty {
  color: var(--vp-c-text-2);
  text-align: center;
}

.demo-log {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.demo-log h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.demo-log-items {
  max-height: 200px;
  overflow-y: auto;
}

.demo-log-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.demo-log-item.success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--vp-c-green);
}

.demo-log-item.error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--vp-c-red);
}

.demo-log-item.info {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.demo-log-time {
  font-family: monospace;
  color: var(--vp-c-text-3);
  min-width: 80px;
}

.demo-log-message {
  flex: 1;
}
</style>
