import { AsyncLocalStorage } from 'node:async_hooks'
import { type Scope, ScopeBase } from './scope'

const scopeAsyncLocalStorage = new AsyncLocalStorage<Scope>()

export const use: typeof import('./default').use = (key, { scope } = {}) => {
  scope = scope || getCurrentScope()
  return scope.use(key)
}

export const useShared: typeof import('./default').useShared = (
  key,
  { scope } = {},
) => {
  scope = scope || getCurrentScope()
  return scope.useShared(key)
}

export const lazy: typeof import('./default').lazy = {
  use: (key, { scope } = {}) => {
    scope = scope || getCurrentScope()
    return scope.lazy.use(key)
  },
  useShared: (key, { scope } = {}) => {
    scope = scope || getCurrentScope()
    return scope.lazy.useShared(key)
  },
}

export function getCurrentScope(): Scope {
  const scope = scopeAsyncLocalStorage.getStore()

  if (!scope) {
    throw new Error('No current scope')
  }
  return scope
}

class ScopeServerImpl extends ScopeBase implements Scope {
  run<R>(fn: () => R): R {
    return scopeAsyncLocalStorage.run(this, fn)
  }
}

export function createScope() {
  const scope = new ScopeServerImpl()
  const parent = scopeAsyncLocalStorage.getStore()
  if (parent) {
    scope.parent = parent
  }
  return scope
}
