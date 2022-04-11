export interface InjectionKey<T> extends Symbol {}

type DIScopeCtx = {
  ctorMap: {
    set<T>(key: InjectionKey<T>, ctorHook: () => T): void;
    get<T>(key: InjectionKey<T>): () => T;
  };
  instMap: {
    set<T>(key: InjectionKey<T>, inst: T): void;
    get<T>(key: InjectionKey<T>): T;
  };
  locks: InjectionKey<any>[];
};
let currentScopeCtx: DIScopeCtx | undefined;

export function diProvide<T>(key: InjectionKey<T>, ctorHook: () => T) {
  if (!currentScopeCtx) throw new Error("hook-di: must use in di scope");
  currentScopeCtx.ctorMap.set(key, ctorHook);
}
export function diInject<T>(key: InjectionKey<T>): T {
  if (!currentScopeCtx) throw new Error("hook-di: must use in di scope");
  let service = currentScopeCtx.instMap.get(key);
  if (!service) {
    const hook = currentScopeCtx.ctorMap.get(key);
    if (!hook) {
      throw new Error(
        "hook-di: did not provide " + key.toString() + " service hook in this di scope"
      );
    }
    // forbid circular dependency
    if (currentScopeCtx.locks.includes(key))
      throw new Error("hook-di: CircularDependencyFound:" + currentScopeCtx.locks.map(v => v.toString()).join(' -> '));

    currentScopeCtx.locks.push(key);
    service = hook();
    currentScopeCtx.locks.pop();
    currentScopeCtx.instMap.set(key, service);
  }
  return service;
}

export function diInjectNew<T>(key: InjectionKey<T>): T {
  if (!currentScopeCtx) throw new Error("hook-di: must use in di scope");
  const hook = currentScopeCtx.ctorMap.get(key);
  if (!hook) {
    throw new Error(
      "hook-di: did not provide " + key.toString() + " service hook in this di scope"
    );
  }
  if (currentScopeCtx.locks.includes(key))
    throw new Error("hook-di: recursively create " + key.toString());

  currentScopeCtx.locks.push(key);
  const service = hook();
  currentScopeCtx.locks.pop();
  return service;
}

function _createDIScope(ctx: DIScopeCtx) {
  return {
    run<T extends (...args: any) => any = (...args: any) => any>(fn: T): ReturnType<T> {
      if (currentScopeCtx) throw new Error("hook-di: di conflicts");
      currentScopeCtx = ctx;
      try {
        return fn();
      } finally {
        currentScopeCtx = undefined;
      }
    },
  };
}

export function createDIScope() {
  const ctx: DIScopeCtx = {
    ctorMap: new Map(),
    instMap: new Map(),
    locks: [],
  };
  return _createDIScope(ctx);
}

export function getCurrentScope(): DIScope | undefined {
  if (currentScopeCtx) {
    return _createDIScope(currentScopeCtx);
  }
  return undefined;
}

export type DIScope = ReturnType<typeof createDIScope>;
