# hook-di

Reconsidering `dependencies injection` in hook style programming.

Highly inspired by vue composition apis.

## usage

here is the `interface`s

```typescript
export interface IServiceA {
  a: string;
  hello(): string;
}

export interface IServiceB {
  b: string;
  hello(): string;
}
```

to turn typescript interfaces to a real JS object, use type `InjectionKey` and `Symbol`.

```typescript
import type { InjectionKey } from "hook-di"; // equal to { InjectionKey } from 'vue'
export const IServiceA: InjectionKey<IServiceA> = Symbol("store a");
export const IServiceB: InjectionKey<IServiceB> = Symbol("store b");
```

define implements to interfaces

```typescript
function createServiceB(): IServiceB {
  return {
    b: "storeb",
    hello() {
      return "storeb";
    },
  };
}

function createServiceA(): IServiceA {
  const storeB = dInject(IServiceB);
  return {
    a: "storea",
    hello() {
      return storeB.hello() + "storea";
    },
  };
}
```

manually provide dependencies and auto inject.

```typescript
import { dInject, dProvide, createDIScope, getCurrentScope } from "../src";

function provides() {  
    dProvide(IServiceA, createServiceA);
    dProvide(IServiceB, createServiceB);
}
// use scope to create isolated contexts
const scope = createDIScope();
scope.run(provides);
scope.run(() => {
  const serviceA = dInject(IServiceA);
  serviceA.hello(); // "storebstorea"

  // if want to pass the scope, use getCurrentScope
  const currentScope = getCurrentScope()!;
  setTimeout(() => {
    currentScope.run(() => {
      const serviceB = dInject(IServiceB);
      serviceB.hello(); // "storeb"
    });
  }, 1000);
})
```

## use in `vue`

```typescript
import HookDi, { useDInject, useDProvide } from "hook-di/vue";

const app = createApp({
    setup() {
        const serviceA = useDInject(IServiceA);
        const serviceB = useDInject(IServiceB);
    }
});
// isolated context created in here
app.use(createDIScope(), () => {
    useDProvide(IServiceA, createServiceA);
    useDProvide(IServiceB, createServiceB);
});
app.mount("#app");
```
