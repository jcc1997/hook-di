import { lazy, useShared } from '#interfaces'
import { InjectionKey } from '../scope'

export interface UseA {
  name: () => string
  log: (...params: any[]) => string
}
export const AKey = InjectionKey<UseA>('UseA')

export interface UseHello {
  hello: () => string
}
export const UseHelloKey = InjectionKey<UseHello>('UseHello')

export const useA: () => UseA = function () {
  const name = 'useA'
  return {
    name() {
      return name
    },
    log(...params) {
      return `useA: ${params}`
    },
  }
}

export const useA2: () => UseA = function () {
  const name = 'useA2'
  return {
    name() {
      return name
    },
    log(...params) {
      return `useA2: ${params}`
    },
  }
}

export const useHookUsingA = function () {
  const a = useShared(AKey)

  return {
    hello() {
      return `hello, ${a.name()}`
    },
  }
}

export interface UseB {
  b: () => string
}
export const BKey = InjectionKey<UseB>('UseB')

export const useBdepA: () => UseB = function () {
  const a = useShared(AKey)

  return {
    b() {
      return `b-${a.name()}`
    },
  }
}

export const useAdepB: () => UseA = function () {
  const b = useShared(BKey)

  return {
    name() {
      return b.b()
    },
    log(...params) {
      return `useAdepB: ${params}`
    },
  }
}

export const useAdepBLazy: () => UseA = function () {
  const b = lazy.useShared(BKey)

  return {
    name() {
      return 'a'
    },
    log(..._params) {
      return `useAdepBLazy: ${b().b()}`
    },
  }
}
