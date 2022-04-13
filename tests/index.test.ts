import { it, describe, vi, expect } from 'vitest'
import { dInject, InjectionKey, dProvide, createDIScope, getCurrentScope } from "../src";

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
  const storeB = dInject(IServiceB);
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
      
      dProvide(IServiceA, createServiceA);
      dProvide(IServiceB, createServiceB);

      const serviceA = dInject(IServiceA);
      expect(serviceA.hello()).toEqual("storebstorea");

      const scope = getCurrentScope()!;

      setTimeout(() => {
        scope.run(() => {
          const serviceB = dInject(IServiceB);
          expect(serviceB.hello()).toEqual("storeb");
        });
      }, 1000);
    }

    const mainDI = createDIScope();
    mainDI.run(main);
    vi.runAllTimers();
  });
});
