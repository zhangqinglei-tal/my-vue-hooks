# 发布指南

本文档说明如何发布新版本的 SDK。

## 版本号规则

项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **MAJOR** (主版本号): 当你做了不兼容的 API 修改
- **MINOR** (次版本号): 当你做了向下兼容的功能性新增
- **PATCH** (修订号): 当你做了向下兼容的问题修正

## 发布流程

### 方法一：使用自动发布脚本（推荐）

```bash
# 发布补丁版本 (1.0.0 -> 1.0.1)
pnpm release:patch

# 发布次版本 (1.0.0 -> 1.1.0)
pnpm release:minor

# 发布主版本 (1.0.0 -> 2.0.0)
pnpm release:major
```

发布脚本会自动执行以下步骤：
1. ✅ 检查工作区是否干净
2. ✅ 运行测试
3. ✅ 类型检查
4. ✅ 更新版本号
5. ✅ 更新 CHANGELOG.md
6. ✅ 构建项目

### 方法二：手动发布

#### 1. 更新版本号

```bash
# 更新补丁版本
pnpm version:patch

# 更新次版本
pnpm version:minor

# 更新主版本
pnpm version:major

# 或直接指定版本号
node scripts/version.js 1.2.3
```

#### 2. 更新 CHANGELOG.md

手动编辑 `CHANGELOG.md`，添加新版本的变更记录。

#### 3. 构建项目

```bash
pnpm build
```

#### 4. 运行测试

```bash
pnpm test:run
```

#### 5. 提交更改

```bash
git add .
git commit -m "chore: release v1.0.1"
git tag v1.0.1
```

#### 6. 推送到远程

```bash
git push
git push --tags
```

#### 7. 发布到 npm

```bash
npm publish
```

## 发布前检查

在 `npm publish` 之前，会自动运行 `prepublishOnly` 脚本，执行以下检查：

- ✅ 检查 `dist` 目录是否存在
- ✅ 检查必要的构建文件是否存在
- ✅ 运行测试
- ✅ 类型检查
- ✅ 验证 package.json 配置

如果任何检查失败，发布将被阻止。

## 发布到不同的 npm registry

### 发布到 npm 官方源

```bash
npm publish
```

### 发布到私有 registry

```bash
npm publish --registry=https://your-registry.com
```

### 发布时指定 tag

```bash
# 发布 beta 版本
npm publish --tag beta

# 发布 next 版本
npm publish --tag next
```

## 回滚版本

如果发布后发现问题，可以：

1. **修复问题并发布新版本**（推荐）
   ```bash
   # 修复问题后
   pnpm release:patch
   ```

2. **撤销 npm 发布**（如果 72 小时内）
   ```bash
   npm unpublish my-hooks@1.0.1
   ```

3. **发布修复版本**
   ```bash
   npm deprecate my-hooks@1.0.1 "This version has a bug, please use 1.0.2"
   ```

## 版本号管理最佳实践

1. **开发阶段**: 使用 `0.x.x` 版本号
2. **稳定版本**: 从 `1.0.0` 开始
3. **重大变更**: 升级主版本号
4. **新功能**: 升级次版本号
5. **Bug 修复**: 升级修订号

## 示例发布流程

```bash
# 1. 开发新功能
git checkout -b feature/new-hook
# ... 开发代码 ...

# 2. 测试和构建
pnpm test
pnpm build

# 3. 提交代码
git add .
git commit -m "feat: add useMouse hook"
git push

# 4. 合并到主分支后，发布新版本
git checkout main
git pull
pnpm release:minor  # 因为添加了新功能

# 5. 按照提示完成发布
git add .
git commit -m "chore: release v1.1.0"
git tag v1.1.0
git push && git push --tags
npm publish
```

## 常见问题

### Q: 如何查看当前版本？

```bash
node -p "require('./package.json').version"
```

### Q: 如何查看发布历史？

```bash
npm view my-hooks versions
```

### Q: 如何查看特定版本的信息？

```bash
npm view my-hooks@1.0.0
```

### Q: 发布失败怎么办？

1. 检查 npm 登录状态: `npm whoami`
2. 检查包名是否可用
3. 检查是否有发布权限
4. 查看错误信息并修复

