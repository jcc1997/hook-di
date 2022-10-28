import { inject, InjectionKey } from "../src/core";
import { injectRef } from '../src/vue';

export interface IServiceA {
  a: string;
  hello(): string;
}

export interface IServiceB {
  b: string;
  hello(): string;
}

export interface IServiceC {
  c: string;
  hello(): string;
  storeA?: IServiceA,
  storeB?: IServiceB,
}

export const IServiceA: InjectionKey<IServiceA> = Symbol("store a");
export const IServiceB: InjectionKey<IServiceB> = Symbol("store b");
export const IServiceC: InjectionKey<IServiceC> = Symbol("store c");

export function createServiceA() {
  const storeB = inject(IServiceB);
  return {
    a: "storea",
    hello() {
      return storeB.hello() + "storea";
    },
  };
}

export function createServiceB() {
  return {
    b: "storeb",
    hello() {
      return "storeb";
    },
  };
}

export function createServiceC(): IServiceC {
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
}

export function createServiceA2() {
  console.log("storea2");
  const storeB = inject(IServiceB);
  return {
    a: "storea2",
    hello() {
      return storeB.hello() + "storea2";
    },
  };
}

export function createServiceB2() {
  console.log("storeb2");
  return {
    b: "storeb2",
    hello() {
      return "storeb2";
    },
  };
}

export function recursiveServiceA() {
  const storeB = injectRef(IServiceB);
  return {
    a: "storea",
    hello() {
      console.log('delay2', storeB.value);
      return storeB.value?.hello() + "storea";
    },
  };
}

export function recursiveServiceB() {
  const storeA = inject(IServiceA);
  return {
    b: "storeb",
    hello() {
      return "storeb";
    },
  };
}
