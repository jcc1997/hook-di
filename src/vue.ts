import {
  DIScope,
  createDIScope as _createDIScope,
  InjectionKey,
  inject,
  injectNew,
  provide,
  getCurrentScope,
} from "./core";
import { getCurrentInstance } from "vue";
export type { InjectionKey } from "./core";

export function useDIScope(): DIScope | undefined {
  return getCurrentInstance()?.appContext.config.globalProperties.$hook_di_ctx;
}

function _runInScope<T extends (...args: any) => any = (...args: any) => any>(
  fn: T
): ReturnType<T> {
  const scope = getCurrentScope();
  if (!scope) {
    const ctx = useDIScope();
    if (!ctx) throw new Error("hook-di/vue: no di scope");
    return ctx.run(fn);
  } else {
    return fn();
  }
}

export function useProvide<T>(key: InjectionKey<T>, ctorHook: () => T) {
  return _runInScope(() => {
    return provide(key, ctorHook);
  });
}

export function useInject<T>(key: InjectionKey<T>) {
  return _runInScope(() => {
    return inject(key);
  });
}

export function useInjectNew<T>(key: InjectionKey<T>) {
  return _runInScope(() => {
    return injectNew(key);
  });
}

export function createDIScope(): DIScope & {
  install: (app: any, fn: (...args: any) => any) => void;
} {
  const scope = _createDIScope();
  const install = function (app: any, fn: (...args: any) => any) {
    app.config.globalProperties.$hook_di_ctx = scope;
    if (fn) {
      if (typeof fn !== "function")
        throw new Error("hook-di/vue: option muse be function");
      scope.run(fn);
    }
  };
  return {
    install,
    run: scope.run.bind(scope),
    provide: scope.provide.bind(scope),
    inject: scope.inject.bind(scope),
    injectNew: scope.injectNew.bind(scope),
  };
}
