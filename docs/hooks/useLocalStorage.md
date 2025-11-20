# useLocalStorage

响应式 localStorage hook，自动同步到 localStorage。

## 基本用法

<LocalStorageDemo />

### 代码示例

```vue
<script setup lang="ts">
import { useLocalStorage } from 'my-hooks'

const name = useLocalStorage('name', 'Vue')
</script>

<template>
  <div>
    <input v-model="name" placeholder="Enter name" />
    <p>Stored name: {{ name }}</p>
  </div>
</template>
```

## API

### 参数

```ts
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): Ref<T>
```

#### key

- **类型**: `string`
- **说明**: localStorage 的键名

#### initialValue

- **类型**: `T`
- **说明**: 初始值，如果 localStorage 中没有该键，则使用此值

#### options

```ts
interface UseLocalStorageOptions<T> {
  serializer?: {
    read: (value: string) => T
    write: (value: T) => string
  }
  onError?: (error: Error) => void
}
```

### 返回值

- **类型**: `Ref<T>`
- **说明**: 响应式的值，修改会自动同步到 localStorage

## 示例

### 存储对象

```vue
<script setup lang="ts">
import { useLocalStorage } from 'my-hooks'

const user = useLocalStorage('user', {
  name: 'Vue',
  age: 3
})
</script>
```

### 自定义序列化器

```vue
<script setup lang="ts">
import { useLocalStorage } from 'my-hooks'

const date = useLocalStorage('date', new Date(), {
  serializer: {
    read: (v) => new Date(v),
    write: (v) => v.toISOString()
  }
})
</script>
```

### 错误处理

```vue
<script setup lang="ts">
import { useLocalStorage } from 'my-hooks'

const data = useLocalStorage('data', 'default', {
  onError: (error) => {
    console.error('LocalStorage error:', error)
    // 处理错误，比如显示提示
  }
})
</script>
```

