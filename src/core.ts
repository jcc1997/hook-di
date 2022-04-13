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
  stack: InjectionKey<any>[];
};
let currentScopeCtx: DIScopeCtx | undefined;

export function diProvide<T>(key: InjectionKey<T>, ctorHook: () => T) {
  if (!currentScopeCtx) throw new Error("hook-di: must use in di scope");
  currentScopeCtx.ctorMap.set(key, ctorHook);
}

export function diInject<T>(key: InjectionKey<T>): T {
  if (!currentScopeCtx) throw new Error("hook-di: must use in di scope");
  const { instMap, ctorMap, stack } = currentScopeCtx;
  let service = instMap.get(key);
  if (!service) {
    const hook = ctorMap.get(key);
    if (!hook) {
      throw new Error(
        "hook-di: did not provide " + key.toString() + " service hook in this di scope"
      );
    }
    // forbid circular dependency
    if (stack.includes(key))
      throw new Error("hook-di: CircularDependencyFound:" + stack.map(v => v.toString()).join(' -> '));

    stack.push(key);
    service = hook();
    stack.pop();
    instMap.set(key, service);
  }
  return service;
}

export function diInjectNew<T>(key: InjectionKey<T>): T {
  if (!currentScopeCtx) throw new Error("hook-di: must use in di scope");
  const { ctorMap, stack } = currentScopeCtx;
  const hook = ctorMap.get(key);
  if (!hook) {
    throw new Error(
      "hook-di: did not provide " + key.toString() + " service hook in this di scope"
    );
  }
  if (stack.includes(key))
    throw new Error("hook-di: recursively create " + key.toString());

  stack.push(key);
  const service = hook();
  stack.pop();
  return service;
}

function _createDIScope(ctx: DIScopeCtx) {
  function run<T extends (...args: any) => any = (...args: any) => any>(fn: T): ReturnType<T> {
    if (currentScopeCtx) throw new Error("hook-di: di conflicts");
    currentScopeCtx = ctx;
    try {
      return fn();
    } finally {
      currentScopeCtx = undefined;
    }
  };
  return {
    run,
    provide<T>(key: InjectionKey<T>, ctorHook: () => T) {
      run(() => diProvide(key, ctorHook));
    },
    inject<T>(key: InjectionKey<T>): T {
      return run(() => diInject(key));
    },
    injectNew<T>(key: InjectionKey<T>): T {
      return run(() => diInjectNew(key));
    },
  };
}

export function createDIScope() {
  const ctx: DIScopeCtx = {
    ctorMap: new Map(),
    instMap: new Map(),
    stack: [],
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
