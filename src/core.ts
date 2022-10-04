interface IInjectionKey<T> extends Symbol {}
export type InjectionKey<T> = symbol & IInjectionKey<T>;

type ServiceContextMap = {
  init(): void;
  value?: {
    set<T>(key: InjectionKey<T>, context: ServiceContext<T>): void;
    get<T>(key: InjectionKey<T>): ServiceContext<T> | undefined;
  };
};

type RootServiceContextMap = Required<Pick<ServiceContextMap, "value">>;

type ServiceContext<T> = [
  provider: () => T,
  injection: T | undefined,
  map: ServiceContextMap
];

type DIContext = {
  callStack: Function[];
  contextMapStack: (ServiceContextMap | undefined)[];
  rootContextMap: RootServiceContextMap;
};

type Provider<T> = {
  (): T;
  __di_symbol__: InjectionKey<T>;
};

let currentRootDIContext: DIContext | undefined;

export type Provision = {
  specify<T>(key: InjectionKey<T>, provider: () => T): Provision;
};

export function provide<T>(key: InjectionKey<T>, ctorHook: () => T): Provision {
  if (!currentRootDIContext) throw new Error("hook-di: must use in di scope");
  const { rootContextMap } = currentRootDIContext;
  const provider = ctorHook as Provider<T>;
  if (provider.__di_symbol__ && provider.__di_symbol__ !== key) {
    throw new Error(
      `hook-di: this function has been provided ${provider.__di_symbol__.toString()} once.`
    );
  }
  provider.__di_symbol__ = key;
  function _newContextMap(): ServiceContextMap {
    return {
      init() {
        this.value = new Map();
      },
      value: undefined,
    };
  }
  const serviceContextMap = _newContextMap();
  rootContextMap.value!.set(key, [provider, undefined, serviceContextMap]);
  // prevent inject before provide specified.
  let isTooLate = false;
  Promise.resolve().then(() => {
    isTooLate = true;
  });
  function _newProvision(parentMap: ServiceContextMap): Provision {
    return {
      specify<T>(key: InjectionKey<T>, ctorHook: () => T) {
        if (isTooLate) throw new Error("specify too late");
        const s_provider = ctorHook as Provider<T>;
        const s_map = _newContextMap();
        if (!parentMap.value) parentMap.init();
        parentMap.value!.set(key, [s_provider, undefined, s_map]);
        return _newProvision(s_map);
      },
    };
  }
  return _newProvision(serviceContextMap);
}

export function register<T>({ key, ctor }: Implement<T>) {
  return provide(key, ctor);
}

function _endOfArray<T>(arr: T[]) {
  return arr[arr.length - 1];
}

function _getKey(v: any) {
  return v.__di_symbol__ as symbol;
}

export function inject<T>(key: InjectionKey<T>): T {
  if (!currentRootDIContext) throw new Error("hook-di: must use in di scope");
  const { rootContextMap, callStack, contextMapStack } = currentRootDIContext;
  const hasParent = callStack.length > 0;
  const parentContextMap = hasParent ? _endOfArray(contextMapStack) : undefined;
  const currentContextFromParent = parentContextMap?.value?.get(key);
  const currentContextFromRoot = rootContextMap.value.get(key);
  const currentContext = currentContextFromParent || currentContextFromRoot;
  if (!currentContext) {
    throw new Error(
      "hook-di: did not provide " +
        key.toString() +
        " service hook in this di scope"
    );
  }
  const provider = currentContext[0];
  let injection = currentContext[1];
  const contextMap = currentContext[2];
  if (!injection) {
    if (callStack.includes(provider))
      throw new Error(
        `hook-di: CircularDependencyFound, creating ${_getKey(
          provider
        ).toString()} in ` +
          callStack.map((v) => _getKey(v).toString()).join(" -> ")
      );
    callStack.push(provider);
    contextMapStack.push(contextMap);
    injection = provider();
    currentContext[1] = injection;
    callStack.pop();
    contextMapStack.pop();
  }
  return injection;
}

export function injectNew<T>(key: InjectionKey<T>): T {
  if (!currentRootDIContext) throw new Error("hook-di: must use in di scope");
  const { rootContextMap, callStack, contextMapStack } = currentRootDIContext;
  const hasParent = callStack.length > 0;
  const parentContextMap = hasParent ? _endOfArray(contextMapStack) : undefined;
  const currentContextFromParent = parentContextMap?.value?.get(key);
  const currentContextFromRoot = rootContextMap.value.get(key);
  const currentContext = currentContextFromParent || currentContextFromRoot;
  if (!currentContext) {
    throw new Error(
      "hook-di: did not provide " +
        key.toString() +
        " service hook in this di scope"
    );
  }
  const provider = currentContext[0];
  if (callStack.includes(provider))
    throw new Error(
      `hook-di: CircularDependencyFound, creating ${_getKey(
        provider
      ).toString()} in ` +
        callStack.map((v) => _getKey(v).toString()).join(" -> ")
    );
  callStack.push(provider);
  contextMapStack.push(currentContext[2]);
  const injection = provider();
  callStack.pop();
  contextMapStack.pop();
  return injection;
}

export function lazyInject<T>(key: InjectionKey<T>): () => T {
  const currentScope = getCurrentScope();
  if (!currentScope) throw new Error("hook-di: must use in di scope");
  return () => currentScope.inject<T>(key);
}

function _createDIScope(ctx: DIContext) {
  function run<T extends (...args: any) => any = (...args: any) => any>(
    fn: T
  ): ReturnType<T> {
    if (currentRootDIContext && currentRootDIContext !== ctx)
      throw new Error("hook-di: di conflicts");
    if (currentRootDIContext === ctx) return fn();

    currentRootDIContext = ctx;
    try {
      return fn();
    } finally {
      currentRootDIContext = undefined;
    }
  }
  return {
    run,
    provide<T>(key: InjectionKey<T>, ctor: () => T) {
      return run(() => provide(key, ctor));
    },
    inject<T>(key: InjectionKey<T>): T {
      return run(() => inject(key));
    },
    injectNew<T>(key: InjectionKey<T>): T {
      return run(() => injectNew(key));
    },
    register<T>({ key, ctor }: Implement<T>) {
      return run(() => provide(key, ctor));
    },
  };
}

export function createDIScope() {
  const ctx: DIContext = {
    rootContextMap: {
      value: new Map(),
    },
    callStack: [],
    contextMapStack: [],
  };
  return _createDIScope(ctx);
}

export function getContextKey<T = unknown>(): InjectionKey<T> | undefined {
  if (currentRootDIContext && currentRootDIContext.callStack.length > 0) {
    return _getKey(_endOfArray(currentRootDIContext.callStack));
  }
  return undefined;
}

export function getCurrentScope(): DIScope | undefined {
  if (currentRootDIContext) {
    return _createDIScope(currentRootDIContext);
  }
  return undefined;
}

export type DIScope = ReturnType<typeof createDIScope>;

export type Implement<T> = {
  key: InjectionKey<T>;
  ctor: () => T;
};

export type InjectionType<K extends InjectionKey<any>> = K extends InjectionKey<infer Type> ? Type : never;
export function impl<K extends InjectionKey<any>>(
  key: K,
  ctor: (ctx: { aop: AOPType<InjectionType<K>> }) => InjectionType<K>
): Implement<InjectionType<K>> {
  const _aspects: Record<string, Aspect<any>[]> = {};
  return {
    key,
    ctor: function () {
      const inst = ctor({
        aop: aop(key, _aspects),
      });
      Object.keys(_aspects).forEach((_prop) => {
        const prop = _prop as keyof InjectionType<K>;
        if (!inst[prop])
          throw new Error(`${String(prop)} not in ${String(key)}`);
        // do aspect
        inst[prop] = _pipeAspect(prop, ..._aspects[_prop])(inst[prop]);
      });
      return inst;
    },
  };
}

export function declareInterface<T>(key: string): InjectionKey<T> {
  return Symbol(key);
}

/** aop */
export type Aspect<T extends (...args: any[]) => any> = (
  next: T,
  context: { prop: string | number | symbol },
  ...args: Parameters<T>
) => ReturnType<T>;

export type AOPType<T> = <Prop extends keyof T>(
  prop: Prop,
  aspect: T[Prop] extends (...args: any[]) => any ? Aspect<T[Prop]> : never
) => void;

export function aop<K extends InjectionKey<any>>(
  _key: K,
  aspects: Record<string, Aspect<any>[]>
): AOPType<InjectionType<K>> {
  return function (prop, aspect) {
    aspects = aspects || {};
    aspects[prop as string] = aspects[prop as string] || [];
    aspects[prop as string].push(aspect);
  };
}

function _pipeAspect<T extends (...args: any[]) => any>(
  prop: string | number | symbol,
  ...aspects: Aspect<T>[]
): (originFn: T) => T {
  return (fn) => {
    function dispatch(i: number): T {
      if (i === aspects.length) {
        return ((...args: Parameters<T>) => fn(...args)) as T;
      } else {
        const aspect = aspects[i];
        return ((...args: Parameters<T>) =>
          aspect(dispatch(i + 1), { prop }, ...args)) as T;
      }
    }
    return dispatch(0);
  };
}
