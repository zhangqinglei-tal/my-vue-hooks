# use{{HookName}}

{{HookDescription}}

## 基本用法

\`\`\`vue
<script setup lang="ts">
import { use{{HookName}} } from 'my-hooks'

const { value } = use{{HookName}}('param')
</script>

<template>
  <div>
    <p>Value: {{ value }}</p>
  </div>
</template>
\`\`\`

## API

### 参数

\`\`\`ts
function use{{HookName}}(
  param: string,
  options?: Use{{HookName}}Options
): Use{{HookName}}Return
\`\`\`

#### param

- **类型**: `string`
- **说明**: 参数说明

#### options

- **类型**: `Use{{HookName}}Options`
- **默认值**: `{}`
- **说明**: 配置选项

\`\`\`ts
interface Use{{HookName}}Options {
  // 选项定义
}
\`\`\`

### 返回值

\`\`\`ts
interface Use{{HookName}}Return {
  value: Ref<number>  // 返回值说明
}
\`\`\`

## 示例

### 示例 1

\`\`\`vue
<script setup lang="ts">
import { use{{HookName}} } from 'my-hooks'

// 示例代码
</script>
\`\`\`

## 相关

- [其他相关 Hook](/hooks/other)

