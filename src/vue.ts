import type { Scope } from './scope'
import { getCurrentScope as _getCurrentScope, createScope } from '#interfaces'
import { type App, getCurrentInstance, inject, type Plugin } from 'vue'

const sym = Symbol('hook-di:global-scope')

export default {
  install(app) {
    const globalScope = (app.config.globalProperties.__hook_di_globalScope
      = createScope())
    app.provide(sym, globalScope)
  },
} as Plugin

export function getCurrentScope(app?: App<any>): Scope {
  let scope = _getCurrentScope()
  scope = scope ?? inject(sym)
  scope
    = scope
    ?? (app || getCurrentInstance()?.appContext)?.config.globalProperties.__hook_di_globalScope
  if (!scope) {
    throw new Error('hook-di: No global scope found')
  }

  return scope
}

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
