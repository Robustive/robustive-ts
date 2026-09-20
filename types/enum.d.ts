import { Empty } from "./usecase";
type AssociatedValues = object;
type CaseWithAssociatedValues = {
    [key: string]: AssociatedValues;
};
type KeyFactory<T extends CaseWithAssociatedValues> = {
    [K in keyof T]: K;
};
declare const KeyFactory: new <T extends CaseWithAssociatedValues>() => KeyFactory<T>;
type Utils = Record<string, (...args: any[]) => any>;
type SwiftEnumCase<T extends CaseWithAssociatedValues, K extends keyof T, U extends Utils = Empty> = U & (T[K] extends Empty ? {
    readonly case: K;
} : {
    readonly case: K;
} & T[K]);
export type SwiftEnumCaseUnion<T extends CaseWithAssociatedValues> = SwiftEnumCase<T, keyof T>;
export type SwiftEnumCases<T extends CaseWithAssociatedValues, U extends Utils = Empty> = {
    readonly [K in keyof T]: SwiftEnumCase<T, K, U>;
}[keyof T];
export type SwiftEnum<T extends CaseWithAssociatedValues, U extends Utils = Empty> = U & {
    [K in keyof T]: T[K] extends Empty ? () => SwiftEnumCase<T, K, U> : (associatedValues: T[K]) => SwiftEnumCase<T, K, U>;
} & {
    keys: KeyFactory<T>;
};
export declare const SwiftEnum: new <T extends CaseWithAssociatedValues, U extends Utils = Empty>(f?: ((swiftEnumCase: SwiftEnumCaseUnion<T>) => U) | undefined) => SwiftEnum<T, U>;
export {};
//# sourceMappingURL=enum.d.ts.map