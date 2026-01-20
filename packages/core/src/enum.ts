import { Empty } from "./usecase";

type CaseWithAssociatedValues = Record<string, object>

type KeyFactory<T extends CaseWithAssociatedValues> = {
    [K in keyof T]: K
}

const KeyFactory = class KeyFactory {
    constructor() {
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = scene
                return ((typeof prop === "string") && !(prop in target))
                    ? prop
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <T extends CaseWithAssociatedValues>() => KeyFactory<T>;
  

type SwiftEnumCase<T extends CaseWithAssociatedValues, K extends keyof T, U > = U & (T[K] extends Empty ? { readonly case: K } : { readonly case: K } & T[K])

export type SwiftEnumCases<T extends CaseWithAssociatedValues, U = Empty> = {
    readonly [K in keyof T]: SwiftEnumCase<T, K, U>
}[keyof T]

export type SwiftEnum<T extends CaseWithAssociatedValues, U> = {
    [K in keyof T]: T[K] extends Empty
        ? () => SwiftEnumCase<T, K, U>
        : (associatedValues: T[K]) => SwiftEnumCase<T, K, U>
} & { keys: KeyFactory<T> }

export const SwiftEnum = class SwiftEnum<T extends CaseWithAssociatedValues, U extends Object> {
    keys: KeyFactory<T>;
    constructor(f?: new () => U) {
        this.keys = new KeyFactory<T>();
        return new Proxy(this, {
            get(target, prop, receiver) {
                return typeof prop === "string" && !(prop in target)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? (associatedValues?: any) =>
                        f !== undefined
                            /**
                             * note: There’s room for discussion on whether to restrict associatedValues 
                             * to an Object and use `{ ...associatedValues }`, or to allow class instances 
                             * by using `associatedValues || {}`.
                             * The former eliminates the risk of mutating the original reference, 
                             * but at the cost of losing the flexibility to pass in instances.
                             */
                            ? Object.freeze(Object.assign(new f(), Object.assign(associatedValues || {}, { case: prop })))
                            : Object.freeze(Object.assign(associatedValues || {}, { case: prop }))
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <T extends CaseWithAssociatedValues, U = Empty>(
    f?: new () => U
) => SwiftEnum<T, U>;
