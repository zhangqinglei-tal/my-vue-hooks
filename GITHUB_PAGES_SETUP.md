# GitHub Pages 部署指南

本指南将帮助你将 VitePress 文档部署到 GitHub Pages，生成类似 `https://your-username.github.io/my-vue-hooks/hooks/` 的可访问地址。

## 前置条件

1. 项目已推送到 GitHub
2. 仓库已启用 GitHub Pages（会自动启用）

## 部署方式

### 方式一：自动部署（推荐）

项目已配置 GitHub Actions，当你推送代码到 `main` 分支时，文档会自动部署。

#### 步骤 1: 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 `Settings` > `Pages`
3. 在 `Source` 部分，选择：
   - **Source**: `GitHub Actions`
4. 保存设置

#### 步骤 2: 设置正确的 base 路径

根据你的仓库类型，需要设置不同的 base 路径：

**如果是普通仓库**（如 `username/my-vue-hooks`）：
- base 路径应该是 `/my-vue-hooks/`
- 访问地址：`https://username.github.io/my-vue-hooks/`

**如果是用户/组织主页仓库**（如 `username/username.github.io`）：
- base 路径应该是 `/`
- 访问地址：`https://username.github.io/`

#### 步骤 3: 更新 VitePress 配置

如果仓库名不是 `my-vue-hooks`，需要更新 `.github/workflows/docs.yml` 中的 base 路径：

```yaml
env:
  BASE_PATH: '/your-repo-name/'  # 替换为你的仓库名
```

或者，如果你想在本地测试不同的 base 路径，可以修改 `docs/.vitepress/config.ts`：

```ts
const base = process.env.BASE_PATH || '/your-repo-name/'
```

#### 步骤 4: 推送代码触发部署

```bash
git add .
git commit -m "chore: setup GitHub Pages deployment"
git push origin main
```

部署完成后，访问 `https://your-username.github.io/your-repo-name/` 即可看到文档。

### 方式二：手动部署

如果你想手动部署：

```bash
# 构建文档
pnpm build:docs

# 进入构建目录
cd docs/.vitepress/dist

# 初始化 git（如果还没有）
git init
git add .
git commit -m "deploy docs"

# 添加 GitHub Pages 分支
git branch -M gh-pages
git remote add origin https://github.com/YOUR_USERNAME/my-vue-hooks.git

# 推送到 gh-pages 分支
git push -f origin gh-pages
```

然后在 GitHub 仓库设置中选择 `gh-pages` 分支作为 Pages 源。

## 自定义域名（可选）

如果你想使用自定义域名：

1. 在 `docs/.vitepress/dist` 目录创建 `CNAME` 文件，内容为你的域名：
   ```
   docs.yourdomain.com
   ```

2. 在 GitHub Pages 设置中添加自定义域名

3. 在你的 DNS 提供商处添加 CNAME 记录

## 验证部署

部署成功后，你可以：

1. 在 GitHub 仓库的 `Actions` 标签页查看部署状态
2. 访问 `https://your-username.github.io/your-repo-name/` 查看文档
3. 检查所有链接是否正常工作

## 常见问题

### 1. 页面显示 404

- 检查 base 路径是否正确
- 确认 GitHub Pages 源设置为 `GitHub Actions`
- 查看 Actions 日志是否有错误

### 2. 资源加载失败（CSS/JS 404）

- 确保 base 路径配置正确
- 检查 VitePress 配置中的 base 是否与仓库名匹配

### 3. 部署后内容没有更新

- 等待几分钟让 GitHub Pages 更新
- 检查 Actions 是否成功完成
- 清除浏览器缓存

### 4. 如何更新 GitHub 链接

在 `docs/.vitepress/config.ts` 中更新：

```ts
nav: [
  { text: 'GitHub', link: 'https://github.com/YOUR_USERNAME/my-vue-hooks' }
],
socialLinks: [
  { icon: 'github', link: 'https://github.com/YOUR_USERNAME/my-vue-hooks' }
]
```

## 参考

- [VitePress 部署指南](https://vitepress.dev/guide/deploying)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

