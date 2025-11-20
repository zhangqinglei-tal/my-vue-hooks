/**
 * 版本信息
 * 在构建时由 Vite 注入
 */
export const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0'

/**
 * 获取当前 SDK 版本号
 * @returns 版本号字符串
 */
export function getVersion(): string {
  return VERSION
}

