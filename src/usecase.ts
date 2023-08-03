import { Observable, Observer, of, Subscription, tap, throwError } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { IActor } from "./actor";

type DeepReadonly<T> = T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

type Mutable<T> = T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T;

type PreFlatten<Z> = {
    [C in keyof Z as C extends string 
        ? Z[C] extends Empty // for empty alternatives
            ? never
            : `${C}.${keyof Z[C] & string}`
        : C
    ] : Z[C];
};

type Flatten<Z> = {
    [CK in keyof PreFlatten<Z>] : CK extends `${infer C extends keyof Z & string}.${string}`
        ? CK extends `${string}.${infer K extends keyof Z[C] & string}`
            ? Z[C][K] 
            : never
        : never;
};

const courses = ["basics", "alternatives", "goals"] as const;
type Courses = typeof courses[number];
type Basics = Extract<Courses, "basics">;
type Alternatives = Extract<Courses, "alternatives">;
type Goals = Extract<Courses, "goals">;

type ContextualValues = Record<string, object>;
export type Empty = Record<string, never>;

export type Scenes = {
    basics: ContextualValues;
    alternatives: ContextualValues;
    goals: ContextualValues;
};

// Convert Scenes into Discriminated Union like { scene: "...", ... }
export type Context<Z extends Scenes> = {
    readonly [K in keyof Flatten<Z>]: K extends `${ infer C }.${ infer S }` 
        ? DeepReadonly<Flatten<Z>[K] extends Empty
            ? Record<"scene", S> & Record<"course", C>
            : Record<"scene", S> & Record<"course", C> & Flatten<Z>[K]>
        : never 
}[keyof Flatten<Z>];

export type MutableContext<Z extends Scenes> = Mutable<Context<Z>>;

export type Contexts<S, C extends Courses> = S extends IScenario<infer Z extends Scenes> ? { 
    [K in keyof Z[C]]: Z[C] extends Empty // for empty alternatives
        ? Empty
        : Z[C][K] extends Empty
            ? () => Context<Z>
            : (withValues: Z[C][K]) => Context<Z>
} : never;

export type ContextSelector<S> = S extends IScenario<infer Z extends Scenes> ? { 
    [C in keyof Z] : C extends Courses 
        ? Contexts<S, C> 
        : never;
} : never;

export const ContextSelector = class ContextSelector {
    constructor() {
        return new Proxy(this, {
            get(target, prop, receiver) {
                switch (prop) {
                case "basics":
                case "alternatives":
                case "goals": {
                    return new Proxy({}, {
                        get(target, prop_scene, receiver) {
                            return ((typeof prop_scene === "string") && !(prop_scene in target))
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ? (withValues: any) => {
                                    return Object.freeze({ "scene" : prop_scene, course: prop, ...withValues });
                                }
                                : Reflect.get(target, prop, receiver);
                        }
                    });
                }
                default: { return Reflect.get(target, prop, receiver); }
                }
            }
        });
    }
} as new <S>() => { basics : Contexts<S, Basics>, alternatives : Contexts<S, Alternatives>, goals : Contexts<S, Goals> };

export type UsecaseDefinition<Z extends Scenes, S extends IScenario<Z>> = { scenes: Z, scenario: S };
export type UsecaseDefinitions = Record<string, UsecaseDefinition<Scenes, IScenario<Scenes>>>;
type ScenarioConstructor<D extends UsecaseDefinitions, U extends keyof D> = new () => D[U]["scenario"];

export interface IScenario<Z extends Scenes> {
    authorize<D extends UsecaseDefinitions, User, A extends IActor<User>>(actor: A, usecase: keyof D): boolean;
    next(to: MutableContext<Z>): Observable<Context<Z>>;
    just(next: Context<Z>): Observable<Context<Z>>;
}

class Scene<D extends UsecaseDefinitions, U extends keyof D, Z extends Scenes, S extends IScenario<Z>> {
    #usecase: U;
    #context: Context<Z>;
    #scenario: S;
    
    constructor(usecase: U, context: Context<Z>, scenario: S) {
        this.#usecase = usecase;
        this.#context = context;
        this.#scenario = scenario;
    }

    interactedBy<User, A extends IActor<User>>(actor: A): Observable<Context<Z>[]>
    interactedBy<User, A extends IActor<User>>(actor: A, observer: Partial<Observer<[MutableContext<Z>, Context<Z>[]]>>): Subscription

    // overload
    interactedBy<User, A extends IActor<User>>(actor: A, observer?: Partial<Observer<[MutableContext<Z>, Context<Z>[]]>> | null): Observable<Context<Z>[]> | Subscription {
        if (observer) {
            let subscription: Subscription | null = null;
            subscription = this.interactedBy(actor)
                .subscribe({ 
                    next: (performedScenario: Context<Z>[]) => {
                        const lastSceneContext = performedScenario.slice(-1)[0] as MutableContext<Z>;
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
                } as Partial<Observer<Context<Z>[]>>);
            return subscription;

        } else {
            const startAt = new Date();
            const recursive = (scenario: Context<Z>[]): Observable<Context<Z>[]> => {
                const lastScene = scenario.slice(-1)[0];
                if (lastScene.course === "goals") { // exit criteria
                    return of(scenario);
                }

                const observable = this.#scenario.next(lastScene as MutableContext<Z>);
                return observable
                    .pipe(
                        mergeMap((nextScene) => {
                            scenario.push(nextScene);
                            return recursive(scenario);
                        })
                    );
            };
    
            if (!this.#scenario.authorize<D, User, A>(actor, this.#usecase)) {
                const err = new ActorNotAuthorizedToInteractIn(actor.constructor.name, this.#usecase as string);
                return throwError(() => err);
            }
            const scenario: Context<Z>[] = [this.#context];
    
            return recursive(scenario)
                .pipe(
                    tap((contexts: Context<Z>[]) => {
                        const elapsedTime = (new Date().getTime() - startAt.getTime());
                        console.info(`"${ this.#usecase as string }" takes ${ elapsedTime } ms.`, contexts);
                    })
                );
        }
    }
}

export type Usecase<D extends UsecaseDefinitions, U extends keyof D> = Record<"name", U> & Scene<D, U, D[U]["scenes"], D[U]["scenario"]>;
export type Usecases<D extends UsecaseDefinitions> = {
    [U in keyof D] : Usecase<D, U>
}[keyof D];

// for making usecase as Discriminated Union, must use "keyof D" for type of name, not use "string".
export type Course<D extends UsecaseDefinitions, U extends keyof D, C extends Courses> = {
    [K in keyof D[U]["scenes"][C]]: D[U]["scenes"][C][K] extends Empty
        ? () => Usecase<D, U>
        : (withValues: D[U]["scenes"][C][K]) => Usecase<D, U>
};

const Course = class Course<D extends UsecaseDefinitions, U extends keyof D, C extends Courses> {
    constructor(usecase: U, course: C, scenario: ScenarioConstructor<D, U>) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? (withValues: any) => {
                        const context = { "scene" : prop, course, ...withValues } as Context<D[U]["scenes"]>;
                        const usecaseCore = new Scene<D, U, D[U]["scenes"], D[U]["scenario"]>(usecase, context, new scenario());
                        return Object.freeze(Object.assign(usecaseCore, { "name" : usecase }));
                    }
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <D extends UsecaseDefinitions, U extends keyof D, C extends Courses>(usecase: U, course: C, scenario: ScenarioConstructor<D, U>) => Course<D, U, C>;

// for declaring like "SomeScenario<SomeScenes>", cannot use generics paramaters "D extends UsecaseDefinitions, U extends keyof D"
export abstract class BaseScenario<Z extends Scenes> implements IScenario<Z> {
    basics: Contexts<this, Basics>;
    alternatives: Contexts<this, Alternatives>;
    goals: Contexts<this, Goals>;

    constructor() {
        const { basics, alternatives, goals } = new ContextSelector<this>();
        this.basics = basics;
        this.alternatives = alternatives;
        this.goals = goals;
    }
    abstract authorize<D extends UsecaseDefinitions, User, A extends IActor<User>>(actor: A, usecase: keyof D): boolean;
    abstract next(to: MutableContext<Z>): Observable<Context<Z>>;

    just(next: Context<Z>) : Observable<Context<Z>> {
        return of(next);
    }
}

class CourseSelector<D extends UsecaseDefinitions, U extends keyof D> {
    basics: Course<D, U, Basics>;
    alternatives: Course<D, U, Alternatives>;
    goals: Course<D, U, Goals>;

    constructor(usecase: U, scenario: ScenarioConstructor<D, U>) {
        this.basics = new Course<D, U, Basics>(usecase, "basics", scenario);
        this.alternatives = new Course<D, U, Alternatives>(usecase, "alternatives", scenario);
        this.goals = new Course<D, U, Goals>(usecase, "goals", scenario);
    }
}

export type UsecaseSelector<D extends UsecaseDefinitions> = { 
    [U in keyof D]: (scenario: new (usecase: U, context: Context<D[U]["scenes"]>) => D[U]["scenario"]) => CourseSelector<D, U>
};

export const UsecaseSelector = class UsecaseSelector {
    constructor() {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? (scenario: any) => new CourseSelector(prop, scenario)
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <D extends UsecaseDefinitions>() => UsecaseSelector<D>;

export class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string) {
        super(`The actor "${ actor }" is not authorized to interact on usecase "${ usecase }".`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}