import { Observable } from "rxjs";
import { Actor, BaseActor } from "./actor";
export declare type Boundary = null;
export declare const boundary: Boundary;
export declare type Empty = {};
export declare type UsecaseScenario<T extends Record<keyof any, Empty>> = {
    [K in keyof T]: Record<"scene", K> & T[K];
}[keyof T];
export interface IUsecase<Context> {
    context: Context;
    next(): Observable<this> | Boundary;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T, from: Context | null): Observable<Context[]>;
}
export declare abstract class Usecase<Context> implements IUsecase<Context> {
    context: Context;
    abstract next(): Observable<this> | Boundary;
    constructor(initialSceneContext: Context);
    protected instantiate(nextSceneContext: Context): this;
    just(nextSceneContext: Context): Observable<this>;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T, from?: Context | null): Observable<Context[]>;
}
export declare class UserNotAuthorizedToInteractIn extends Error {
    constructor(message: string);
}
export declare class AuthorizingIsNotDefinedForThisActor<Context, T extends Usecase<Context>, User, U extends BaseActor<User>> extends Error {
    constructor(usecase: T, actor: U);
}
//# sourceMappingURL=usecase.d.ts.map