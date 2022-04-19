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
  const storeB = inject(IServiceB);
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
import { inject, provide, createDIScope, getCurrentScope } from "../src";

function provides() {  
    provide(IServiceA, createServiceA);
    provide(IServiceB, createServiceB);
}
// use scope to create isolated contexts
const scope = createDIScope();
scope.run(provides);
scope.run(() => {
  const serviceA = inject(IServiceA);
  serviceA.hello(); // "storebstorea"

  // if want to pass the scope, use getCurrentScope
  const currentScope = getCurrentScope()!;
  setTimeout(() => {
    currentScope.run(() => {
      const serviceB = inject(IServiceB);
      serviceB.hello(); // "storeb"
    });
  }, 1000);
})
```

specify dependencies

```typescript
provide(IServiceA, createServiceA);
provide(IServiceB, createServiceB);

const provision = provide(IServiceC, createServiceC);

// injection in createServiceC will be createServiceB2
provision.specify(IServiceB, createServiceB2);

// injection in createServiceC will be createServiceA2
const subProvision = provision.specify(IServiceA, createServiceA2);

// injection in createServiceC in createServiceA2 will be createServiceB2
// but ServiceB2 in createServiceC is not shared with ServiceB2 in createServiceA2
subProvision.specify(IServiceB, createServiceB2);
```

## use in `vue`

```typescript
import { createDIScope, useInject, useProvide } from "hook-di/vue";

const app = createApp({
    setup() {
        const serviceA = useInject(IServiceA);
        const serviceB = useInject(IServiceB);
    }
});
// isolated context created in here
app.use(createDIScope(), () => {
    useProvide(IServiceA, createServiceA);
    useProvide(IServiceB, createServiceB);
});
app.mount("#app");
```
