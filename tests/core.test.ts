import { it, describe, vi, expect } from "vitest";
import {
  inject,
  provide,
  createDIScope,
  getCurrentScope,
  injectNew,
} from "../src/core";
import {
  createServiceA,
  createServiceA2,
  createServiceB,
  createServiceB2,
  createServiceC,
  IServiceA,
  IServiceB,
  IServiceC,
} from "./services";

describe("di tests", () => {
  vi.useFakeTimers();

  it("should work", () => {
    function main() {
      provide(IServiceA, createServiceA);
      provide(IServiceB, createServiceB);

      const serviceA = inject(IServiceA);
      expect(serviceA.hello()).toEqual("storebstorea");

      const scope = getCurrentScope()!;

      setTimeout(() => {
        scope.run(() => {
          const serviceB = inject(IServiceB);
          expect(serviceB.hello()).toEqual("storeb");
        });
      }, 1000);
    }

    const mainDI = createDIScope();
    mainDI.run(main);
    vi.runAllTimers();
  });

  it("should work specify", () => {
    function main() {
      provide(IServiceA, createServiceA);
      provide(IServiceB, createServiceB);
      const provision = provide(IServiceC, createServiceC);
      provision.specify(IServiceA, createServiceA2);
      provision.specify(IServiceB, createServiceB2);

      const serviceC = inject(IServiceC);
      expect(serviceC.hello()).toEqual("storebstorea2storeb2storec");
    }

    const mainDI = createDIScope();
    mainDI.run(main);
  });

  it("should work new", () => {
    function main() {
      provide(IServiceA, createServiceA);
      provide(IServiceB, createServiceB);
      const provision = provide(IServiceC, createServiceC);
      provision.specify(IServiceA, createServiceA2);
      provision.specify(IServiceB, createServiceB2);

      const serviceC = inject(IServiceC);
      const serviceA = inject(IServiceA);
      const serviceANew = injectNew(IServiceA);
      expect(serviceA).not.toEqual(serviceC.storeA);
      expect(serviceA).not.toEqual(serviceANew);
      expect(serviceC.hello()).toEqual("storebstorea2storeb2storec");
    }

    const mainDI = createDIScope();
    mainDI.run(main);
  });

  it("should work new", () => {
    function main() {
      provide(IServiceA, createServiceA);
      provide(IServiceB, createServiceB);
      const provision = provide(IServiceC, createServiceC);
      const subProvision = provision.specify(IServiceA, createServiceA2);
      provision.specify(IServiceB, createServiceB2);
      subProvision.specify(IServiceB, createServiceB2);

      const serviceC = inject(IServiceC);
      const serviceA = inject(IServiceA);
      const serviceANew = injectNew(IServiceA);
      expect(serviceA).not.toEqual(serviceC.storeA);
      expect(serviceA).not.toEqual(serviceANew);
      expect(serviceC.hello()).toEqual("storeb2storea2storeb2storec");
    }

    const mainDI = createDIScope();
    mainDI.run(main);
  });
});
