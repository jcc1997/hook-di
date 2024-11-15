import { type InjectionKey, type Scope, ScopeBase } from './scope'

export { defineHook } from './scope'
export type { InjectionKey, Scope } from './scope'

export const scopes: { current?: Scope } = {}

export function use<T = unknown>(
  key: string | symbol | InjectionKey<T>,
  { scope }: { scope?: Scope } = {},
) {
  scope = scope || getCurrentScope()
  return scope.use(key)
}

export function useShared<T = unknown>(
  key: string | symbol | InjectionKey<T>,
  { scope }: { scope?: Scope } = {},
) {
  scope = scope || getCurrentScope()

  return scope.useShared(key)
}

export const lazy = {
  use: <T = unknown>(key: string | symbol | InjectionKey<T>, { scope }: { scope?: Scope } = {}) => {
    scope = scope || getCurrentScope()
    return scope.lazy.use(key)
  },
  useShared: <T = unknown>(key: string | symbol | InjectionKey<T>, { scope }: { scope?: Scope } = {}) => {
    scope = scope || getCurrentScope()
    return scope.lazy.useShared(key)
  },
}

export function getCurrentScope(): Scope {
  const scope = scopes.current

  if (!scope) {
    throw new Error('No current scope')
  }
  return scope
}

class ScopeDefaultImpl extends ScopeBase implements Scope {
  run(fn: () => any) {
    scopes.current = this
    try {
      fn()
    }
    finally {
      scopes.current = this.parent
    }
  }
}

export function createScope() {
  const scope = new ScopeDefaultImpl()
  if (scopes.current) {
    scope.parent = scopes.current
  }
  return scope
}
