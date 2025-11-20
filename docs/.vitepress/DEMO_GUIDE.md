# 在文档中添加可运行的示例

## 概述

VitePress 支持在 Markdown 文档中直接使用 Vue 组件，这使得我们可以在文档中嵌入可交互的示例。

## 使用方法

### 1. 创建示例组件

在 `docs/components/` 目录下创建 Vue 组件，例如 `CounterDemo.vue`：

```vue
<template>
  <div class="demo-container">
    <div class="demo-preview">
      <div class="demo-value">Count: {{ count }}</div>
    </div>
    <div class="demo-actions">
      <button class="demo-button" @click="inc()">+1</button>
      <button class="demo-button" @click="reset()">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCounter } from 'my-vue-hooks'

const { count, inc, reset } = useCounter(0)
</script>
```

### 2. 注册组件

在 `docs/.vitepress/theme/index.ts` 中注册组件：

```ts
import CounterDemo from '../components/CounterDemo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CounterDemo', CounterDemo)
  }
}
```

### 3. 在文档中使用

在 Markdown 文档中直接使用组件：

```markdown
## 基本用法

<CounterDemo />

### 代码示例

\`\`\`vue
<script setup lang="ts">
import { useCounter } from 'my-vue-hooks'
const { count, inc, reset } = useCounter(0)
</script>
\`\`\`
```

## 样式

示例组件可以使用预定义的样式类：

- `.demo-container` - 容器样式
- `.demo-preview` - 预览区域
- `.demo-actions` - 操作按钮区域
- `.demo-button` - 按钮样式
- `.demo-value` - 值显示样式

样式定义在 `docs/.vitepress/theme/style.css` 中。

## 注意事项

1. **导入路径**：组件中导入 `my-vue-hooks` 时，VitePress 会自动解析到 `src` 目录（通过 alias 配置）
2. **客户端渲染**：如果组件需要浏览器 API，可以使用 `<ClientOnly>` 包裹：
   ```vue
   <ClientOnly>
     <YourComponent />
   </ClientOnly>
   ```
3. **TypeScript**：确保组件使用 TypeScript 时，文件扩展名为 `.vue`，VitePress 会自动处理

## 现有示例组件

- `CounterDemo.vue` - useCounter 示例
- `ToggleDemo.vue` - useToggle 示例
- `LocalStorageDemo.vue` - useLocalStorage 示例

## 添加新示例

1. 在 `docs/components/` 创建新的 Vue 组件
2. 在 `docs/.vitepress/theme/index.ts` 中注册
3. 在相应的文档文件中使用

