# GitHub 发布指南

本指南将帮助你将项目发布到 GitHub。

## 步骤 1: 在 GitHub 上创建仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 `+` 按钮，选择 `New repository`
3. 填写仓库信息：
   - **Repository name**: `my-vue-hooks` (或你喜欢的名字)
   - **Description**: `A collection of Vue 3 Composition API utilities inspired by VueUse`
   - **Visibility**: 选择 `Public` (公开) 或 `Private` (私有)
   - **不要**勾选 "Initialize this repository with a README"（我们已经有了）
4. 点击 `Create repository`

## 步骤 2: 本地初始化 Git 仓库（如果还没有）

项目已经初始化了 Git 仓库，你可以直接进行下一步。

## 步骤 3: 创建初始提交

```bash
# 添加所有文件
git add .

# 创建初始提交
git commit -m "feat: initial commit

- Add Vue 3 Composition API hooks (useCounter, useToggle, useLocalStorage)
- Add data fetching hooks (useFetch, useAxiosFetch)
- Add table management hooks (useTableRequest, useTableStatic)
- Add comprehensive documentation with VitePress
- Add test coverage for all hooks
- Add version control and release scripts"
```

## 步骤 4: 添加远程仓库并推送

将下面的 `YOUR_USERNAME` 替换为你的 GitHub 用户名：

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/my-vue-hooks.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/my-vue-hooks.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

## 步骤 5: 验证

访问 `https://github.com/YOUR_USERNAME/my-vue-hooks` 确认代码已成功推送。

## 后续操作

### 添加 GitHub Actions（可选）

可以添加 CI/CD 工作流来自动化测试和发布。

### 添加 GitHub Pages（用于文档）

1. 在仓库设置中，进入 `Pages` 选项
2. 选择 `GitHub Actions` 作为源
3. 创建 `.github/workflows/docs.yml` 文件来自动部署文档

### 添加徽章到 README

可以在 README.md 中添加一些徽章，例如：

```markdown
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/my-vue-hooks)
![GitHub license](https://img.shields.io/github/license/YOUR_USERNAME/my-vue-hooks)
![npm version](https://img.shields.io/npm/v/my-vue-hooks)
```

## 常见问题

### 如果推送时遇到认证问题

1. **使用 Personal Access Token**:
   - 在 GitHub Settings > Developer settings > Personal access tokens 创建 token
   - 使用 token 作为密码推送

2. **使用 SSH**:
   - 配置 SSH key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
   - 使用 SSH URL: `git@github.com:YOUR_USERNAME/my-vue-hooks.git`

### 如果仓库已经存在

如果远程仓库已经有一些文件（比如 README），需要先拉取：

```bash
git pull origin main --allow-unrelated-histories
# 解决可能的冲突
git push -u origin main
```

