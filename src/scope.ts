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
  lazy: {
    use: <T>(key: string | symbol | InjectionKey<T>) => () => T
    useShared: <T>(key: string | symbol | InjectionKey<T>) => () => T
  }

  run: (fn: () => any) => void | Promise<void>
}

export abstract class ScopeBase implements Scope {
  parent?: Scope | undefined
  hooks: Record<string | symbol, () => any> = {}
  shared: Record<string | symbol, any> = {}

  register<T>(key: string | symbol, hook: () => T) {
    this.hooks[key] = hook
  }

  nodes?: (string | symbol | InjectionKey<any>)[]

  use<T>(key: string | symbol | InjectionKey<T>): T {
    // eslint-disable-next-line ts/no-this-alias
    let scope: Scope | undefined = this
    while (scope) {
      if (key in scope.hooks) {
        return this.circle(key, () => scope!.hooks[key]())
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
        return this.circle(key, () => (scope!.shared[key] = scope!.hooks[key]()))
      }

      scope = scope.parent
    }

    throw new Error(`hook-di: no hook for ${key as string}`)
  }

  lazy = {
    use: <T>(key: string | symbol | InjectionKey<T>) => {
      let cache: T | undefined
      return () => cache ?? (cache = this.use(key))
    },
    useShared: <T>(key: string | symbol | InjectionKey<T>) => {
      let cache: T | undefined
      return () => cache ?? (cache = this.useShared(key))
    },
  }

  circle<T, R>(key: (string | symbol | InjectionKey<T>), fn: () => R): R {
    this.nodes = this.nodes || []
    // check circular dependency
    if (this.nodes.includes(key)) {
      const msg = `hook-di: circular dependency for ${key.toString()} ${this.nodes.map(k => k.toString()).join(' -> ')}`
      this.nodes = undefined
      throw new Error(msg)
    }
    else {
      this.nodes.push(key)
    }

    const result = fn()
    this.nodes = undefined

    return result
  }

  abstract run(fn: () => any): void | Promise<void>
}

export function defineHook<K extends InjectionKey<any>>(hook: () => K extends InjectionKey<infer T> ? T : never) {
  return hook
}
