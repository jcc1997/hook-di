import { it, describe, vi, expect } from "vitest";
import {
  useInject,
  useProvide,
  createDIScope,
  useDIScope,
  useInjectNew,
} from "../src/vue";
import { createApp } from "vue";
import {
  createServiceA,
  createServiceA2,
  createServiceB,
  createServiceB2,
  createServiceC,
  IServiceA,
  IServiceB,
  IServiceC,
  recursiveServiceA,
  recursiveServiceB,
} from "./services";

describe("vue di tests", () => {
  vi.useFakeTimers();

  it("should work", () => {
    const app = createApp({
      render() {},
      setup() {
        useProvide(IServiceA, createServiceA);
        useProvide(IServiceB, createServiceB);

        const serviceA = useInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useDIScope()?.inject(IServiceB);
        expect(serviceB?.hello()).toEqual("storeb");
      },
    });
    app.use(createDIScope());
    app.mount(document.createElement("div"));
    app.unmount();
  });

  it("should work outside", () => {
    const app = createApp({
      render() {},
      setup() {
        const serviceA = useInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useInject(IServiceB);
        expect(serviceB.hello()).toEqual("storeb");
      },
    });
    app.use(createDIScope(), () => {
      useProvide(IServiceA, createServiceA);
      useProvide(IServiceB, createServiceB);

      const serviceA = useInject(IServiceA);
      expect(serviceA.hello()).toEqual("storebstorea");
    });
    app.mount(document.createElement("div"));
    app.unmount();
  });

  it("should work separated", () => {
    const app = createApp({
      render() {},
      setup() {
        const serviceA = useInject(IServiceA);
        expect(serviceA.hello()).toEqual("storebstorea");

        const serviceB = useInject(IServiceB);
        expect(serviceB.hello()).toEqual("storeb");
      },
    });
    const scope = createDIScope();
    app.use(scope);
    scope.provide(IServiceA, createServiceA);
    scope.provide(IServiceB, createServiceB);
    app.mount(document.createElement("div"));
    app.unmount();
  });

  it("should work using core.ts", () => {
    const app = createApp({
      render() {},
      setup() {
        const serviceC = useInject(IServiceC);
        expect(serviceC.hello()).toEqual("storebstoreastorebstorec");
      },
    });
    const scope = createDIScope();
    app.use(scope);
    scope.provide(IServiceA, createServiceA);
    scope.provide(IServiceB, createServiceB);
    scope.provide(IServiceC, createServiceC);
    app.mount(document.createElement("div"));
    app.unmount();
  });

  it("should not equal", () => {
    const app = createApp({
      render() {},
      setup() {
        const serviceC = useInject(IServiceC);
        const serviceC2 = useInjectNew(IServiceC);
        expect(serviceC !== serviceC2).toBeTruthy();
      },
    });
    const scope = createDIScope();
    app.use(scope);
    scope.provide(IServiceA, createServiceA);
    scope.provide(IServiceB, createServiceB);
    scope.provide(IServiceC, createServiceC);
    app.mount(document.createElement("div"));
    app.unmount();
  });

  it("should work specify", () => {
    const app = createApp({
      render() {},
      setup() {
        const serviceC = useInject(IServiceC);
        const serviceA = useInject(IServiceA);
        const serviceANew = useInjectNew(IServiceA);
        expect(serviceA).not.toEqual(serviceC.storeA);
        expect(serviceA).not.toEqual(serviceANew);
        expect(serviceC.hello()).toEqual("storeb2storea2storeb2storec");
      },
    });
    const scope = createDIScope();
    app.use(scope);

    scope.provide(IServiceA, createServiceA);
    scope.provide(IServiceB, createServiceB);
    const provision = scope.provide(IServiceC, createServiceC);
    const subProvistion = provision.specify(IServiceA, createServiceA2);
    provision.specify(IServiceB, createServiceB2);
    subProvistion.specify(IServiceB, createServiceB2);

    app.mount(document.createElement("div"));
    app.unmount();
  });

  it("should work when using delay to recursive", async () => {
    let pms
    const app = createApp({
      render() {},
      async setup() {
        const serviceB = useInject(IServiceB);
        const serviceA = useInject(IServiceA);
        expect(serviceA.hello()).toEqual('undefinedstorea');
        expect(serviceB.hello()).toEqual('storeb');
        pms = Promise.resolve().then(() => serviceA.hello());
      },
    });
    const scope = createDIScope();
    app.use(scope);

    scope.provide(IServiceA, recursiveServiceA);
    scope.provide(IServiceB, recursiveServiceB);

    app.mount(document.createElement("div"));
    app.unmount();
    return expect(pms).resolves.toEqual('storebstorea')
  });
});
