import { IActor } from "./actor";
export type NOCARE = any;
type PreFlatten<Z> = {
    [C in keyof Z as C extends string ? Z[C] extends Empty ? never : `${C}.${keyof Z[C] & string}` : C]: Z[C];
};
type Flatten<Z> = {
    [CK in keyof PreFlatten<Z>]: CK extends `${infer C extends keyof Z & string}.${string}` ? CK extends `${string}.${infer K extends keyof Z[C] & string}` ? Z[C][K] : never : never;
};
declare const courses: readonly ["basics", "alternatives", "goals"];
export type Courses = typeof courses[number];
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
export type Context<Z extends Scenes, Directive = null> = {
    readonly [K in keyof Flatten<Z>]: K extends `${infer C}.${infer S}` ? Flatten<Z>[K] extends Empty ? {
        scene: S;
        course: C;
        directive?: Directive;
    } : {
        scene: S;
        course: C;
        directive?: Directive;
    } & Flatten<Z>[K] : never;
}[keyof Flatten<Z>];
export type ContextOf<Z extends Scenes, C extends Courses, Directive = null> = {
    readonly [S in keyof Z[C]]: Z[C][S] extends Empty ? {
        scene: S;
        course: C;
        directive?: Directive;
    } : {
        scene: S;
        course: C;
        directive?: Directive;
    } & Z[C][S];
}[keyof Z[C]];
type SceneFactory<Z extends Scenes, C extends Courses> = Z[C] extends Empty ? Empty : {
    [K in keyof Z[C]]: K;
};
declare const SceneFactory: new <Z extends Scenes, C extends "basics" | "alternatives" | "goals">() => SceneFactory<Z, C>;
type ContextFactory<Z extends Scenes, C extends Courses, Directive = null> = Z[C] extends Empty ? Empty : {
    [K in keyof Z[C]]: Z[C][K] extends Empty ? () => Context<Z, Directive> : (withValues: Z[C][K]) => Context<Z, Directive>;
};
declare const ContextFactory: new <Z extends Scenes, C extends "basics" | "alternatives" | "goals", Directive = null>(course: C) => ContextFactory<Z, C, Directive>;
type UsecaseScenarios<D extends string> = {
    [U in string]: new (domain: D, usecase: U, id: string) => Scenario<NOCARE, NOCARE>;
};
export type DomainRequirements = {
    [D in string]: UsecaseScenarios<D>;
};
type DomainKeys<R extends DomainRequirements> = {
    [D in keyof R]: D;
};
type UsecaseKeys<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]]: U;
};
export type InferScenes<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = {
    [U in keyof R[D]]: R[D][U] extends {
        new (domain: string, usecase: string, id: string): Scenario<infer Z extends Scenes, NOCARE>;
    } ? Z : never;
}[U];
export type InferDirective<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = {
    [U in keyof R[D]]: R[D][U] extends {
        new (domain: string, usecase: string, id: string): Scenario<NOCARE, infer Directive>;
    } ? Directive : never;
}[U];
type SceneFactoryAdapter<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = InferScenes<R, D, U>[C] extends Empty ? Empty : SceneFactory<InferScenes<R, D, U>, C>;
declare const SceneFactoryAdapter: new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends "basics" | "alternatives" | "goals">() => SceneFactoryAdapter<R, D, U, C>;
export type StringKeyof<T> = Extract<keyof T, string>;
export interface IScenarioDelegate<Z extends Scenes, Directive = null> {
    next?<A extends IActor<NOCARE>, S extends Scenario<Z, Directive>>(to: Context<Z, Directive>, actor: A, scenario: S): Promise<Context<Z, Directive>>;
    authorize?<A extends IActor<NOCARE>, R extends DomainRequirements, D extends StringKeyof<R>, U extends StringKeyof<R[D]>>(actor: A, domain: D, usecase: U): boolean;
    complete?<A extends IActor<NOCARE>, R extends DomainRequirements, D extends keyof R, U extends keyof R[D]>(withResult: InteractResult<R, D, U, A, Z, Directive>): void;
}
export declare class Scenario<Z extends Scenes, Directive = null> {
    readonly domain: string;
    readonly usecase: string;
    readonly id: string;
    delegate?: IScenarioDelegate<Z, Directive>;
    readonly keys: {
        readonly basics: SceneFactory<Z, Basics>;
        readonly alternatives: SceneFactory<Z, Alternatives>;
        readonly goals: SceneFactory<Z, Goals>;
    };
    readonly basics: ContextFactory<Z, Basics, Directive>;
    readonly alternatives: ContextFactory<Z, Alternatives, Directive>;
    readonly goals: ContextFactory<Z, Goals, Directive>;
    constructor(domain: string, usecase: string, id: string);
    next<A extends IActor<NOCARE>>(to: Context<Z, Directive>, actor: A): Promise<Context<Z, Directive>>;
    just(next: Context<Z, Directive>): Promise<Context<Z, Directive>>;
    withDirective(next: Context<Z, Directive>, directive: Directive): Promise<Context<Z, Directive>>;
    authorize<A extends IActor<NOCARE>, R extends DomainRequirements, D extends StringKeyof<R>, U extends StringKeyof<R[D]>>(actor: A, domain: D, usecase: U): boolean;
    complete<A extends IActor<NOCARE>, R extends DomainRequirements, D extends keyof R, U extends keyof R[D]>(withResult: InteractResult<R, D, U, A, Z, Directive>): void;
}
export declare const InteractResultType: {
    readonly success: "success";
    readonly failure: "failure";
};
type InteractResultContext<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes, Directive = null> = {
    [InteractResultType.success]: {
        id: string;
        actor: A;
        domain: D;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: Context<Z, Directive>[];
        lastSceneContext: Context<Z, Directive>;
    };
    [InteractResultType.failure]: {
        id: string;
        actor: A;
        domain: D;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: Context<Z, Directive>[];
        failedSceneContext: Context<Z, Directive>;
        error: Error;
    };
};
type InteractResultCase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes, Directive, K extends keyof InteractResultContext<R, D, U, A, Z, Directive>> = Record<"type", K> & InteractResultContext<R, D, U, A, Z, Directive>[K];
export type InteractResult<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes, Directive = null> = {
    [K in keyof InteractResultContext<R, D, U, A, Z, Directive>]: InteractResultCase<R, D, U, A, Z, Directive, K>;
}[keyof InteractResultContext<R, D, U, A, Z, Directive>];
export declare class UsecaseImple<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    readonly id: string;
    private readonly _domain;
    private readonly _usecase;
    private readonly _scenario;
    constructor(id: string, domain: D, usecase: U, initialContext: Context<InferScenes<R, D, U>, InferDirective<R, D, U>>, scenario: Scenario<InferScenes<R, D, U>, InferDirective<R, D, U>>);
    get currentContext(): Context<InferScenes<R, D, U>, InferDirective<R, D, U>>;
    set currentContext(context: Context<InferScenes<R, D, U>, InferDirective<R, D, U>>);
    set(delegate: IScenarioDelegate<InferScenes<R, D, U>, InferDirective<R, D, U>>): void;
    progress<User, A extends IActor<User>>(actor: A): Promise<Context<InferScenes<R, D, U>, InferDirective<R, D, U>>>;
    interactedBy<User, A extends IActor<User>>(actor: A, recursiveWrapper?: (recursive: () => Promise<InteractResult<R, D, U, A, InferScenes<R, D, U>, InferDirective<R, D, U>>>) => Promise<InteractResult<R, D, U, A, InferScenes<R, D, U>, InferDirective<R, D, U>>>): Promise<InteractResult<R, D, U, A, InferScenes<R, D, U>, InferDirective<R, D, U>>>;
}
type UsecaseContext<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = {
    "domain": D;
    "name": U;
    "course": Courses;
    "scene": string;
};
export type Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = UsecaseContext<R, D, U> & UsecaseImple<R, D, U>;
type ScenarioFactory<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = InferScenes<R, D, U>[C] extends Empty ? Empty : {
    [K in keyof InferScenes<R, D, U>[C]]: InferScenes<R, D, U>[C][K] extends Empty ? (id?: string) => Usecase<R, D, U> : (withValues: InferScenes<R, D, U>[C][K], id?: string) => Usecase<R, D, U>;
};
declare const ScenarioFactory: new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends "basics" | "alternatives" | "goals">(domain: D, usecase: U, course: C, scenario: new (domain: D, usecase: U, id: string) => Scenario<InferScenes<R, D, U>, InferDirective<R, D, U>>) => ScenarioFactory<R, D, U, C>;
export declare class CourseSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    readonly keys: {
        readonly basics: SceneFactoryAdapter<R, D, U, Basics>;
        readonly alternatives: SceneFactoryAdapter<R, D, U, Alternatives>;
        readonly goals: SceneFactoryAdapter<R, D, U, Goals>;
    };
    readonly basics: ScenarioFactory<R, D, U, Basics>;
    readonly alternatives: ScenarioFactory<R, D, U, Alternatives>;
    readonly goals: ScenarioFactory<R, D, U, Goals>;
    constructor(domain: D, usecase: U, scenario: new (domain: D, usecase: U, id: string) => Scenario<InferScenes<R, D, U>, InferDirective<R, D, U>>);
}
export type UsecaseSelector<R extends DomainRequirements, D extends StringKeyof<R>> = Record<"keys", UsecaseKeys<R, D>> & {
    [U in keyof R[D]]: CourseSelector<R, D, U>;
};
export declare const UsecaseSelector: new <R extends DomainRequirements, D extends Extract<keyof R, string>>(domain: D, scenarioConstructors: UsecaseScenarios<D>) => UsecaseSelector<R, D>;
export type Robustive<R extends DomainRequirements> = Record<"keys", DomainKeys<R>> & Record<"typeGuards", {
    [D in StringKeyof<R>]: {
        [U in keyof R[D]]: (scenario: Scenario<any, any>) => scenario is Scenario<InferScenes<R, D, U>, InferDirective<R, D, U>>;
    };
}> & {
    [D in StringKeyof<R>]: UsecaseSelector<R, D>;
};
export declare const Robustive: new <R extends DomainRequirements>(requirements: R) => Robustive<R>;
export type AllUsecases<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]]: Usecase<R, D, U>;
}[keyof R[D]];
export type AllUsecasesOverDomain<R extends DomainRequirements> = {
    [D in keyof R]: {
        [U in keyof R[D]]: Usecase<R, D, U>;
    }[keyof R[D]];
}[keyof R];
export declare class ActorNotAuthorizedToInteractIn<A extends IActor<NOCARE>, Domain, Usecase> extends Error {
    constructor(actor: A, domain: Domain, usecase: Usecase);
}
export {};
//# sourceMappingURL=usecase.d.ts.map