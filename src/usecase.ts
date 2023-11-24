import { IActor } from "./actor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any;

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
                                ? (withValues?: ContextualValues) => {
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

export type DomainRequirements = Record<string,  Record<string, IScenario<ANY>>>;

type InferScene<T> = T extends IScenario<infer Z extends Scenes> ? Z : never;
type StringKeyof<T> = Extract<keyof T, string>;

type ScenarioConstructor<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = new () => R[D][U];

export interface IScenario<Z extends Scenes> {
    next(to: MutableContext<Z>): Promise<Context<Z>>;
    just(next: Context<Z>): Promise<Context<Z>>;
    authorize?<A extends IActor<ANY>, R extends DomainRequirements, D extends StringKeyof<R>, U extends StringKeyof<R[D]>>(actor: A, domain: D, usecase: U): boolean;
    complete?<A extends IActor<ANY>, R extends DomainRequirements, D extends keyof R, U extends keyof R[D]>(withResult: InteractResult<R, D, U, A, Z>): void;
}

export const InteractResultType = {
    success: "success"
    , failure: "failure"
} as const;

type InteractResultContext<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes> = {
    [InteractResultType.success] : {
        id: string;
        actor : A;
        domain : D;
        usecase : U;
        startAt : Date;
        endAt : Date;
        elapsedTimeMs : number;
        performedScenario : Context<Z>[];
        lastSceneContext : MutableContext<Z>;
    };
    [InteractResultType.failure] : {
        id: string;
        actor : A;
        domain : D;
        usecase : U;
        startAt : Date;
        endAt : Date;
        elapsedTimeMs : number;
        error: Error;
    };
};

type InteractResultCase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes, K extends keyof InteractResultContext<R, D, U, A, Z>> = Record<"type", K> & InteractResultContext<R, D, U, A, Z>[K];

export type InteractResult<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes> = { 
    [K in keyof InteractResultContext<R, D, U, A, Z>] : InteractResultCase<R, D, U, A, Z, K>;
}[keyof InteractResultContext<R, D, U, A, Z>];


type InteractResultSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes> = { 
    [K in keyof InteractResultContext<R, D, U, A, Z>] : (withValues: InteractResultContext<R, D, U, A, Z>[K]) => InteractResultCase<R, D, U, A, Z, K>;
};

const InteractResultFactory = class InteractResultFactory {
    constructor() {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    ? (withValues: object) => {
                        return Object.freeze({ "type" : prop, ...withValues });
                    }
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes>() => InteractResultSelector<R, D, U, A, Z>;

const generateId = (length: number) => { 
    const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; 
    return Array.from(crypto.getRandomValues(new Uint8Array(length))).map((n)=>S[n%S.length]).join("");
};

class _Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], S extends IScenario<ANY>> {
    readonly id: string;
    #domain: D;
    #usecase: U;
    #initialContext: Context<InferScene<S>>;
    #scenario: S;
    
    constructor(domain: D, usecase: U, initialContext: Context<InferScene<S>>, scenario: S) {
        this.id = generateId(8);
        this.#domain = domain;
        this.#usecase = usecase;
        this.#initialContext = initialContext;
        this.#scenario = scenario;
    }

    interactedBy<User, A extends IActor<User>>(actor: A): Promise<InteractResult<R, D, U, A, InferScene<S>>> {
        const startAt = new Date();
        const InteractResult = new InteractResultFactory<R, D, U, A, InferScene<S>>();

        const recursive = (scenario: Context<InferScene<S>>[]): Promise<Context<InferScene<S>>[]> => {
            const lastScene = scenario.slice(-1)[0];
            if (lastScene.course === "goals") { // exit criteria
                return Promise.resolve(scenario);
            }

            return this.#scenario.next(lastScene as MutableContext<InferScene<S>>)
                .then((nextScene) => {
                    scenario.push(nextScene);
                    return recursive(scenario);
                });
        };

        if (this.#scenario.authorize && !this.#scenario.authorize(actor, this.#domain as Extract<D, string>, this.#usecase as Extract<U, string>)) {
            const err = new ActorNotAuthorizedToInteractIn(actor.constructor.name, this.#usecase as string);
            return Promise.reject(err);
        }
        const scenario: Context<InferScene<S>>[] = [this.#initialContext];

        return recursive(scenario)
            .then((performedScenario) => {
                const endAt = new Date();
                const elapsedTimeMs = (endAt.getTime() - startAt.getTime());
                const lastSceneContext = performedScenario.slice(-1)[0] as MutableContext<InferScene<S>>;
                const result = InteractResult.success({
                    id: this.id
                    , actor
                    , domain: this.#domain
                    , usecase : this.#usecase
                    , startAt
                    , endAt
                    , elapsedTimeMs
                    , performedScenario
                    , lastSceneContext
                });
                if (this.#scenario.complete) { this.#scenario.complete(result); }
                return result;
            })
            .catch((err) => {
                console.error(err);
                const endAt = new Date();
                const elapsedTimeMs = (endAt.getTime() - startAt.getTime());
                const result =  InteractResult.failure({
                    id: this.id
                    , actor
                    , domain: this.#domain
                    , usecase : this.#usecase
                    , startAt
                    , endAt
                    , elapsedTimeMs
                    , error : err
                });
                if (this.#scenario.complete) { this.#scenario.complete(result); }
                return result;
            });
    }
}

export type Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = Record<"name", U> & Record<"domain", D> & _Usecase<R, D, U, R[D][U]>;
export type AllUsecases<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]] : Usecase<R, D, U>
}[keyof R[D]];

export type AllUsecasesOverDomain<R extends DomainRequirements> = {
    [D in keyof R] : {
        [U in keyof R[D]] : Usecase<R, D, U>
    }[keyof R[D]]
}[keyof R];

// for making usecase as Discriminated Union, must use "keyof D" for type of name, not use "string".
export type Course<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = {
    [K in keyof InferScene<R[D][U]>[C]]: InferScene<R[D][U]>[C][K] extends Empty
        ? () => Usecase<R, D, U>
        : (withValues: InferScene<R[D][U]>[C][K]) => Usecase<R, D, U>
};

const Course = class Course<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> {
    constructor(domain: D, usecase: U, course: C, scenario: ScenarioConstructor<R, D, U>) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    ? (withValues: ContextualValues) => {
                        const context = { "scene" : prop, course, ...withValues } as Context<InferScene<R[D][U]>>;
                        const usecaseCore = new _Usecase<R, D, U, R[D][U]>(domain, usecase, context, new scenario());
                        return Object.freeze(Object.assign(usecaseCore, { "name" : usecase, "domain": domain }));
                    }
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses>(domain: D, usecase: U, course: C, scenario: ScenarioConstructor<R, D, U>) => Course<R, D, U, C>;

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

    abstract next(to: MutableContext<Z>): Promise<Context<Z>>;
    
    just(next: Context<Z>) : Promise<Context<Z>> {
        return Promise.resolve(next);
    }
}

class CourseSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    basics: Course<R, D, U, Basics>;
    alternatives: Course<R, D, U, Alternatives>;
    goals: Course<R, D, U, Goals>;

    constructor(domain: D, usecase: U, scenario: ScenarioConstructor<R, D, U>) {
        this.basics = new Course<R, D, U, Basics>(domain, usecase, "basics", scenario);
        this.alternatives = new Course<R, D, U, Alternatives>(domain, usecase, "alternatives", scenario);
        this.goals = new Course<R, D, U, Goals>(domain, usecase, "goals", scenario);
    }
}

export type UsecaseSelector<R extends DomainRequirements, D extends keyof R> = { 
    [U in keyof R[D]]: (scenario: new (usecase: U, context: Context<InferScene<R[D][U]>>) => R[D][U]) => CourseSelector<R, D, U>
};

export const UsecaseSelector = class UsecaseSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    constructor(domain: D) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    ? (scenario: ScenarioConstructor<R, D, U>) => new CourseSelector<R, D, U>(domain, prop as U, scenario)
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R>(domain: D) => UsecaseSelector<R, D>;

export type UsecaseSelectorOverDomain<R extends DomainRequirements> = {
    [D in keyof R] : UsecaseSelector<R, D>;
};

export const UsecaseSelectorOverDomain = class UsecaseSelectorOverDomain<R extends DomainRequirements> {
    constructor() {
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = domain
                return ((typeof prop === "string") && !(prop in target))
                    ? new UsecaseSelector<R, keyof R>(prop as keyof R)
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements>() => UsecaseSelectorOverDomain<R>;


export class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string) {
        super(`The actor "${ actor }" is not authorized to interact on usecase "${ usecase }".`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}