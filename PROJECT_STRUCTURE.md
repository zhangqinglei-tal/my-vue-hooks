# 项目结构

```
my-vue-hooks/
├── src/                    # 源代码目录
│   ├── hooks/             # Hooks 实现
│   │   ├── __tests__/     # 测试文件
│   │   │   ├── useCounter.test.ts
│   │   │   └── useToggle.test.ts
│   │   ├── useCounter.ts
│   │   ├── useToggle.ts
│   │   └── useLocalStorage.ts
│   └── index.ts           # 主入口文件，导出所有 hooks
│
├── docs/                   # 文档网站
│   ├── .vitepress/        # VitePress 配置
│   │   └── config.ts
│   ├── guide/             # 指南文档
│   │   ├── index.md
│   │   ├── getting-started.md
│   │   └── contributing.md
│   ├── hooks/             # Hooks 文档
│   │   ├── useCounter.md
│   │   ├── useToggle.md
│   │   └── useLocalStorage.md
│   └── index.md           # 文档首页
│
├── templates/              # Hook 模板文件
│   ├── hook-template.ts
│   ├── hook-test-template.ts
│   └── hook-doc-template.md
│
├── scripts/                # 工具脚本
│   └── add-hook.sh        # 添加新 hook 的脚本
│
├── dist/                   # 构建输出目录（生成）
│
├── vite.config.ts         # Vite 构建配置
├── vitest.config.ts       # Vitest 测试配置
├── tsconfig.json          # TypeScript 配置
├── package.json           # 项目配置
├── .eslintrc.json         # ESLint 配置
├── .prettierrc            # Prettier 配置
├── .gitignore             # Git 忽略文件
├── .npmignore             # NPM 发布忽略文件
├── README.md              # 项目说明
├── CONTRIBUTING.md        # 贡献指南
└── PROJECT_STRUCTURE.md   # 本文件
```

## 核心特性

### 1. Tree Shaking 支持

- **Vite 库模式**: 使用 Vite 的库模式构建
- **preserveModules**: 保持模块结构，支持按需导入
- **多格式输出**: 同时支持 ES 模块和 CommonJS
- **package.json exports**: 配置了完整的导出映射

### 2. 文档网站

- **VitePress**: 使用 VitePress 构建文档网站
- **自动导航**: 侧边栏自动配置
- **搜索功能**: 内置本地搜索
- **代码示例**: 每个 hook 都有完整的使用示例

### 3. 开发工具

- **TypeScript**: 完整的类型支持
- **Vitest**: 单元测试框架
- **ESLint**: 代码检查
- **Prettier**: 代码格式化

### 4. 添加新 Hook 流程

#### 快速方式（使用脚本）

```bash
./scripts/add-hook.sh HookName "Hook Description"
```

#### 手动方式

1. 在 `src/hooks/` 创建 hook 文件
2. 在 `src/index.ts` 导出
3. 在 `src/hooks/__tests__/` 创建测试
4. 在 `docs/hooks/` 创建文档
5. 在 `docs/.vitepress/config.ts` 更新导航

## 构建流程

### 开发

```bash
# 安装依赖
pnpm install

# 开发模式（如果有示例项目）
pnpm dev

# 运行测试
pnpm test

# 类型检查
pnpm type-check
```

### 构建

```bash
# 构建库
pnpm build

# 构建文档
pnpm build:docs
```

构建后的文件结构：

```
dist/
├── my-vue-hooks.es.js         # ES 模块格式
├── my-vue-hooks.cjs.js        # CommonJS 格式
├── index.d.ts             # TypeScript 类型定义
├── hooks/
│   ├── useCounter.js
│   ├── useCounter.d.ts
│   └── ...
└── ...
```

## 使用方式

### 从主入口导入

```ts
import { useCounter } from 'my-vue-hooks'
```

### 从具体路径导入（更好的 tree shaking）

```ts
import { useCounter } from 'my-vue-hooks/hooks/useCounter'
```

## 发布

1. 更新版本号
2. 构建项目: `pnpm build`
3. 运行测试: `pnpm test`
4. 发布: `npm publish`

