import { Observable, Observer, Subscription } from "rxjs";
import { Actor } from "./actor";
export type Boundary = null;
export declare const boundary: Boundary;
export type Empty = Record<string, never>;
type DeepReadonly<T> = T extends object ? {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
} : T;
export type ContextualValues = Record<string, object>;
export type Context<T extends ContextualValues> = {
    readonly [K in keyof T]: DeepReadonly<T[K] extends Empty ? Record<"scene", K> : Record<"scene", K> & T[K]>;
}[keyof T];
export type ContextFactory<T extends ContextualValues> = {
    [K in keyof T]: T[K] extends Empty ? () => Context<T> : (withValues: T[K]) => Context<T>;
};
export declare const ContextFactory: new <T extends ContextualValues>() => ContextFactory<T>;
export interface IUsecase<T extends ContextualValues> {
    context: Context<T>;
    next(): Observable<this> | Boundary;
    authorize<U extends Actor<U>>(actor: U): boolean;
    interactedBy<U extends Actor<U>>(actor: U): Observable<Context<T>[]>;
    interactedBy<U extends Actor<U>>(actor: U, observer: Partial<Observer<[Context<T>, Context<T>[]]>>): Subscription;
}
export declare abstract class Usecase<T extends ContextualValues> implements IUsecase<T> {
    context: Context<T>;
    abstract next(): Observable<this> | Boundary;
    constructor(initialSceneContext: Context<T>);
    protected instantiate(nextSceneContext: Context<T>): this;
    just(nextSceneContext: Context<T>): Observable<this>;
    authorize<U extends Actor<U>>(actor: U): boolean;
    interactedBy<U extends Actor<U>>(actor: U): Observable<Context<T>[]>;
    interactedBy<U extends Actor<U>>(actor: U, observer: Partial<Observer<[Context<T>, Context<T>[]]>>): Subscription;
}
export declare class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string);
}
export declare class AuthorizingIsNotDefinedForThisActor<T extends ContextualValues, S extends Usecase<T>, U extends Actor<U>> extends Error {
    constructor(usecase: S, actor: U);
}
export {};
//# sourceMappingURL=usecase.d.ts.map