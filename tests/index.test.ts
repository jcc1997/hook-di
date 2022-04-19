import { it, describe, vi, expect } from "vitest";
import { inject, provide, createDIScope, getCurrentScope } from "../src";
import {
  createServiceA,
  createServiceB,
  IServiceA,
  IServiceB,
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
});
