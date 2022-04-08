import { DIScope, createDIScope, InjectionKey, diInject, diInjectNew, diProvide, getCurrentScope } from './core';
import { getCurrentInstance, Plugin } from 'vue'
export type { InjectionKey } from './core'

function _getCtx(): DIScope | undefined {
  return getCurrentInstance()?.appContext.config.globalProperties.$hook_di_ctx;
}

const install: Plugin = function(app, fn) {
  const scope = createDIScope();
  app.config.globalProperties.$hook_di_ctx = scope;
  if (fn) {
    if (typeof fn !== 'function') throw new Error('hook-di: option muse be function');
    scope.run(fn);
  }
}

function _runInScope<T extends (...args: any) => any = (...args: any) => any>(fn: T): ReturnType<T> {
  const scope = getCurrentScope();
  if (!scope) {
    const ctx = _getCtx();
    if (!ctx) throw new Error('hook-di: no di context');
    return ctx.run(fn);
  } else {
    return fn();
  }
}

export function useDiProvide<T>(key: InjectionKey<T>, ctorHook: () => T) {
  _runInScope(() => {
    diProvide(key, ctorHook);
  });
}

export function useDiInject<T>(key: InjectionKey<T>) {
  return _runInScope(() => {
    return diInject(key);
  });
}

export function useDiInjectNew<T>(key: InjectionKey<T>) {
  return _runInScope(() => {
    return diInjectNew(key);
  });
}

export default install;
