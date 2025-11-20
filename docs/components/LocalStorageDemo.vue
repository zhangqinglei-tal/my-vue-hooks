<template>
  <ClientOnly>
    <div class="demo-container">
      <div class="demo-preview">
        <div class="demo-value">Stored Name: {{ name }}</div>
        <input
          v-model="name"
          placeholder="Enter name"
          style="padding: 0.5rem; border: 1px solid var(--vp-c-divider); border-radius: 4px; width: 100%; max-width: 300px;"
        />
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--vp-c-text-2);">
          修改后刷新页面，值会保留
        </p>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useLocalStorage } from 'my-hooks'

const name = useLocalStorage('demo-name', 'Vue')
</script>

