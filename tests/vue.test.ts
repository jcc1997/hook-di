import { it, describe, vi, expect } from 'vitest'
import VueDi, { InjectionKey, useDiInject, useDiProvide } from "../src/vue";
import { createApp } from 'vue';

interface IServiceA {
  a: string;
  hello: () => string;
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
        console.log('here');
        expect(serviceA.hello()).toEqual("storebstorea");
      }
    });
    app.use(VueDi);
    app.mount(document.createElement('div'));
    app.unmount();
  });
});
