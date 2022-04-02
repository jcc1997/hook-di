export interface InjectionKey<T> extends Symbol {}

let hookMap:
  | {
      set<T>(key: InjectionKey<T>, ctorHook: () => T): void;
      get<T>(key: InjectionKey<T>): () => T;
    }
  | undefined;

let instanceMap:
  | {
      set<T>(key: InjectionKey<T>, inst: T): void;
      get<T>(key: InjectionKey<T>): T;
    }
  | undefined;

let locks: InjectionKey<any>[] | undefined;

export function provideDI<T>(key: InjectionKey<T>, ctorHook: () => T) {
  if (!hookMap) throw new Error("must use in runDIScope");
  hookMap.set(key, ctorHook);
}
export function injectDI<T>(key: InjectionKey<T>): T {
  if (!hookMap || !instanceMap || !locks) {
    throw new Error("must use in runDIScope");
  }
  let service = instanceMap.get(key);
  if (!service) {
    const hook = hookMap.get(key);
    if (!hook) {
      throw new Error(
        "did not provide " + key.toString() + " service hook in this di scope"
      );
    }
    if (locks.includes(key))
      throw new Error("recursively create " + key.toString());

    locks.push(key);
    service = hook();
    locks.pop();
    instanceMap.set(key, service);
  }
  return service;
}

export function createDIScope() {
  const instance = {
    hookMap: new Map(),
    instanceMap: new Map(),
    locks: [],
  };
  return function _di<T extends (di: typeof _di) => void>(fn: T) {
    hookMap = instance.hookMap;
    instanceMap = instance.instanceMap;
    locks = instance.locks;
    try {
      fn(_di);
    } finally {
      hookMap = undefined;
      instanceMap = undefined;
      locks = undefined;
    }
  };
}

export type DI = ReturnType<typeof createDIScope>;
