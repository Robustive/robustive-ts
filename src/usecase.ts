import { Observable, Observer, of, Subscription, tap, throwError } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { Actor, BaseActor } from "./actor";

export type Boundary = null;
export const boundary: Boundary = null;

export type Empty = Record<string, never>;

type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type ContextualValues = Record<string, object>;

// Discriminated Union
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Context<T extends ContextualValues> = {
    readonly [K in keyof T]: DeepReadonly<T[K] extends Empty 
        ? Record<"scene", K>
        : Record<"scene", K> & T[K]>;
}[keyof T];
  
export type ContextFactory<T extends ContextualValues> = { 
    [K in keyof T]: T[K] extends Empty
        ? () => Context<T>
        : (withValues: T[K]) => Context<T>
};
  
export const ContextFactory = class ContextFactory<T extends ContextualValues> {
    constructor() {
        return new Proxy(
            this
            , {
                get(target, prop, receiver) {
                    return ((typeof prop === "string") && (prop as keyof T)) 
                        ? (withValues: T[string]) => Object.freeze({ "scene": prop, ...withValues })
                        : Reflect.get(target, prop, receiver);
                }
            }
        );
    }
} as new <T extends ContextualValues>() => ContextFactory<T>;
  
export interface IUsecase<T extends ContextualValues> {
    context: Context<T>;
    next(): Observable<this>|Boundary;
    authorize<U extends Actor<U>>(actor: U): boolean;
    interactedBy<U extends Actor<U>>(actor: U): Observable<Context<T>[]>
    interactedBy<U extends Actor<U>>(actor: U, observer: Partial<Observer<[Context<T>, Context<T>[]]>>): Subscription
}

export abstract class Usecase<T extends ContextualValues> implements IUsecase<T> {
    context: Context<T>;
    abstract next(): Observable<this>|Boundary;

    constructor(initialSceneContext: Context<T>) {
        this.context = initialSceneContext;
    }

    protected instantiate(nextSceneContext: Context<T>): this {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (this.constructor as any)(nextSceneContext);
    }

    just(nextSceneContext: Context<T>): Observable<this> {
        return of(this.instantiate(nextSceneContext));
    }

    authorize<U extends Actor<U>>(actor: U): boolean {
        throw new AuthorizingIsNotDefinedForThisActor<T, this, U>(this, actor);
    }

    interactedBy<U extends Actor<U>>(actor: U): Observable<Context<T>[]>
    interactedBy<U extends Actor<U>>(actor: U, observer: Partial<Observer<[Context<T>, Context<T>[]]>>): Subscription

    // overload
    interactedBy<U extends Actor<U>>(actor: U, observer?: Partial<Observer<[Context<T>, Context<T>[]]>> | null): Observable<Context<T>[]> | Subscription {
        if (observer) {
            let subscription: Subscription | null = null;
            subscription = this.interactedBy(actor)
                .subscribe({ 
                    next: (performedScenario: Context<T>[]) => {
                        const lastSceneContext = performedScenario.slice(-1)[0];
                        observer.next?.([lastSceneContext, performedScenario]);
                    }
                    , error: (err) => {
                        console.error(err);
                        observer.error?.(err);
                    }
                    , complete: () => { 
                        subscription?.unsubscribe();
                        observer.complete?.(); 
                    } 
                } as Partial<Observer<Context<T>[]>>);
            return subscription;

        } else {
            const startAt = new Date();

            const recursive = (scenario: this[]): Observable<this[]> => {
                const lastScene = scenario.slice(-1)[0];
                const observable = lastScene.next();
    
                if (!observable) { // exit criteria
                    return of(scenario);
                }
    
                return observable
                    .pipe(
                        mergeMap((nextSceneContext: this) => {
                            scenario.push(nextSceneContext);
                            return recursive(scenario);
                        })
                    );
            };
    
            if (!this.authorize(actor)) {
                const err = new ActorNotAuthorizedToInteractIn(actor.constructor.name, this.constructor.name);
                return throwError(() => err);
            }
            const scenario: this[] = [this];
    
            return recursive(scenario)
                .pipe(
                    map((scenes: this[]) => {
                        const performedScenario = scenes.map(scene => scene.context);
                        return performedScenario;
                    })
                    , tap(scenario => {
                        const elapsedTime = (new Date().getTime() - startAt.getTime());
                        console.info(`${ this.constructor.name } takes ${elapsedTime } ms.`, scenario);
                    })
                );
        }
    }
}

export class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string) {
        super(`The actor "${ actor }" is not authorized to interact in ${ usecase }`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AuthorizingIsNotDefinedForThisActor<T extends ContextualValues, S extends Usecase<T>, U extends Actor<U>> extends Error {
    constructor(usecase: S, actor: U) {
        super(`Authorizing ${ actor.constructor.name } to ${ usecase.constructor.name } is not defined. Please override authorize() at ${ usecase.constructor.name }.`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}