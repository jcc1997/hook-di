import { Aspect, getContextKey } from "./core";

// function _getKeyDesc(k?: symbol) {
//   return /Symbol\((.*)\)/g.exec(k?.toString() || "")?.[1];
// }

export function trackable<T extends (...args: any[]) => any>() {
  const currentKey = getContextKey();
  const keyDesc = currentKey?.toString();
  return {
    track(
      name: string,
      options: { param?: boolean; result?: boolean; time?: boolean } = {}
    ): Aspect<T> {
      const { param, result, time } = options;
      return function (next: T, ...args: Parameters<T>) {
        if (param) console.info(`${keyDesc}.${name} <- [${args}]`);
        else console.info(`${keyDesc}.${name}`);
        if (time) console.time(`${keyDesc}.${name}`);
        const ret = next(...args);
        if (ret instanceof Promise) {
          return ret.then((res) => {
            if (result) console.info(`${keyDesc}.${name} return ${res}`);
            if (time) console.timeEnd(`${keyDesc}.${name}`);
            return ret;
          });
        } else {
          if (result) console.info(`${keyDesc}.${name} -> ${ret}`);
          if (time) console.timeEnd(`${keyDesc}.${name}`);
          return ret;
        }
      };
    },
  };
}
