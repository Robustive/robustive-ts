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

type SceneFactory<Z extends Scenes, C extends Courses> = Z[C] extends Empty
    ? Empty // for empty alternatives
    : { 
        [K in keyof Z[C]]: Z[C][K] extends Empty
            ? () => Context<Z>
            : (withValues: Z[C][K]) => Context<Z>
    };

const SceneFactory = class SceneFactory<C extends Courses> {
    constructor(course: C) {
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = scene
                return ((typeof prop === "string") && !(prop in target))
                    ? (withValues?: ContextualValues) => {
                        return Object.freeze({ "scene" : prop, course, ...withValues });
                    }
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <Z extends Scenes, C extends Courses>(course: C) => SceneFactory<Z, C>;

type UsecaseScenarios = Record<string, new () => IScenario<ANY>>;
export type DomainRequirements = Record<string,  UsecaseScenarios>;

type StringKeyof<T> = Extract<keyof T, string>;

type InferScenario<T> = T extends new () => infer S
    ? S extends IScenario<ANY> ? S : never
    : never;

type InferScenesInScenario<T> = T extends IScenario<infer Z extends Scenes> ? Z : never;

type InferScenesInScenarioConstructor<T> = T extends new () => infer S
    ? S extends IScenario<infer Z> ? Z : never
    : never;

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
        performedScenario : Context<Z>[];
        failedSceneContext : MutableContext<Z>;
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
    #initialContext: Context<InferScenesInScenario<S>>;
    #scenario: S;
    
    constructor(domain: D, usecase: U, initialContext: Context<InferScenesInScenario<S>>, scenario: S) {
        this.id = generateId(8);
        this.#domain = domain;
        this.#usecase = usecase;
        this.#initialContext = initialContext;
        this.#scenario = scenario;
    }

    interactedBy<User, A extends IActor<User>>(actor: A): Promise<InteractResult<R, D, U, A, InferScenesInScenario<S>>> {
        const startAt = new Date();
        const InteractResult = new InteractResultFactory<R, D, U, A, InferScenesInScenario<S>>();

        const recursive = (scenario: Context<InferScenesInScenario<S>>[]): Promise<Context<InferScenesInScenario<S>>[]> => {
            const lastScene = scenario.slice(-1)[0];
            if (lastScene.course === "goals") { // exit criteria
                return Promise.resolve(scenario);
            }

            return this.#scenario.next(lastScene as MutableContext<InferScenesInScenario<S>>)
                .then((nextScene) => {
                    scenario.push(nextScene);
                    return recursive(scenario);
                });
        };

        if (this.#scenario.authorize && !this.#scenario.authorize(actor, this.#domain as Extract<D, string>, this.#usecase as Extract<U, string>)) {
            const err = new ActorNotAuthorizedToInteractIn(actor, this.#domain, this.#usecase);
            return Promise.reject(err);
        }
        const scenario: Context<InferScenesInScenario<S>>[] = [this.#initialContext];

        return recursive(scenario)
            .then((performedScenario) => {
                const endAt = new Date();
                const elapsedTimeMs = (endAt.getTime() - startAt.getTime());
                const lastSceneContext = performedScenario.slice(-1)[0] as MutableContext<InferScenesInScenario<S>>;
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
                const lastSceneContext = scenario.slice(-1)[0] as MutableContext<InferScenesInScenario<S>>;
                const result =  InteractResult.failure({
                    id: this.id
                    , actor
                    , domain: this.#domain
                    , usecase : this.#usecase
                    , startAt
                    , endAt
                    , elapsedTimeMs
                    , performedScenario : scenario
                    , failedSceneContext : lastSceneContext
                    , error : err
                });
                if (this.#scenario.complete) { this.#scenario.complete(result); }
                return result;
            });
    }
}

export type Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = Record<"name", U> & Record<"domain", D> & _Usecase<R, D, U, InferScenario<R[D][U]>>;

// for making usecase as Discriminated Union, must use "keyof D" for type of name, not use "string".
type UsecaseFactory<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = InferScenesInScenarioConstructor<R[D][U]>[C] extends Empty
    ? Empty // for Empty alternative
    : {
        [K in keyof InferScenesInScenarioConstructor<R[D][U]>[C]]: InferScenesInScenarioConstructor<R[D][U]>[C][K] extends Empty
            ? () => Usecase<R, D, U>
            : (withValues: InferScenesInScenarioConstructor<R[D][U]>[C][K]) => Usecase<R, D, U>
    };

const UsecaseFactory = class UsecaseFactory<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> {
    constructor(domain: D, usecase: U, course: C, scenario: new () => IScenario<ANY>) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    ? (withValues?: ContextualValues) => {
                        const context = { "scene" : prop, course, ...withValues } as Context<InferScenesInScenarioConstructor<R[D][U]>>;
                        const s = new scenario();
                        const usecaseCore = new _Usecase<R, D, U, typeof s>(domain, usecase, context, s);
                        return Object.freeze(Object.assign(usecaseCore, { "name" : usecase, "domain": domain }));
                    }
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses>(domain: D, usecase: U, course: C, scenario: new () => IScenario<ANY>) => UsecaseFactory<R, D, U, C>;

class CourseSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    basics: UsecaseFactory<R, D, U, Basics>;
    alternatives: UsecaseFactory<R, D, U, Alternatives>;
    goals: UsecaseFactory<R, D, U, Goals>;

    constructor(domain: D, usecase: U, scenario: new () => IScenario<ANY>) {
        this.basics = new UsecaseFactory<R, D, U, Basics>(domain, usecase, "basics", scenario);
        this.alternatives = new UsecaseFactory<R, D, U, Alternatives>(domain, usecase, "alternatives", scenario);
        this.goals = new UsecaseFactory<R, D, U, Goals>(domain, usecase, "goals", scenario);
    }
}

// for declaring like "SomeScenario<SomeScenes>", cannot use generics paramaters "D extends UsecaseDefinitions, U extends keyof D"
export abstract class BaseScenario<Z extends Scenes> implements IScenario<Z> {
    basics: SceneFactory<Z, Basics>;
    alternatives: SceneFactory<Z, Alternatives>;
    goals: SceneFactory<Z, Goals>;

    constructor() {
        this.basics = new SceneFactory<Z, Basics>("basics");
        this.alternatives = new SceneFactory<Z, Alternatives>("alternatives");
        this.goals = new SceneFactory<Z, Goals>("goals");
    }

    abstract next(to: MutableContext<Z>): Promise<Context<Z>>;
    
    just(next: Context<Z>) : Promise<Context<Z>> {
        return Promise.resolve(next);
    }
}


export type UsecaseSelector<R extends DomainRequirements, D extends keyof R> = { 
    [U in keyof R[D]]: CourseSelector<R, D, U>
};

export const UsecaseSelector = class UsecaseSelector<R extends DomainRequirements, D extends keyof R> {
    constructor(domain: D, usecases: UsecaseScenarios) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    ? new CourseSelector<R, D, keyof UsecaseScenarios>(domain, prop, usecases[prop])
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R>(domain: D, usecases: UsecaseScenarios) => UsecaseSelector<R, D>;

export type Robustive<R extends DomainRequirements> = {
    [D in keyof R] : UsecaseSelector<R, D>;
};

export const Robustive = class Robustive<R extends DomainRequirements> {
    constructor(requirements: R) {
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = domain
                return ((typeof prop === "string") && !(prop in target))
                    ? new UsecaseSelector<R, keyof R>(prop, requirements[prop])
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements>(requirements: R) => Robustive<R>;

export type AllUsecases<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]] : Usecase<R, D, U>
}[keyof R[D]];

export type AllUsecasesOverDomain<R extends DomainRequirements> = {
    [D in keyof R] : {
        [U in keyof R[D]] : Usecase<R, D, U>
    }[keyof R[D]]
}[keyof R];

export class ActorNotAuthorizedToInteractIn<A extends IActor<ANY>, Domain, Usecase> extends Error {
    constructor(actor: A, domain: Domain, usecase: Usecase) {
        super(`The actor "${ actor.constructor.name }" is not authorized to interact on usecase "${ String(usecase) }" of domain "${ String(domain) }".`);
    }
}