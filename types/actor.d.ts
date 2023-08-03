export interface IActor<User> {
    user: User | null;
}
export declare abstract class BaseActor<User> implements IActor<User> {
    user: User | null;
    constructor(user?: User | null);
}
export declare class Nobody extends BaseActor<null> {
}
export declare const isNobody: (actor: any) => actor is Nobody;
//# sourceMappingURL=actor.d.ts.map