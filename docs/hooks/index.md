# Hooks

仅保留 toAwaitFetch 相关内容。

## [toAwaitFetch](/hooks/toAwaitFetch)

强大的 HTTP 请求工具，支持链式调用与解构双模式，内置错误处理、重试、超时与全局/单次配置。

特性速览：
- 双模式：链式 & 解构 `[data, error, success]`
- 完整错误处理：HTTP / 业务 / 网络（支持 suppressError）
- 重试与超时：可配置次数、间隔与自定义重试条件
- 多种请求/响应类型：JSON、FormData、Blob
- 全局配置：baseURL、headers、校验/转换、重试、超时

```typescript
import createInstance from 'my-vue-hooks/hooks/toAwaitFetch/toAwaitFetch'

const fetchInstance = createInstance()

// 解构使用
const [data, error, success] = await fetchInstance.sendGet('/api/users')

// 链式调用
await fetchInstance.sendGet('/api/users')
  .then((data) => console.log(data))
  .catchHttp((error) => console.error(error))
```

