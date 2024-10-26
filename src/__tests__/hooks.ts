import { useShared } from '#interfaces'
import { InjectionKey } from '../scope'

export interface UseA {
  name: () => string
  log: (...params: any[]) => void
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
      console.log('useA: ', ...params)
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
      console.log('useA2: ', ...params)
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
