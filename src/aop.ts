import type { AOPTarget, AOPType, Aspect } from './core'
import { getContextKey } from './core'

export function markTrackable<AOP extends AOPType<any>>(aop: AOP) {
    const currentKey = getContextKey()
    const keyDesc = currentKey?.toString()
    return {
        track<T extends (...args: any[]) => any = (...args: any[]) => any>(
            prop: keyof AOPTarget<AOP>,
            { param = false, result = false, time = false }: { param?: boolean; result?: boolean; time?: boolean } = {},
        ) {
            const tracker: Aspect<T> = function (next: T, { prop }, ...args: Parameters<T>) {
                const propName = prop.toString()
                if (param)
                    console.info(`${keyDesc}.${propName} <- [${args}]`)
                else console.info(`${keyDesc}.${propName}`)
                if (time)
                    console.time(`${keyDesc}.${propName}`)
                const ret = next(...args)
                if (ret instanceof Promise) {
                    return ret.then((res) => {
                        if (result)
                            console.info(`${keyDesc}.${propName} return ${res}`)
                        if (time)
                            console.timeEnd(`${keyDesc}.${propName}`)
                        return ret
                    })
                }
                else {
                    if (result)
                        console.info(`${keyDesc}.${propName} -> ${ret}`)
                    if (time)
                        console.timeEnd(`${keyDesc}.${propName}`)
                    return ret
                }
            }
            aop(prop, tracker)
        },
    }
}
