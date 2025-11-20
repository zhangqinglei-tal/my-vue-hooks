import { describe, it, expect } from 'vitest'
import { use{{HookName}} } from '../use{{HookName}}'

describe('use{{HookName}}', () => {
  it('should work', () => {
    const { value } = use{{HookName}}('test')
    expect(value.value).toBeDefined()
  })

  // TODO: 添加更多测试用例
})

