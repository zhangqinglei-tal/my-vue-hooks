import { describe, it, expect } from 'vitest'
import { useToggle } from '../useToggle'

describe('useToggle', () => {
  it('should initialize with default value', () => {
    const { value } = useToggle()
    expect(value.value).toBe(false)
  })

  it('should toggle boolean', () => {
    const { value, toggle } = useToggle(false)
    toggle()
    expect(value.value).toBe(true)
    toggle()
    expect(value.value).toBe(false)
  })

  it('should toggle string values', () => {
    const { value, toggle } = useToggle('off', {
      truthyValue: 'on',
      falsyValue: 'off',
    })
    toggle()
    expect(value.value).toBe('on')
    toggle()
    expect(value.value).toBe('off')
  })

  it('should set true', () => {
    const { value, setTrue } = useToggle(false)
    setTrue()
    expect(value.value).toBe(true)
  })

  it('should set false', () => {
    const { value, setFalse } = useToggle(true)
    setFalse()
    expect(value.value).toBe(false)
  })

  it('should set custom value', () => {
    const { value, set } = useToggle<boolean>(false)
    set(true)
    expect(value.value).toBe(true)
  })
})

