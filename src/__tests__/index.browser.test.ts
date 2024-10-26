import { createScope, use, useShared } from 'hook-di'
import { describe, expect, it } from 'vitest'
import { AKey, useA, useA2, UseHelloKey, useHookUsingA } from './hooks'

describe('basic usage in node', () => {
  it('register and use in single scope', () => {
    const scope = createScope()

    scope.register(AKey, useA)

    scope.run(() => {
      const a = use(AKey)

      console.log(a.name())

      a.log('register and use in single scope')

      const newA = use(AKey)
      expect(a, 'a equal to newA').not.toEqual(newA)
    })
  })

  it('register and useShared in single scope', () => {
    const scope = createScope()

    scope.register(AKey, useA)

    scope.run(() => {
      const a = useShared(AKey)

      console.log(a.name())

      a.log('register and use in single scope')

      const aCopy = useShared(AKey)

      expect(a, 'a equal to aCopy').toEqual(aCopy)
    })
  })
})

describe('chain test', () => {
  it('register and useShared in scopes tree', () => {
    const scope = createScope()

    scope.register(AKey, useA)

    scope.run(() => {
      const a = useShared(AKey)

      console.log(a.name())
      a.log('register and use in single scope')

      const scopeChild = createScope()
      scopeChild.run(() => {
        const childA = useShared(AKey)

        expect(a).toEqual(childA)
      })
    })
  })

  it('register and useShared different in scopes tree', () => {
    const scope = createScope()

    scope.register(AKey, useA)

    scope.run(() => {
      const a = useShared(AKey)

      console.log(a.name())
      a.log('register and use in single scope')

      const scopeChild = createScope()
      scopeChild.register(AKey, useA2)
      scopeChild.run(() => {
        const childA = useShared(AKey)

        expect(a.name()).not.toEqual('useA2')
        expect(a).not.toEqual(childA)
      })
    })
  })
})

describe('scope dependencies', () => {
  it('use hook in hook', () => {
    const scope = createScope()

    scope.register(AKey, useA)
    scope.register(UseHelloKey, useHookUsingA)

    scope.run(() => {
      const hello = use(UseHelloKey)

      expect(hello.hello()).toBe('hello, useA')
    })
  })
})
