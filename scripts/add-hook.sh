#!/bin/bash

# 添加新 Hook 的脚本
# 使用方法: ./scripts/add-hook.sh HookName "Hook Description"

if [ -z "$1" ]; then
  echo "错误: 请提供 Hook 名称"
  echo "使用方法: ./scripts/add-hook.sh HookName \"Hook Description\""
  exit 1
fi

HOOK_NAME=$1
HOOK_DESCRIPTION=${2:-"A new hook"}

# 转换为正确的格式
HOOK_FILE_NAME="use${HOOK_NAME}.ts"
HOOK_TEST_NAME="use${HOOK_NAME}.test.ts"
HOOK_DOC_NAME="use${HOOK_NAME}.md"

echo "创建 Hook: $HOOK_NAME"
echo "描述: $HOOK_DESCRIPTION"

# 创建 Hook 文件
if [ ! -f "src/hooks/$HOOK_FILE_NAME" ]; then
  sed "s/{{HookName}}/$HOOK_NAME/g; s/{{HookDescription}}/$HOOK_DESCRIPTION/g" \
    templates/hook-template.ts > "src/hooks/$HOOK_FILE_NAME"
  echo "✓ 创建 src/hooks/$HOOK_FILE_NAME"
else
  echo "✗ src/hooks/$HOOK_FILE_NAME 已存在"
fi

# 创建测试文件
if [ ! -f "src/hooks/__tests__/$HOOK_TEST_NAME" ]; then
  sed "s/{{HookName}}/$HOOK_NAME/g" \
    templates/hook-test-template.ts > "src/hooks/__tests__/$HOOK_TEST_NAME"
  echo "✓ 创建 src/hooks/__tests__/$HOOK_TEST_NAME"
else
  echo "✗ src/hooks/__tests__/$HOOK_TEST_NAME 已存在"
fi

# 创建文档文件
if [ ! -f "docs/hooks/$HOOK_DOC_NAME" ]; then
  sed "s/{{HookName}}/$HOOK_NAME/g; s/{{HookDescription}}/$HOOK_DESCRIPTION/g" \
    templates/hook-doc-template.md > "docs/hooks/$HOOK_DOC_NAME"
  echo "✓ 创建 docs/hooks/$HOOK_DOC_NAME"
else
  echo "✗ docs/hooks/$HOOK_DOC_NAME 已存在"
fi

# 更新 index.ts
if ! grep -q "use${HOOK_NAME}" src/index.ts; then
  # 在最后一个 export 之前添加新的 export
  sed -i '' "\$i\\
export * from './hooks/$HOOK_FILE_NAME'
" src/index.ts
  echo "✓ 更新 src/index.ts"
else
  echo "✗ src/index.ts 中已存在 use${HOOK_NAME}"
fi

# 更新文档配置
if ! grep -q "use${HOOK_NAME}" docs/.vitepress/config.ts; then
  # 在 hooks 数组的最后一个 item 之前添加
  sed -i '' "/text: 'useLocalStorage'/a\\
            { text: 'use${HOOK_NAME}', link: '/hooks/use${HOOK_NAME}' }
" docs/.vitepress/config.ts
  echo "✓ 更新 docs/.vitepress/config.ts"
else
  echo "✗ docs/.vitepress/config.ts 中已存在 use${HOOK_NAME}"
fi

echo ""
echo "完成! 接下来:"
echo "1. 编辑 src/hooks/$HOOK_FILE_NAME 实现功能"
echo "2. 编辑 src/hooks/__tests__/$HOOK_TEST_NAME 添加测试"
echo "3. 编辑 docs/hooks/$HOOK_DOC_NAME 完善文档"
echo "4. 运行 pnpm test 测试"
echo "5. 运行 pnpm build 构建"

