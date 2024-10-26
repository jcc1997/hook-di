# hook-di

Reconsidering `dependencies injection` in hook style programming.

Highly inspired by vue composition apis.

## usage

here is the `interface`s

```typescript
import { InjectionKey } from 'hook-di'

export interface MyService {
  hello: () => string
}
// InjectionKey
export const MyServiceKey: InjectionKey<MyService> = InjectionKey('my-service')

// use MyService hook
export function useMyService(): MyService {
  return {
    hello() {
      return `storea`
    },
  }
}
```

manually register dependencies and auto inject.

```typescript
import { createScope, use } from '../src'

const scope = createScope()
scope.register(MyServiceKey, useMyService)

scope.run(() => {
  const service = use(MyServiceKey)
  service.hello() // "storebstorea"
})
```
