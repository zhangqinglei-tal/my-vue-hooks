# My Hooks

一个 Vue 3 Composition API 工具库集合，灵感来自 VueUse。

## ✨ 特性

- 🎯 **Tree Shakeable** - 支持按需导入，减少打包体积
- 📦 **TypeScript** - 完整的 TypeScript 支持
- 🚀 **轻量级** - 零依赖（除了 Vue）
- 🔧 **易用** - 简单直观的 API
- 📚 **文档完善** - 详细的文档和示例

## 📦 安装

```bash
npm install my-hooks
# 或
pnpm add my-hooks
# 或
yarn add my-hooks
```

## 🚀 快速开始

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

## 📖 文档

查看 [完整文档](https://your-docs-site.com) 了解更多。

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 开发文档
pnpm dev:docs

# 构建文档
pnpm build:docs
```

## 📝 添加新 Hook

查看 [贡献指南](./docs/guide/contributing.md) 了解如何添加新的 hook。

## 🚀 发布 SDK

### 快速发布

```bash
# 发布补丁版本 (1.0.0 -> 1.0.1)
pnpm release:patch

# 发布次版本 (1.0.0 -> 1.1.0)
pnpm release:minor

# 发布主版本 (1.0.0 -> 2.0.0)
pnpm release:major
```

### 手动发布

1. 更新版本号: `pnpm version:patch|minor|major`
2. 更新 CHANGELOG.md
3. 构建: `pnpm build`
4. 测试: `pnpm test:run`
5. 提交: `git commit -m "chore: release v1.0.1" && git tag v1.0.1`
6. 发布: `npm publish`

详细说明请查看 [发布指南](./RELEASE.md)。

## 📦 版本信息

SDK 内置了版本信息，可以在代码中使用：

```ts
import { VERSION, getVersion } from 'my-hooks'

console.log(VERSION)        // "1.0.0"
console.log(getVersion())    // "1.0.0"
```

## 📄 License

MIT

