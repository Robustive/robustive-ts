import { Empty } from "./usecase";

type CaseWithAssociatedValues = Record<string, object>

type SwiftEnumCase<T extends CaseWithAssociatedValues, K extends keyof T, U > = U & (T[K] extends Empty ? { readonly case: K } : { readonly case: K } & T[K])

export type SwiftEnumCases<T extends CaseWithAssociatedValues, U = Empty> = {
    readonly [K in keyof T]: SwiftEnumCase<T, K, U>
}[keyof T]

export type SwiftEnum<T extends CaseWithAssociatedValues, U> = {
    [K in keyof T]: T[K] extends Empty
        ? () => SwiftEnumCase<T, K, U>
        : (associatedValues: T[K]) => SwiftEnumCase<T, K, U>
}

export const SwiftEnum = class SwiftEnum<U extends object> {
    constructor(f?: new () => U) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return typeof prop === "string" && !(prop in target)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? (associatedValues?: any) =>
                        f !== undefined
                            ? Object.freeze(Object.assign(new f(), Object.assign(associatedValues || {}, { case: prop })))
                            : Object.freeze(Object.assign(associatedValues || {}, { case: prop }))
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <T extends CaseWithAssociatedValues, U = Empty>(
    f?: new () => U
) => SwiftEnum<T, U>;
