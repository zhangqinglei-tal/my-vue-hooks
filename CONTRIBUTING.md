# 贡献指南

## 添加新 Hook 的步骤

### 方法一：使用脚本（推荐）

```bash
# 给脚本添加执行权限（首次使用）
chmod +x scripts/add-hook.sh

# 运行脚本创建新 hook
./scripts/add-hook.sh Mouse "响应式鼠标位置 hook"
```

脚本会自动：
1. 创建 hook 文件 (`src/hooks/useMouse.ts`)
2. 创建测试文件 (`src/hooks/__tests__/useMouse.test.ts`)
3. 创建文档文件 (`docs/hooks/useMouse.md`)
4. 更新 `src/index.ts` 导出
5. 更新文档导航配置

### 方法二：手动创建

#### 1. 创建 Hook 文件

在 `src/hooks/` 目录下创建新文件，例如 `useMouse.ts`：

```ts
import { ref, onMounted, onUnmounted } from 'vue'

export interface UseMouseReturn {
  x: Ref<number>
  y: Ref<number>
}

export function useMouse(): UseMouseReturn {
  const x = ref(0)
  const y = ref(0)

  const update = (e: MouseEvent) => {
    x.value = e.clientX
    y.value = e.clientY
  }

  onMounted(() => {
    window.addEventListener('mousemove', update)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })

  return { x, y }
}
```

#### 2. 导出 Hook

在 `src/index.ts` 中添加：

```ts
export * from './hooks/useMouse'
```

#### 3. 编写测试

在 `src/hooks/__tests__/` 创建 `useMouse.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { useMouse } from '../useMouse'

describe('useMouse', () => {
  it('should work', () => {
    const { x, y } = useMouse()
    expect(x.value).toBeDefined()
    expect(y.value).toBeDefined()
  })
})
```

#### 4. 编写文档

在 `docs/hooks/` 创建 `useMouse.md`：

```markdown
# useMouse

响应式鼠标位置 hook

## 基本用法

\`\`\`vue
<script setup lang="ts">
import { useMouse } from 'my-hooks'

const { x, y } = useMouse()
</script>
\`\`\`
```

#### 5. 更新文档导航

在 `docs/.vitepress/config.ts` 的 sidebar 中添加：

```ts
{ text: 'useMouse', link: '/hooks/useMouse' }
```

## 开发流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/useMouse
   ```

2. **开发 Hook**
   - 实现功能
   - 编写测试
   - 确保测试通过

3. **构建验证**
   ```bash
   pnpm build
   pnpm test
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add useMouse hook"
   ```

5. **创建 Pull Request**

## 代码规范

- 使用 TypeScript，提供完整类型定义
- 遵循现有代码风格（Prettier + ESLint）
- 每个 hook 都要有测试覆盖
- 每个 hook 都要有文档说明
- 使用 JSDoc 注释

## 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test --watch

# 覆盖率
pnpm test --coverage
```

## 构建

```bash
# 构建库
pnpm build

# 检查类型
pnpm type-check
```

## 文档

```bash
# 开发文档
pnpm dev:docs

# 构建文档
pnpm build:docs
```

