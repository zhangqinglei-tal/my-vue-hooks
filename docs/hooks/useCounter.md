# useCounter

响应式计数器 hook，提供增加、减少、设置和重置功能。

## 基本用法

<CounterDemo />

### 代码示例

```vue
<script setup lang="ts">
import { useCounter } from 'my-hooks'

const { count, inc, dec, set, reset } = useCounter(0)
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="inc()">+1</button>
    <button @click="inc(5)">+5</button>
    <button @click="dec()">-1</button>
    <button @click="dec(5)">-5</button>
    <button @click="set(100)">Set to 100</button>
    <button @click="reset()">Reset</button>
  </div>
</template>
```

## API

### 参数

```ts
function useCounter(
  initialValue?: number,
  options?: UseCounterOptions
): UseCounterReturn
```

#### initialValue

- **类型**: `number`
- **默认值**: `0`
- **说明**: 计数器的初始值

#### options

- **类型**: `UseCounterOptions`

```ts
interface UseCounterOptions {
  min?: number      // 最小值，默认 -Infinity
  max?: number      // 最大值，默认 Infinity
  initial?: number  // 初始值（会覆盖 initialValue）
}
```

### 返回值

```ts
interface UseCounterReturn {
  count: Ref<number>  // 当前计数值
  inc: (delta?: number) => void  // 增加，默认 +1
  dec: (delta?: number) => void  // 减少，默认 -1
  set: (value: number) => void   // 设置值
  reset: () => void               // 重置到初始值
}
```

## 示例

### 带范围限制的计数器

```vue
<script setup lang="ts">
import { useCounter } from 'my-hooks'

const { count, inc, dec } = useCounter(0, {
  min: 0,
  max: 10
})
</script>
```

### 自定义初始值

```vue
<script setup lang="ts">
import { useCounter } from 'my-hooks'

const { count, reset } = useCounter(10, {
  initial: 5  // 实际初始值为 5
})
</script>
```

