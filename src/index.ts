// // 导出所有 hooks
// export * from './hooks/useCounter'
// export * from './hooks/useToggle'
// export * from './hooks/useLocalStorage'

// // 导出 useTable
// export * from './hooks/useTable'

// // 导出 useFetch
// export * from './hooks/useFetch'

export * from './hooks/toAwaitFetch/toAwaitFetch.api'
export {
  default as toAwaitFetch,
  sendGet,
  sendPost,
  sendPostForm,
  sendPostBlob,
  sendGetBlob,
  setGlobalConfig,
  cancel,
  createInstance,
  FetchInstanceImpl,
} from './hooks/toAwaitFetch/toAwaitFetch'

// 导出版本信息
export { VERSION, getVersion } from './version'

