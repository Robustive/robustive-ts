import { Observable, Observer, Subscription } from "rxjs";
import { Actor, BaseActor } from "./actor";
export declare type Boundary = null;
export declare const boundary: Boundary;
export declare type Empty = {};
export declare type ContextualizedScenes<T extends Record<keyof any, object>> = {
    [K in keyof T]: Record<"scene", K> & T[K];
}[keyof T];
export interface IContext {
    scene: string;
}
export interface IUsecase<Context extends IContext> {
    context: Context;
    next(): Observable<this> | Boundary;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T): Observable<Context[]>;
    interactedBy<T extends Actor<T>>(actor: T, observer: Partial<Observer<[Context, Context[]]>>): Subscription;
}
export declare abstract class Usecase<Context extends IContext> implements IUsecase<Context> {
    context: Context;
    abstract next(): Observable<this> | Boundary;
    constructor(initialSceneContext: Context);
    protected instantiate(nextSceneContext: Context): this;
    just(nextSceneContext: Context): Observable<this>;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T): Observable<Context[]>;
    interactedBy<T extends Actor<T>>(actor: T, observer: Partial<Observer<[Context, Context[]]>>): Subscription;
}
export declare class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string);
}
export declare class AuthorizingIsNotDefinedForThisActor<C extends IContext, T extends Usecase<C>, User, U extends BaseActor<User>> extends Error {
    constructor(usecase: T, actor: U);
}
//# sourceMappingURL=usecase.d.ts.map