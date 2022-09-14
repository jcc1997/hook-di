import { declareInterface, impl, inject } from "../src/core";

export interface IServiceA {
  a: string;
  hello(): string;
}
export const IServiceA = declareInterface<IServiceA>("store a");

export interface IServiceB {
  b: string;
  hello(): string;
}
export const IServiceB = declareInterface<IServiceB>("store b");

export interface IServiceC {
  c: string;
  hello(): string;
  storeA?: IServiceA;
  storeB?: IServiceB;
}
export const IServiceC = declareInterface<IServiceC>("store c");

export const ServiceAImpl = impl(IServiceA, function () {
  const storeB = inject(IServiceB);
  return {
    a: "storea",
    hello() {
      return storeB.hello() + "storea";
    },
  };
});

export const ServiceBImpl = impl(IServiceB, function () {
  return {
    b: "storeb",
    hello() {
      return "storeb";
    },
  };
});

export const ServiceCImpl = impl(IServiceC, function () {
  console.log("storec");
  const storeA = inject(IServiceA);
  const storeB = inject(IServiceB);
  return {
    c: "storec",
    hello() {
      return storeA.hello() + storeB.hello() + "storec";
    },
    storeA,
    storeB,
  };
});
