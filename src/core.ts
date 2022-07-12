interface IInjectionKey<T> extends Symbol {}
export type InjectionKey<T> = symbol & IInjectionKey<T>;

type ServiceContextMap = {
  init(): void;
  value?: {
    set<T>(key: InjectionKey<T>, context: ServiceContext<T>): void;
    get<T>(key: InjectionKey<T>): ServiceContext<T> | undefined;
  };
};

type RootServiceContextMap = Required<Pick<ServiceContextMap, 'value'>>;

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

function _createDIScope(ctx: DIContext) {
  function run<T extends (...args: any) => any = (...args: any) => any>(
    fn: T
  ): ReturnType<T> {
    if (currentRootDIContext && currentRootDIContext !== ctx) throw new Error("hook-di: di conflicts");
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
    register<T>({ key, ctor }: Injectable<T>) {
      return run(() => provide(key, ctor));
    }
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

export function getCurrentScope(): DIScope | undefined {
  if (currentRootDIContext) {
    return _createDIScope(currentRootDIContext);
  }
  return undefined;
}

export type DIScope = ReturnType<typeof createDIScope>;

export type Injectable<T> = {
  key: InjectionKey<T>;
  ctor: () => T;
}

export function defineInjectable<T>(key: InjectionKey<T>, ctor: () => T): Injectable<T> {
  return {
    key,
    ctor,
  }
}
