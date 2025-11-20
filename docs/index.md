# My Hooks

一个 Vue 3 Composition API 工具库集合，灵感来自 VueUse。

## 特性

- 🎯 **Tree Shakeable** - 支持按需导入，减少打包体积
- 📦 **TypeScript** - 完整的 TypeScript 支持
- 🚀 **轻量级** - 零依赖（除了 Vue）
- 🔧 **易用** - 简单直观的 API
- 📚 **文档完善** - 详细的文档和示例

## 快速开始

### 安装

```bash
npm install my-hooks
# 或
pnpm add my-hooks
# 或
yarn add my-hooks
```

### 使用

```vue
<script setup lang="ts">
import { useCounter } from 'my-hooks'

const { count, inc, dec, reset } = useCounter(0)
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="inc()">+</button>
    <button @click="dec()">-</button>
    <button @click="reset()">Reset</button>
  </div>
</template>
```

## 按需导入

支持 tree shaking，只导入你需要的 hooks：

```ts
// ✅ 只导入需要的 hook
import { useCounter } from 'my-hooks'

// ✅ 或者从具体路径导入（更好的 tree shaking）
import { useCounter } from 'my-hooks/hooks/useCounter'
```

## 贡献

欢迎贡献新的 hooks！查看 [贡献指南](/guide/contributing) 了解更多。

