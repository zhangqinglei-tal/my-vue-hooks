# useTable 和 useFetch 集成总结

## ✅ 已完成的集成工作

### 1. 创建缺失的工具函数
- ✅ 创建了 `src/hooks/utils/utils.ts`
- ✅ 实现了 `getPropValue` 函数，用于从对象中根据路径获取值

### 2. 更新依赖配置
- ✅ 在 `package.json` 中添加了 `axios` 作为 `peerDependency`（可选）
- ✅ 在 `package.json` 中添加了 `axios` 作为 `devDependency`（用于类型检查）
- ✅ 在 `vite.config.ts` 中将 `axios` 配置为外部依赖

### 3. 更新导出配置
- ✅ 在 `src/index.ts` 中添加了 `useTable` 和 `useFetch` 的导出

### 4. 修复类型错误
- ✅ 修复了 `useToggle` 的类型问题

## 📦 依赖说明

### 必需依赖
- `vue`: `^3.0.0` (必需)

### 可选依赖
- `axios`: `^1.0.0` (可选)
  - 如果使用 `useTableRequest` 或 `useAxiosFetch`，需要安装 axios
  - 如果只使用 `useFetch`（原生 Fetch API），不需要 axios

## 🚀 使用方法

### useTable

```ts
import { useTableRequest, useTableStatic } from 'my-vue-hooks'

// 使用 API 请求的表格
const table = useTableRequest({
  request: async (params) => {
    const res = await fetch('/api/data', { ... })
    return res.json()
  }
})

// 使用静态数据的表格
const table = useTableStatic({
  data: []
})
```

### useFetch

```ts
import { useFetch, useAxiosFetch } from 'my-vue-hooks'

// 使用原生 Fetch API（不需要 axios）
const { data, loading, error, execute } = useFetch('/api/data')

// 使用 Axios（需要安装 axios）
const { data, loading, error, execute } = useAxiosFetch('/api/data')
```

## 📝 注意事项

1. **axios 依赖**：
   - `useTableRequest` 需要 axios（如果使用自定义 fetcher 则不需要）
   - `useAxiosFetch` 需要 axios
   - `useFetch` 不需要 axios（使用原生 Fetch API）

2. **按需导入**：
   - 支持 tree shaking，可以按需导入
   - 如果不需要 axios 相关功能，不会打包 axios 代码

3. **类型支持**：
   - 所有 hooks 都有完整的 TypeScript 类型定义
   - axios 类型已包含在 devDependencies 中

## 🔍 验证

运行以下命令验证集成：

```bash
# 类型检查
pnpm type-check

# 构建
pnpm build

# 运行测试
pnpm test
```

## 📚 相关文档

- `useTable` 文档：查看 `src/hooks/useTable/README.md`
- `useFetch` 文档：查看 `src/hooks/useFetch/README.md`

