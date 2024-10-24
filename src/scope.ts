interface _InjectionKey<_T> {}
export type InjectionKey<T> = _InjectionKey<T> & symbol
// eslint-disable-next-line ts/no-redeclare
export const InjectionKey = <T = unknown>(key: string) => Symbol(key) as InjectionKey<T>

export interface Scope {
  parent?: Scope
  hooks: Record<string | symbol, () => any>
  shared: Record<string | symbol, any>

  register: <T>(key: string | symbol, hook: () => T) => any
  use: <T>(key: string | symbol | InjectionKey<T>) => T
  useShared: <T>(key: string | symbol | InjectionKey<T>) => T

  run: (fn: () => any) => void | Promise<void>
}

export abstract class ScopeBase implements Scope {
  parent?: Scope | undefined
  hooks: Record<string | symbol, () => any> = {}
  shared: Record<string | symbol, any> = {}

  register<T>(key: string | symbol, hook: () => T) {
    this.hooks[key] = hook
  }

  use<T>(key: string | symbol | InjectionKey<T>): T {
    // eslint-disable-next-line ts/no-this-alias
    let scope: Scope | undefined = this
    while (scope) {
      if (key in scope.hooks) {
        return scope.hooks[key]()
      }
      scope = scope.parent
    }

    throw new Error(`hook-di: no hook for ${key as string}`)
  }

  useShared<T>(key: string | symbol | InjectionKey<T>): T {
    // eslint-disable-next-line ts/no-this-alias
    let scope: Scope | undefined = this
    while (scope) {
      if (key in scope.shared) {
        return scope.shared[key]
      }

      if (key in scope.hooks) {
        return (scope.shared[key] = scope.hooks[key]())
      }

      scope = scope.parent
    }

    throw new Error(`hook-di: no hook for ${key as string}`)
  }

  abstract run(fn: () => any): void | Promise<void>
}
