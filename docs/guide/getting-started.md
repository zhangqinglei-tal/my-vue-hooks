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
import { useCounter } from 'my-hooks'

const { count, inc, dec, reset } = useCounter(0)
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="inc()">增加</button>
    <button @click="dec()">减少</button>
    <button @click="reset()">重置</button>
  </div>
</template>
```

### 按需导入

为了获得最佳的 tree shaking 效果，建议从具体路径导入：

```ts
// 推荐：更好的 tree shaking
import { useCounter } from 'my-hooks/hooks/useCounter'

// 也可以从主入口导入
import { useCounter } from 'my-hooks'
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

