export interface IActor<User> {
    user: User | null;
}
export declare type UserType<T> = T extends {
    user: infer U;
} ? U : never;
export declare abstract class BaseActor<User> implements IActor<User> {
    user: User | null;
    constructor(user?: User | null);
}
export declare class Nobody extends BaseActor<null> {
}
export declare const isNobody: (actor: any) => actor is Nobody;
export declare type Actor<T> = BaseActor<UserType<T>>;
//# sourceMappingURL=actor.d.ts.map