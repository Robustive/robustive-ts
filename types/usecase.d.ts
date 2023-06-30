import { Observable, Observer, Subscription } from "rxjs";
import { Actor, BaseActor } from "./actor";
export type Boundary = null;
export declare const boundary: Boundary;
export type Empty = {
    [key: string]: never;
};
export type ContextualValues = Record<string, object>;
export type Context<T extends ContextualValues> = {
    [K in keyof T]: T[K] extends Empty ? Record<"scene", K> : Record<"scene", K> & T[K];
}[keyof T];
declare class BaseContextFactory<T extends ContextualValues> {
    instantiate(scene: string, withValues: T[string]): Context<T>;
}
export type ContextFactory<T extends ContextualValues> = BaseContextFactory<T> & {
    [K in keyof T]: T[K] extends Empty ? () => Context<T> : (withValues: T[K]) => Context<T>;
};
export declare const ContextFactory: new <T extends ContextualValues>() => ContextFactory<T>;
export interface IUsecase<C extends Context<ContextualValues>> {
    context: C;
    next(): Observable<this> | Boundary;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T): Observable<C[]>;
    interactedBy<T extends Actor<T>>(actor: T, observer: Partial<Observer<[C, C[]]>>): Subscription;
}
export declare abstract class Usecase<C extends Context<ContextualValues>> implements IUsecase<C> {
    context: C;
    abstract next(): Observable<this> | Boundary;
    constructor(initialSceneContext: C);
    protected instantiate(nextSceneContext: C): this;
    just(nextSceneContext: C): Observable<this>;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T): Observable<C[]>;
    interactedBy<T extends Actor<T>>(actor: T, observer: Partial<Observer<[C, C[]]>>): Subscription;
}
export declare class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string);
}
export declare class AuthorizingIsNotDefinedForThisActor<C extends Context<ContextualValues>, T extends Usecase<C>, User, U extends BaseActor<User>> extends Error {
    constructor(usecase: T, actor: U);
}
export {};
//# sourceMappingURL=usecase.d.ts.map