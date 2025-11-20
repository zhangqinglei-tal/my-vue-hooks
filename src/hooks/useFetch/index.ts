// 导出基于 Axios 的实现
export {
  useAxiosFetch,
  useAxiosGet,
  useAxiosPost,
  useGetPromise,
  usePostPromise,
  setDefaultFetchOptions as setDefaultAxiosFetchOptions,
  getDefaultFetchOptions as getDefaultAxiosFetchOptions,
  resetDefaultFetchOptions as resetDefaultAxiosFetchOptions,
} from './axiosFetch'

// 导出基于原生 Fetch API 的实现
export {
  useFetch,
  useFetchGet,
  useFetchPost,
  useFetchGetPromise,
  useFetchPostPromise,
  setDefaultFetchOptions as setDefaultFetchOptions,
  getDefaultFetchOptions as getDefaultFetchOptions,
  resetDefaultFetchOptions as resetDefaultFetchOptions,
} from './fetch'

// 导出工具函数
export {
  toValue,
  deepMerge,
  createDefaultOptionsManager,
  getRetryDelay,
  mergeUrlParams,
  isTimeoutError,
  isNetworkError,
  isServerError,
  shouldRetry,
  type ErrorInfo,
} from './fetchUtils'

// 导出类型定义
export type {
  UseAxiosFetchOptions,
  UseAxiosFetchReturn,
  UseFetchReturn,
  DefaultFetchOptions,
  FetchResponse,
  BeforeFetch,
  AfterFetch,
  OnFetchError,
  BeforeFetchContext,
  BeforeFetchResult,
  AfterFetchContext,
  AfterFetchResult,
  AfterFetchReturn,
  OnFetchErrorContext,
  OnFetchErrorResultContext,
  OnFetchErrorResult,
} from './fetch.types'

