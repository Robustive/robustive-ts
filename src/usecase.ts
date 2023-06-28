import { Observable, Observer, of, Subscription, tap, throwError } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { Actor, BaseActor } from "./actor";

export type Boundary = null;
export const boundary: Boundary = null;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Empty = {};

type SCENE = keyof { "scene": string };
export type ContextualValues = Record<string, object>;

// 識別共有体型(Discriminated Union)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Context<T> = T extends ContextualValues ? {
    [K in keyof T]: (Record<SCENE, K> & T[K]);
}[keyof T] : never;

export interface IUsecase<C extends Context<ContextualValues>> {
    context: C;
    next(): Observable<this>|Boundary;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T): Observable<C[]>
    interactedBy<T extends Actor<T>>(actor: T, observer: Partial<Observer<[C, C[]]>>): Subscription
}

export abstract class Usecase<C extends Context<ContextualValues>> implements IUsecase<C> {
    context: C;
    abstract next(): Observable<this>|Boundary;

    constructor(initialSceneContext: C) {
        this.context = initialSceneContext;
    }

    protected instantiate(nextSceneContext: C): this {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (this.constructor as any)(nextSceneContext);
    }

    just(nextSceneContext: C): Observable<this> {
        return of(this.instantiate(nextSceneContext));
    }

    authorize<T extends Actor<T>>(actor: T): boolean {
        throw new AuthorizingIsNotDefinedForThisActor(this, actor);
    }


    interactedBy<T extends Actor<T>>(actor: T): Observable<C[]>
    interactedBy<T extends Actor<T>>(actor: T, observer: Partial<Observer<[C, C[]]>>): Subscription

    // overload
    interactedBy<T extends Actor<T>>(actor: T, observer?: Partial<Observer<[C, C[]]>> | null): Observable<C[]> | Subscription {
        if (observer) {
            let subscription: Subscription | null = null;
            subscription = this.interactedBy(actor)
                .subscribe({ 
                    next: (performedScenario: C[]) => {
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
                } as Partial<Observer<C[]>>);
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

export class AuthorizingIsNotDefinedForThisActor<C extends Context<ContextualValues>, T extends Usecase<C>, User, U extends BaseActor<User>> extends Error {
    constructor(usecase: T, actor: U) {
        super(`Authorizing ${ actor.constructor.name } to ${ usecase.constructor.name } is not defined. Please override authorize() at ${ usecase.constructor.name }.`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}