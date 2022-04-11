# hook-di

one of the results cause by reconsidering design pattern in hook style programming.

highly inspired by vue composition apis.

## usage

here is the `interface`s

```typescript
interface IServiceA {
  a: string;
  hello(): string;
}

interface IServiceB {
  b: string;
  hello(): string;
}
```

to turn typescript interfaces to a real JS object, use type `InjectionKey` and `Symbol`.

```typescript
import type { InjectionKey } from "hook-di"; // completely equal to { InjectionKey } from 'vue'
const IServiceA: InjectionKey<IServiceA> = Symbol("store a");
const IServiceB: InjectionKey<IServiceB> = Symbol("store b");
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
  const storeB = diInject(IServiceB);
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
import { diInject, diProvide, createDIScope, getCurrentScope } from "../src";

function main() {
      
    diProvide(IServiceA, createServiceA);
    diProvide(IServiceB, createServiceB);

    const serviceA = diInject(IServiceA);
    serviceA.hello(); // "storebstorea"

    // if want to pass the scope, use getCurrentScope
    const scope = getCurrentScope()!;
    setTimeout(() => {
        scope.run(() => {
            const serviceB = diInject(IServiceB);
            serviceB.hello(); // "storeb"
        });
    }, 1000);
}
// use scope to create isolated contexts
createDIScope().run(main);
```

## use in `vue`

```typescript
import { createDIScope, useDiInject, useDiProvide } from "hook-di/vue";

const app = createApp({
    setup() {
        useDiProvide(IServiceA, createServiceA);
        useDiProvide(IServiceB, createServiceB);

        const serviceA = useDiInject(IServiceA);
        const serviceB = useDiInject(IServiceB);
    }
});
app.use(createDIScope());
app.mount("#app");
```

or

```typescript
import HookDi, { useDiInject, useDiProvide } from "hook-di/vue";

const app = createApp({
    setup() {
        const serviceA = useDiInject(IServiceA);
        const serviceB = useDiInject(IServiceB);
    }
});
// isolated context created in here
app.use(createDIScope(), () => {
    useDiProvide(IServiceA, createServiceA);
    useDiProvide(IServiceB, createServiceB);
});
app.mount("#app");
```
