import { IActor } from "./actor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any;

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
        ? Flatten<Z>[K] extends Empty
            ? { scene: S; course: C; }
            : { scene: S; course: C; } & Flatten<Z>[K]
        : never 
}[keyof Flatten<Z>];

type SceneFactory<Z extends Scenes, C extends Courses> = Z[C] extends Empty
    ? Empty // for empty alternatives
    : { 
        [K in keyof Z[C]]: K
    };

const SceneFactory = class SceneFactory {
    constructor() {
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = scene
                return ((typeof prop === "string") && !(prop in target))
                    ? prop
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <Z extends Scenes, C extends Courses>() => SceneFactory<Z, C>;
    
type ContextFactory<Z extends Scenes, C extends Courses> = Z[C] extends Empty
    ? Empty // for empty alternatives
    : { 
        [K in keyof Z[C]]: Z[C][K] extends Empty
            ? () => Context<Z>
            : (withValues: Z[C][K]) => Context<Z>
    };

const ContextFactory = class ContextFactory<C extends Courses> {
    constructor(course: C) {
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = scene
                return ((typeof prop === "string") && !(prop in target))
                    ? (withValues?: ContextualValues) => {
                        return Object.freeze(Object.assign(withValues || {}, { "scene" : prop, course }));
                    }
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <Z extends Scenes, C extends Courses>(course: C) => ContextFactory<Z, C>;

type UsecaseScenarios<D> = { [usecase: string] : new (domain: D, usecase: string, id: string, isSubstitute: boolean) => IScenario<ANY> };
export type DomainRequirements = { [domain: string] :  UsecaseScenarios<ANY> };

type DomainKeys<R extends DomainRequirements> = {
    [D in keyof R]: D
};

type UsecaseKeys<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]]: U
};

type SceneFactoryAdapter<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = InferScenesInScenarioConstructor<R[D][U]>[C] extends Empty
    ? Empty // for Empty alternative
    : SceneFactory<InferScenesInScenarioConstructor<R[D][U]>, C>;

const SceneFactoryAdapter = class SceneFactoryAdapter {
    constructor() {
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = scene
                return ((typeof prop === "string") && !(prop in target))
                    ? prop
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses>() => SceneFactoryAdapter<R, D, U, C>;

type StringKeyof<T> = Extract<keyof T, string>;

type InferScenario<T> = T extends new (domain: string, usecase: string, id: string, isSubstitute: boolean) => infer S
    ? S extends IScenario<ANY> ? S : never
    : never;

type InferScenesInScenario<T> = T extends IScenario<infer Z extends Scenes> ? Z : never;

type InferScenesInScenarioConstructor<T> = T extends new (domain: string, usecase: string, id: string, isSubstitute: boolean) => infer S
    ? S extends IScenario<infer Z> ? Z : never
    : never;

export interface IScenario<Z extends Scenes> {
    domain: string;
    usecase: string;
    id: string;
    isSubstitute: boolean;
    keys: {
        basics : SceneFactory<Z, Basics>;
        alternatives : SceneFactory<Z, Alternatives>;
        goals : SceneFactory<Z, Goals>;
    };
    next(to: Context<Z>): Promise<Context<Z>>;
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
        lastSceneContext :Context<Z>;
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
        failedSceneContext : Context<Z>;
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
                        return Object.freeze(Object.assign(withValues, { "type" : prop }));
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
    
    constructor(id: string, domain: D, usecase: U, initialContext: Context<InferScenesInScenario<S>>, scenario: S) {
        this.id = id;
        this.#domain = domain;
        this.#usecase = usecase;
        this.#initialContext = initialContext;
        this.#scenario = scenario;
    }

    progress<User, A extends IActor<User>>(actor: A): Promise<Context<InferScenesInScenario<S>>> {
        if (this.#scenario.authorize && !this.#scenario.authorize(actor, this.#domain as Extract<D, string>, this.#usecase as Extract<U, string>)) {
            const err = new ActorNotAuthorizedToInteractIn(actor, this.#domain, this.#usecase);
            return Promise.reject(err);
        }
        return this.#scenario.next(this.#initialContext);
    }

    interactedBy<User, A extends IActor<User>>(actor: A): Promise<InteractResult<R, D, U, A, InferScenesInScenario<S>>> {
        const startAt = new Date();
        const InteractResult = new InteractResultFactory<R, D, U, A, InferScenesInScenario<S>>();

        const recursive = (scenario: Context<InferScenesInScenario<S>>[]): Promise<Context<InferScenesInScenario<S>>[]> => {
            const lastScene = scenario.slice(-1)[0];
            if (lastScene.course === "goals") { // exit criteria
                return Promise.resolve(scenario);
            }

            return this.#scenario.next(lastScene)
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
                const lastSceneContext = performedScenario.slice(-1)[0];
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
                const lastSceneContext = scenario.slice(-1)[0];
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

export type Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = { 
    "domain": D;
    "name" : U;
    "course": Courses;
    "scene": string;
} & _Usecase<R, D, U, InferScenario<R[D][U]>>;

// for making usecase as Discriminated Union, must use "keyof D" for type of name, not use "string".
type ScenarioFactory<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = InferScenesInScenarioConstructor<R[D][U]>[C] extends Empty
    ? Empty // for Empty alternative
    : {
        [K in keyof InferScenesInScenarioConstructor<R[D][U]>[C]]: InferScenesInScenarioConstructor<R[D][U]>[C][K] extends Empty
            ? (id?: string, isSubstitute?: boolean) => Usecase<R, D, U>
            : (withValues: InferScenesInScenarioConstructor<R[D][U]>[C][K], id?: string, isSubstitute?: boolean) => Usecase<R, D, U>
    };

const ScenarioFactory = class ScenarioFactory<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> {
    constructor(domain: D, usecase: U, course: C, scenario: new (odmain: D, usecase: U, id: string, isSubstitute: boolean) => IScenario<ANY>) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                return ((typeof prop === "string") && !(prop in target))
                    ? (withValues?: ContextualValues, id?: string, isSubstitute: boolean = false) => {
                        const context = Object.assign(withValues || {}, { "scene" : prop, course }) as Context<InferScenesInScenarioConstructor<R[D][U]>>;
                        const _id = id || generateId(8);
                        const s = new scenario(domain, usecase, _id, isSubstitute);
                        const usecaseCore = new _Usecase<R, D, U, typeof s>(_id, domain, usecase, context, s);
                        return Object.freeze(Object.assign(usecaseCore, { "domain": domain, "name" : usecase, "scene": prop, course }));
                    }
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses>(domain: D, usecase: U, course: C, scenario: new (domain: D, usecase: U, id: string, isSubstitute: boolean) => IScenario<ANY>) => ScenarioFactory<R, D, U, C>;

class CourseSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    readonly keys: {
        readonly basics : SceneFactoryAdapter<R, D, U, Basics>;
        readonly alternatives : SceneFactoryAdapter<R, D, U, Alternatives>;
        readonly goals : SceneFactoryAdapter<R, D, U, Goals>;
    };
    readonly basics: ScenarioFactory<R, D, U, Basics>;
    readonly alternatives: ScenarioFactory<R, D, U, Alternatives>;
    readonly goals: ScenarioFactory<R, D, U, Goals>;

    constructor(domain: D, usecase: U, scenario: new (domain: D, usecase: U, id: string, isSubstitute: boolean) => IScenario<ANY>) {
        this.keys = {
            basics: new SceneFactoryAdapter<R, D, U, Basics>()
            , alternatives: new SceneFactoryAdapter<R, D, U, Alternatives>()
            , goals: new SceneFactoryAdapter<R, D, U, Goals>()
        };
        this.basics = new ScenarioFactory<R, D, U, Basics>(domain, usecase, "basics", scenario);
        this.alternatives = new ScenarioFactory<R, D, U, Alternatives>(domain, usecase, "alternatives", scenario);
        this.goals = new ScenarioFactory<R, D, U, Goals>(domain, usecase, "goals", scenario);
    }
}

// for declaring like "SomeScenario<SomeScenes>", cannot use generics paramaters "D extends UsecaseDefinitions, U extends keyof D"
export abstract class BaseScenario<Z extends Scenes> implements IScenario<Z> {
    readonly domain: string;
    readonly usecase: string;
    readonly id: string;
    readonly isSubstitute: boolean;
    readonly keys: {
        readonly basics : SceneFactory<Z, Basics>;
        readonly alternatives : SceneFactory<Z, Alternatives>;
        readonly goals : SceneFactory<Z, Goals>;
    };
    readonly basics: ContextFactory<Z, Basics>;
    readonly alternatives: ContextFactory<Z, Alternatives>;
    readonly goals: ContextFactory<Z, Goals>;

    constructor(domain: string, usecase: string, id: string, isSubstitute: boolean = false) {
        this.domain = domain;
        this.usecase = usecase;
        this.id = id;
        this.isSubstitute = isSubstitute;
        this.keys = {
            basics: new SceneFactory<Z, Basics>()
            , alternatives: new SceneFactory<Z, Alternatives>()
            , goals: new SceneFactory<Z, Goals>()
        };
        this.basics = new ContextFactory<Z, Basics>("basics");
        this.alternatives = new ContextFactory<Z, Alternatives>("alternatives");
        this.goals = new ContextFactory<Z, Goals>("goals");
    }

    abstract next(to: Context<Z>): Promise<Context<Z>>;
    
    just(next: Context<Z>) : Promise<Context<Z>> {
        return Promise.resolve(next);
    }
}

export type UsecaseSelector<R extends DomainRequirements, D extends keyof R> = Record<"keys", UsecaseKeys<R, D>> & { 
    [U in keyof R[D]]: CourseSelector<R, D, U>
};

export const UsecaseSelector = class UsecaseSelector<R extends DomainRequirements, D extends keyof R> {
    readonly keys: UsecaseKeys<R, D>;
    constructor(domain: D, scenarioConstuctors: UsecaseScenarios<D>) {
        const usecaseKeys = Object.keys(scenarioConstuctors);
        this.keys = usecaseKeys.reduce<Record<string, string>>((keys, usecase) => {
            keys[usecase] = usecase;
            return keys;
        }, {}) as UsecaseKeys<R, D>;
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = usecase
                return ((typeof prop === "string") && usecaseKeys.includes(prop))
                    ? new CourseSelector<R, D, StringKeyof<UsecaseScenarios<D>>>(domain, prop, scenarioConstuctors[prop])
                    : Reflect.get(target, prop, receiver);
            }
        });
    }
} as new <R extends DomainRequirements, D extends keyof R>(domain: D, scenarioConstuctors: UsecaseScenarios<D>) => UsecaseSelector<R, D>;

export type Robustive<R extends DomainRequirements> = Record<"keys", DomainKeys<R>> & {
    [D in keyof R] : UsecaseSelector<R, D>;
};

export const Robustive = class Robustive<R extends DomainRequirements> {
    readonly keys: DomainKeys<R>;
    constructor(requirements: R) {
        const domainKeys = Object.keys(requirements);
        this.keys = domainKeys.reduce<Record<string, string>>((keys, domain) => {
            keys[domain] = domain;
            return keys;
        }, {}) as DomainKeys<R>;
        return new Proxy(this, {
            get(target, prop, receiver) { // prop = domain
                return ((typeof prop === "string") && domainKeys.includes(prop))
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