# 快速开始

## 安装

使用你喜欢的包管理器安装：

```bash
# npm
npm install my-hooks

# pnpm
pnpm add my-hooks

# yarn
yarn add my-hooks
```

## 基本使用

### 导入和使用

```vue
<script setup lang="ts">
import { useFetchGet } from 'my-hooks'

const { data, loading, error } = useFetchGet('/api/user/info')
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <div v-else>{{ data }}</div>
  </div>
</template>
```

### 按需导入

为了获得最佳的 tree shaking 效果，建议从具体路径导入：

```ts
// 推荐：更好的 tree shaking
import { useFetchGet } from 'my-hooks/hooks/useFetch'

// 也可以从主入口导入
import { useFetchGet } from 'my-hooks'
```

## 在项目中使用

### Vite 项目

My Hooks 已经过优化，可以直接在 Vite 项目中使用，无需额外配置。

### Vue CLI 项目

确保你的 `vue.config.js` 支持 ES 模块：

```js
module.exports = {
  transpileDependencies: ['my-hooks']
}
```

## 下一步

- 查看 [所有可用的 Hooks](/hooks/)
- 了解如何 [添加新的 Hook](/guide/contributing)

