import {
  DIScope,
  createDIScope as _createDIScope,
  InjectionKey,
  inject,
  injectNew,
  provide,
  getCurrentScope,
} from "./core";
import { ref, getCurrentInstance, Ref, effectScope } from "vue-demi";
export type { InjectionKey } from "./core";

export function useDIScope(): DIScope | undefined {
  return getCurrentInstance()?.appContext.config.globalProperties.$hook_di_ctx;
}

function _runInScope<T extends (...args: any) => any = (...args: any) => any>(
  fn: T
): ReturnType<T> {
  let scope = getCurrentScope();
  if (!scope) {
    scope = useDIScope();
  }
  if (!scope) throw new Error("hook-di/vue: no di scope");
  return scope.run(fn);
}

function _runInScopeAsync<
  T extends (...args: any) => any = (...args: any) => any
>(fn: T): Promise<ReturnType<T>> {
  let scope = getCurrentScope();
  if (!scope) {
    scope = useDIScope();
  }
  if (!scope) throw new Error("hook-di/vue: no di scope");
  return Promise.resolve().then(() => scope!.run(fn));
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

type InjectFn<T> = (key: InjectionKey<T>) => T;

function delay<T>(
  hook: InjectFn<T>
): (key: InjectionKey<T>) => Ref<T | undefined> {
  return (key: InjectionKey<T>) => {
    const val: Ref<T | undefined> = ref(undefined);
    _runInScopeAsync(() => {
      val.value = hook(key);
    });
    return val;
  };
}

export const injectRef = delay(inject);
export const injectRefNew = delay(injectNew);

export function createDIScope(): DIScope & {
  install: (app: any, fn: (...args: any) => any) => void;
  stop: () => void;
} {
  const scope = _createDIScope();
  const vueScope = effectScope();

  for (const k in scope) {
    const _k = k as keyof typeof scope;
    const origin = scope[_k];
    scope[_k] = (...args: any[]) => {
      return vueScope.run(() => (origin as any)(...args));
    };
  }

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
    register: scope.register.bind(scope),
    stop: vueScope.stop.bind(vueScope),
  };
}
