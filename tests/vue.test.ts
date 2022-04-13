import { it, describe, vi, expect } from 'vitest'
import { InjectionKey, useDInject, useDProvide, createDIScope, useDIScope, useDInjectNew } from "../src/vue";
import { createApp } from 'vue';
import { dInject } from '../src/core';

interface IServiceA {
  a: string;
  hello(): string;
}

interface IServiceB {
  b: string;
  hello(): string;
}

interface IServiceC {
  c: string;
  hello(): string;
}

const IServiceA: InjectionKey<IServiceA> = Symbol("store a");
const IServiceB: InjectionKey<IServiceB> = Symbol("store b");
const IServiceC: InjectionKey<IServiceC> = Symbol("store c");


function createServiceA() {
  const storeB = useDInject(IServiceB);
  return {
    a: "storea",
    hello() {
      return storeB.hello() + "storea";
    },
  };
}

function createServiceB() {
  return {
    b: "storeb",
    hello() {
      return "storeb";
    },
  };
}

function createServiceC() {
  const storeA = dInject(IServiceA);
  const storeB = dInject(IServiceB);
  return {
    a: "storec",
    hello() {
      return storeA.hello() + storeB.hello() + "storec";
    },
  };
}

describe("vue di tests", () => {
  vi.useFakeTimers();
  
  it("should work", () => {
    const app = createApp({
      setup() {
        useDProvide(IServiceA, createServiceA);
        useDProvide(IServiceB, createServiceB);

        const serviceA = useDInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useDIScope().inject(IServiceB);
        expect(serviceB.hello()).toEqual("storeb");
      }
    });
    app.use(createDIScope());
    app.mount(document.createElement('div'));
    app.unmount();
  });

  it("should work outside", () => {
    const app = createApp({
      setup() {
        const serviceA = useDInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useDInject(IServiceB);
        expect(serviceB.hello()).toEqual("storeb");
      }
    });
    app.use(createDIScope(), () => {
      useDProvide(IServiceA, createServiceA);
      useDProvide(IServiceB, createServiceB);

      const serviceA = useDInject(IServiceA);
      expect(serviceA.hello()).toEqual("storebstorea");
    });
    app.mount(document.createElement('div'));
    app.unmount();
  });

  it("should work separated", () => {
    const app = createApp({
      setup() {
        const serviceA = useDInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useDInject(IServiceB);
        expect(serviceB.hello()).toEqual("storeb");
      }
    });
    const scope = createDIScope();
    app.use(scope);
    scope.provide(IServiceA, createServiceA);
    scope.provide(IServiceB, createServiceB);
    app.mount(document.createElement('div'));
    app.unmount();
  });

  it("should work using core.ts", () => {
    const app = createApp({
      setup() {
        const serviceC = useDInject(IServiceC);
        expect(serviceC.hello()).toEqual("storebstoreastorebstorec");
      }
    });
    const scope = createDIScope();
    app.use(scope);
    scope.provide(IServiceA, createServiceA);
    scope.provide(IServiceB, createServiceB);
    scope.provide(IServiceC, createServiceC);
    app.mount(document.createElement('div'));
    app.unmount();
  });

  it("should not equal", () => {
    const app = createApp({
      setup() {
        const serviceC = useDInject(IServiceC);
        const serviceC2 = useDInjectNew(IServiceC);
        expect(serviceC !== serviceC2).toBeTruthy();
      }
    });
    const scope = createDIScope();
    app.use(scope);
    scope.provide(IServiceA, createServiceA);
    scope.provide(IServiceB, createServiceB);
    scope.provide(IServiceC, createServiceC);
    app.mount(document.createElement('div'));
    app.unmount();
  });
});
