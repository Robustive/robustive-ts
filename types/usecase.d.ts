import { IActor } from "./actor";
type ANY = any;
type PreFlatten<Z> = {
    [C in keyof Z as C extends string ? Z[C] extends Empty ? never : `${C}.${keyof Z[C] & string}` : C]: Z[C];
};
type Flatten<Z> = {
    [CK in keyof PreFlatten<Z>]: CK extends `${infer C extends keyof Z & string}.${string}` ? CK extends `${string}.${infer K extends keyof Z[C] & string}` ? Z[C][K] : never : never;
};
declare const courses: readonly ["basics", "alternatives", "goals"];
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
export type Context<Z extends Scenes> = {
    readonly [K in keyof Flatten<Z>]: K extends `${infer C}.${infer S}` ? Flatten<Z>[K] extends Empty ? {
        scene: S;
        course: C;
    } : {
        scene: S;
        course: C;
    } & Flatten<Z>[K] : never;
}[keyof Flatten<Z>];
type SceneFactory<Z extends Scenes, C extends Courses> = Z[C] extends Empty ? Empty : {
    [K in keyof Z[C]]: K;
};
declare const SceneFactory: new <Z extends Scenes, C extends "basics" | "alternatives" | "goals">() => SceneFactory<Z, C>;
type ContextFactory<Z extends Scenes, C extends Courses> = Z[C] extends Empty ? Empty : {
    [K in keyof Z[C]]: Z[C][K] extends Empty ? () => Context<Z> : (withValues: Z[C][K]) => Context<Z>;
};
declare const ContextFactory: new <Z extends Scenes, C extends "basics" | "alternatives" | "goals">(course: C) => ContextFactory<Z, C>;
type UsecaseScenarios<D> = {
    [usecase: string]: new (domain: D, usecase: string, id: string, isSubstitute: boolean) => IScenario<ANY>;
};
export type DomainRequirements = {
    [domain: string]: UsecaseScenarios<ANY>;
};
type DomainKeys<R extends DomainRequirements> = {
    [D in keyof R]: D;
};
type UsecaseKeys<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]]: U;
};
type SceneFactoryAdapter<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = InferScenesInScenarioConstructor<R[D][U]>[C] extends Empty ? Empty : SceneFactory<InferScenesInScenarioConstructor<R[D][U]>, C>;
declare const SceneFactoryAdapter: new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends "basics" | "alternatives" | "goals">() => SceneFactoryAdapter<R, D, U, C>;
type StringKeyof<T> = Extract<keyof T, string>;
type InferScenario<T> = T extends new (domain: string, usecase: string, id: string, isSubstitute: boolean) => infer S ? S extends IScenario<ANY> ? S : never : never;
type InferScenesInScenario<T> = T extends IScenario<infer Z extends Scenes> ? Z : never;
type InferScenesInScenarioConstructor<T> = T extends new (domain: string, usecase: string, id: string, isSubstitute: boolean) => infer S ? S extends IScenario<infer Z> ? Z : never : never;
export interface IScenario<Z extends Scenes> {
    domain: string;
    usecase: string;
    id: string;
    isSubstitute: boolean;
    keys: {
        basics: SceneFactory<Z, Basics>;
        alternatives: SceneFactory<Z, Alternatives>;
        goals: SceneFactory<Z, Goals>;
    };
    next(to: Context<Z>): Promise<Context<Z>>;
    just(next: Context<Z>): Promise<Context<Z>>;
    authorize?<A extends IActor<ANY>, R extends DomainRequirements, D extends StringKeyof<R>, U extends StringKeyof<R[D]>>(actor: A, domain: D, usecase: U): boolean;
    complete?<A extends IActor<ANY>, R extends DomainRequirements, D extends keyof R, U extends keyof R[D]>(withResult: InteractResult<R, D, U, A, Z>): void;
}
export declare const InteractResultType: {
    readonly success: "success";
    readonly failure: "failure";
};
type InteractResultContext<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes> = {
    [InteractResultType.success]: {
        id: string;
        actor: A;
        domain: D;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: Context<Z>[];
        lastSceneContext: Context<Z>;
    };
    [InteractResultType.failure]: {
        id: string;
        actor: A;
        domain: D;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: Context<Z>[];
        failedSceneContext: Context<Z>;
        error: Error;
    };
};
type InteractResultCase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes, K extends keyof InteractResultContext<R, D, U, A, Z>> = Record<"type", K> & InteractResultContext<R, D, U, A, Z>[K];
export type InteractResult<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes> = {
    [K in keyof InteractResultContext<R, D, U, A, Z>]: InteractResultCase<R, D, U, A, Z, K>;
}[keyof InteractResultContext<R, D, U, A, Z>];
declare class _Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], S extends IScenario<ANY>> {
    #private;
    readonly id: string;
    constructor(id: string, domain: D, usecase: U, initialContext: Context<InferScenesInScenario<S>>, scenario: S);
    progress<User, A extends IActor<User>>(actor: A): Promise<Context<InferScenesInScenario<S>>>;
    interactedBy<User, A extends IActor<User>>(actor: A): Promise<InteractResult<R, D, U, A, InferScenesInScenario<S>>>;
}
export type Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = {
    "domain": D;
    "name": U;
    "course": Courses;
    "scene": string;
} & _Usecase<R, D, U, InferScenario<R[D][U]>>;
type ScenarioFactory<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = InferScenesInScenarioConstructor<R[D][U]>[C] extends Empty ? Empty : {
    [K in keyof InferScenesInScenarioConstructor<R[D][U]>[C]]: InferScenesInScenarioConstructor<R[D][U]>[C][K] extends Empty ? (id?: string, isSubstitute?: boolean) => Usecase<R, D, U> : (withValues: InferScenesInScenarioConstructor<R[D][U]>[C][K], id?: string, isSubstitute?: boolean) => Usecase<R, D, U>;
};
declare const ScenarioFactory: new <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends "basics" | "alternatives" | "goals">(domain: D, usecase: U, course: C, scenario: new (domain: D, usecase: U, id: string, isSubstitute: boolean) => IScenario<ANY>) => ScenarioFactory<R, D, U, C>;
declare class CourseSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    readonly keys: {
        readonly basics: SceneFactoryAdapter<R, D, U, Basics>;
        readonly alternatives: SceneFactoryAdapter<R, D, U, Alternatives>;
        readonly goals: SceneFactoryAdapter<R, D, U, Goals>;
    };
    readonly basics: ScenarioFactory<R, D, U, Basics>;
    readonly alternatives: ScenarioFactory<R, D, U, Alternatives>;
    readonly goals: ScenarioFactory<R, D, U, Goals>;
    constructor(domain: D, usecase: U, scenario: new (domain: D, usecase: U, id: string, isSubstitute: boolean) => IScenario<ANY>);
}
export declare abstract class BaseScenario<Z extends Scenes> implements IScenario<Z> {
    readonly domain: string;
    readonly usecase: string;
    readonly id: string;
    readonly isSubstitute: boolean;
    readonly keys: {
        readonly basics: SceneFactory<Z, Basics>;
        readonly alternatives: SceneFactory<Z, Alternatives>;
        readonly goals: SceneFactory<Z, Goals>;
    };
    readonly basics: ContextFactory<Z, Basics>;
    readonly alternatives: ContextFactory<Z, Alternatives>;
    readonly goals: ContextFactory<Z, Goals>;
    constructor(domain: string, usecase: string, id: string, isSubstitute?: boolean);
    abstract next(to: Context<Z>): Promise<Context<Z>>;
    just(next: Context<Z>): Promise<Context<Z>>;
}
export type UsecaseSelector<R extends DomainRequirements, D extends keyof R> = Record<"keys", UsecaseKeys<R, D>> & {
    [U in keyof R[D]]: CourseSelector<R, D, U>;
};
export declare const UsecaseSelector: new <R extends DomainRequirements, D extends keyof R>(domain: D, scenarioConstuctors: UsecaseScenarios<D>) => UsecaseSelector<R, D>;
export type Robustive<R extends DomainRequirements> = Record<"keys", DomainKeys<R>> & {
    [D in keyof R]: UsecaseSelector<R, D>;
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
export declare class ActorNotAuthorizedToInteractIn<A extends IActor<ANY>, Domain, Usecase> extends Error {
    constructor(actor: A, domain: Domain, usecase: Usecase);
}
export {};
//# sourceMappingURL=usecase.d.ts.map