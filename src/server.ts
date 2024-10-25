import { AsyncLocalStorage } from 'node:async_hooks'
import { type InjectionKey, type Scope, ScopeBase } from './scope'

const scopeAsyncLocalStorage = new AsyncLocalStorage<Scope>()

export function useShared<T>(
  key: string | symbol | InjectionKey<T>,
  { scope }: { scope?: Scope } = {},
) {
  scope = scope || getCurrentScope()

  const shared = scope.shared[key] || (scope.shared[key] = scope.hooks[key]())
  return shared
}

export function use<T>(
  key: string | symbol | InjectionKey<T>,
  { scope }: { scope?: Scope } = {},
) {
  scope = scope || getCurrentScope()
  return scope.hooks[key]()
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
