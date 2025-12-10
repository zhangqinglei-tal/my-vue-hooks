<template>
  <div class="demo-section">
    <h2>toAwaitFetch</h2>
    <div class="tabs">
      <button 
        v-for="tab in fetchTabs" 
        :key="tab.value"
        class="tab"
        :class="{ active: activeFetchTab === tab.value }"
        @click="activeFetchTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <!-- 方式一：简单使用 -->
    <SimpleUsage v-if="activeFetchTab === 'simple'" />
    
    <!-- 方式二：全局配置 -->
    <GlobalConfig v-if="activeFetchTab === 'global'" />
    
    <!-- 方式三：最佳实践 -->
    <BestPractice v-if="activeFetchTab === 'best'" />
    
    <!-- 方式四：文件上传 -->
    <FileUpload v-if="activeFetchTab === 'upload'" />
    
    <!-- 方式五：文件下载 -->
    <FileDownload v-if="activeFetchTab === 'download'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SimpleUsage from './toAwaitFetch/SimpleUsage.vue'
import GlobalConfig from './toAwaitFetch/GlobalConfig.vue'
import BestPractice from './toAwaitFetch/BestPractice.vue'
import FileUpload from './toAwaitFetch/FileUpload.vue'
import FileDownload from './toAwaitFetch/FileDownload.vue'

const fetchTabs = [
  { label: '方式一：简单使用', value: 'simple' },
  { label: '方式二：全局配置', value: 'global' },
  { label: '方式三：最佳实践', value: 'best' },
  { label: '方式四：文件上传', value: 'upload' },
  { label: '方式五：文件下载', value: 'download' }
]

const activeFetchTab = ref('simple')
</script>

<style scoped>
.demo-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.demo-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

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

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: #7f8c8d;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.tab.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.tab:hover {
  color: #3498db;
}
</style>

