import { describe, expect, it, vi } from "vitest";
import { trackable } from "../src/aop";
import {
  createDIScope,
  declareInterface,
  impl,
  inject,
  register,
} from "../src/core";

export interface IService {
  a: string;
  hello(): string;
  hello2(): string;
}
export const IService = declareInterface<IService>("IService");

describe("aop tests", () => {
  vi.useFakeTimers();

  it("should work", () => {
    const ServiceAImpl = impl(IService, function ({ aop }) {
      const { track } = trackable();
      aop("hello", track("hello", { param: true, result: true, time: true }));

      const inst = {
        a: "storea",
        hello() {
          return "hello";
        },
        hello2() {
          return "hello2" + this.hello();
        },
      };

      return inst;
    });

    function main() {
      register(ServiceAImpl);
      const service = inject(IService);
      expect(service.hello2()).toEqual("hello2hello");
    }

    const mainDI = createDIScope();
    mainDI.run(main);
    vi.runAllTimers();
  });
});
