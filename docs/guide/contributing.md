# 贡献指南

感谢你考虑为 My Hooks 做贡献！本指南将帮助你了解如何添加新的 hook。

## 添加新 Hook 的步骤

### 1. 创建 Hook 文件

在 `src/hooks/` 目录下创建新的 hook 文件，例如 `useMyHook.ts`：

```ts
import { ref, type Ref } from 'vue'

export interface UseMyHookOptions {
  // 定义选项类型
}

export interface UseMyHookReturn {
  // 定义返回值类型
}

/**
 * Hook 的描述
 * @param param - 参数说明
 * @param options - 配置选项
 * @returns 返回值说明
 */
export function useMyHook(
  param: string,
  options: UseMyHookOptions = {}
): UseMyHookReturn {
  // 实现逻辑
  const state = ref(0)

  return {
    state,
    // 其他返回值
  }
}
```

### 2. 导出 Hook

在 `src/index.ts` 中添加导出：

```ts
export * from './hooks/useMyHook'
```

### 3. 编写测试

在 `src/hooks/__tests__/` 目录下创建测试文件 `useMyHook.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { useMyHook } from '../useMyHook'

describe('useMyHook', () => {
  it('should work', () => {
    const { state } = useMyHook('test')
    expect(state.value).toBe(0)
  })
})
```

### 4. 编写文档

在 `docs/hooks/` 目录下创建文档文件 `useMyHook.md`：

```markdown
# useMyHook

Hook 的描述

## 基本用法

\`\`\`vue
<script setup lang="ts">
import { useMyHook } from 'my-vue-hooks'

const { state } = useMyHook('test')
</script>
\`\`\`

## API

### 参数

...

### 返回值

...
```

### 5. 更新文档导航

在 `docs/.vitepress/config.ts` 的 sidebar 中添加新 hook：

```ts
{
  text: 'Hooks',
  items: [
    // ... 其他 hooks
    { text: 'useMyHook', link: '/hooks/useMyHook' }
  ]
}
```

### 6. 运行测试

```bash
pnpm test
```

### 7. 构建验证

```bash
pnpm build
```

确保构建成功且没有类型错误。

## Hook 开发规范

### 命名规范

- Hook 函数名必须以 `use` 开头，使用驼峰命名
- 文件名使用驼峰命名，与函数名一致

### 类型定义

- 所有 hook 都应该有完整的 TypeScript 类型定义
- 导出接口类型，方便用户使用

### 文档注释

- 使用 JSDoc 格式编写注释
- 说明参数、返回值和用法

### 响应式

- 充分利用 Vue 3 的响应式系统
- 返回 `Ref` 或 `ComputedRef` 等响应式类型

### 错误处理

- 提供适当的错误处理机制
- 使用 `onError` 回调或抛出错误

## 提交 Pull Request

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/useMyHook`)
3. 提交更改 (`git commit -m 'Add useMyHook'`)
4. 推送到分支 (`git push origin feature/useMyHook`)
5. 创建 Pull Request

## 代码风格

项目使用 ESLint 和 Prettier，提交前请运行：

```bash
pnpm lint
pnpm format
```

