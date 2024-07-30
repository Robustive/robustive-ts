import { Empty } from "./usecase";
type CaseWithAssociatedValues = Record<string, object>;
type SwiftEnumCase<T extends CaseWithAssociatedValues, K extends keyof T, U> = U & (T[K] extends Empty ? {
    readonly case: K;
} : {
    readonly case: K;
} & T[K]);
export type SwiftEnumCases<T extends CaseWithAssociatedValues, U = Empty> = {
    readonly [K in keyof T]: SwiftEnumCase<T, K, U>;
}[keyof T];
export type SwiftEnum<T extends CaseWithAssociatedValues, U> = {
    [K in keyof T]: T[K] extends Empty ? () => SwiftEnumCase<T, K, U> : (associatedValues: T[K]) => SwiftEnumCase<T, K, U>;
};
export declare const SwiftEnum: new <T extends CaseWithAssociatedValues, U = Empty>(f?: (new () => U) | undefined) => SwiftEnum<T, U>;
export {};
//# sourceMappingURL=enum.d.ts.map