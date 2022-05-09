export interface IActor<User> {
    user: User | null;
}
export declare type UserType<Actor> = Actor extends {
    user: infer T;
} ? T : never;
export declare abstract class BaseActor<User> implements IActor<User> {
    user: User | null;
    constructor(user?: User | null);
}
export declare class Anyone extends BaseActor<null> {
}
export declare const isAnyone: (actor: any) => actor is Anyone;
export declare type Actor<T> = BaseActor<UserType<T>>;
//# sourceMappingURL=actor.d.ts.map