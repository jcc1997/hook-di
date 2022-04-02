import { test } from "@jest/globals";
import { expect, describe, jest } from "@jest/globals";
import { injectDI, InjectionKey, provideDI, createDIScope, DI } from "../src";

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

describe("di tests", () => {
  jest.useFakeTimers();
  function createServiceA() {
    const storeB = injectDI(IServiceB);
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

  test("test", () => {
    function main(di: DI) {
      provideDI(IServiceA, createServiceA);
      provideDI(IServiceB, createServiceB);

      const serviceA = injectDI(IServiceA);
      expect(serviceA.hello()).toEqual("storebstorea");

      setTimeout(() => {
        di(() => {
          const serviceB = injectDI(IServiceB);
          expect(serviceB.hello()).toEqual("storeb");
        });
      });
      jest.runAllTimers();
    }

    const mainDI = createDIScope();
    mainDI(main);
  });
});
