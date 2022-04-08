import { DIScope, createDIScope, InjectionKey, diInject, diInjectNew, diProvide, getCurrentScope } from './core';
import { getCurrentInstance, Plugin } from 'vue'
export type { InjectionKey } from './core'

function _getCtx(): DIScope | undefined {
  return getCurrentInstance()?.appContext.config.globalProperties.$hook_di_ctx;
}

const install: Plugin = function(app) {
  app.config.globalProperties.$hook_di_ctx = createDIScope();
}

export function useDiProvide<T>(key: InjectionKey<T>, ctorHook: () => T) {
  const ctx = _getCtx();
  if (!ctx) throw new Error('no di context');
  ctx.run(() => {
    diProvide(key, ctorHook);
  });
}

export function useDiInject<T>(key: InjectionKey<T>) {
  const scope = getCurrentScope();
  if (!scope) {
    const ctx = _getCtx();
    if (!ctx) throw new Error('no di context');
    return ctx.run(() => {
      return diInject(key);
    });
  } else {
    return diInject(key);
  }
}

export function useDiInjectNew<T>(key: InjectionKey<T>) {
  const scope = getCurrentScope();
  if (!scope) {
    const ctx = _getCtx();
    if (!ctx) throw new Error('no di context');
    return ctx.run(() => {
      return diInjectNew(key);
    });
  } else {
    return diInjectNew(key);
  }
}

export default install;
