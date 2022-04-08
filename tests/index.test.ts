import { it, describe, vi, expect } from 'vitest'
import { diInject, InjectionKey, diProvide, createDIScope, getCurrentScope } from "../src";

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
  const storeB = diInject(IServiceB);
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

describe("di tests", () => {
  vi.useFakeTimers();

  it("should work", () => {
    function main() {
      
      diProvide(IServiceA, createServiceA);
      diProvide(IServiceB, createServiceB);

      const serviceA = diInject(IServiceA);
      expect(serviceA.hello()).toEqual("storebstorea");

      const scope = getCurrentScope()!;

      setTimeout(() => {
        scope.run(() => {
          const serviceB = diInject(IServiceB);
          expect(serviceB.hello()).toEqual("storeb");
        });
      });
    }

    const mainDI = createDIScope();
    mainDI.run(main);
    vi.runAllTimers();
  });
});
