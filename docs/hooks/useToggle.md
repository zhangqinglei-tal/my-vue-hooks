# useToggle

切换布尔值或两个值之间的切换 hook。

## 基本用法

<ToggleDemo />

### 代码示例

```vue
<script setup lang="ts">
import { useToggle } from 'my-hooks'

const { value, toggle, setTrue, setFalse } = useToggle(false)
</script>

<template>
  <div>
    <p>Value: {{ value }}</p>
    <button @click="toggle()">Toggle</button>
    <button @click="setTrue()">Set True</button>
    <button @click="setFalse()">Set False</button>
  </div>
</template>
```

## API

### 参数

```ts
function useToggle<T extends ToggleValue = boolean>(
  initialValue?: T,
  options?: UseToggleOptions<T>
): UseToggleReturn<T>
```

#### initialValue

- **类型**: `boolean | string | number`
- **默认值**: `false`
- **说明**: 初始值

#### options

```ts
interface UseToggleOptions<T> {
  truthyValue?: T  // 真值，默认 true
  falsyValue?: T   // 假值，默认 false
}
```

### 返回值

```ts
interface UseToggleReturn<T> {
  value: Ref<T>
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
  set: (value: T) => void
}
```

## 示例

### 字符串切换

```vue
<script setup lang="ts">
import { useToggle } from 'my-hooks'

const { value, toggle } = useToggle('on', {
  truthyValue: 'on',
  falsyValue: 'off'
})
</script>
```

### 数字切换

```vue
<script setup lang="ts">
import { useToggle } from 'my-hooks'

const { value, toggle } = useToggle(0, {
  truthyValue: 1,
  falsyValue: 0
})
</script>
```

