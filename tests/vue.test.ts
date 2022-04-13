import { it, describe, vi, expect } from 'vitest'
import { InjectionKey, useDiInject, useDiProvide, createDIScope } from "../src/vue";
import { createApp } from 'vue';

interface IServiceA {
  a: string;
  hello(): string;
}

interface IServiceB {
  b: string;
  hello(): string;
}

const IServiceA: InjectionKey<IServiceA> = Symbol("store a");
const IServiceB: InjectionKey<IServiceB> = Symbol("store b");


function createServiceA() {
  const storeB = useDiInject(IServiceB);
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

describe("vue di tests", () => {
  vi.useFakeTimers();
  
  it("should work", () => {
    const app = createApp({
      setup() {
        useDiProvide(IServiceA, createServiceA);
        useDiProvide(IServiceB, createServiceB);

        const serviceA = useDiInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useDiInject(IServiceB);
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
        const serviceA = useDiInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useDiInject(IServiceB);
        expect(serviceB.hello()).toEqual("storeb");
      }
    });
    app.use(createDIScope(), () => {
      useDiProvide(IServiceA, createServiceA);
      useDiProvide(IServiceB, createServiceB);

      const serviceA = useDiInject(IServiceA);
      expect(serviceA.hello()).toEqual("storebstorea");
    });
    app.mount(document.createElement('div'));
    app.unmount();
  });

  it("should work separated", () => {
    const app = createApp({
      setup() {
        const serviceA = useDiInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useDiInject(IServiceB);
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
});
