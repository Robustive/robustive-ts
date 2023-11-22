import { IActor } from "./actor";
type ANY = any;
type DeepReadonly<T> = T extends object ? {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
} : T;
type Mutable<T> = T extends object ? {
    -readonly [K in keyof T]: Mutable<T[K]>;
} : T;
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
    readonly [K in keyof Flatten<Z>]: K extends `${infer C}.${infer S}` ? DeepReadonly<Flatten<Z>[K] extends Empty ? Record<"scene", S> & Record<"course", C> : Record<"scene", S> & Record<"course", C> & Flatten<Z>[K]> : never;
}[keyof Flatten<Z>];
export type MutableContext<Z extends Scenes> = Mutable<Context<Z>>;
export type Contexts<S, C extends Courses> = S extends IScenario<infer Z extends Scenes> ? {
    [K in keyof Z[C]]: Z[C] extends Empty ? Empty : Z[C][K] extends Empty ? () => Context<Z> : (withValues: Z[C][K]) => Context<Z>;
} : never;
export type ContextSelector<S> = S extends IScenario<infer Z extends Scenes> ? {
    [C in keyof Z]: C extends Courses ? Contexts<S, C> : never;
} : never;
export declare const ContextSelector: new <S>() => {
    basics: Contexts<S, "basics">;
    alternatives: Contexts<S, "alternatives">;
    goals: Contexts<S, "goals">;
};
type UsecaseSpecification<Z extends Scenes, S extends IScenario<Z>> = {
    scenes: Z;
    scenario: S;
};
type UsecaseDefinitions = Record<string, UsecaseSpecification<Scenes, IScenario<Scenes>>>;
export type DomainRequirements = Record<string, UsecaseDefinitions>;
type ScenarioConstructor<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = new () => R[D][U]["scenario"];
export interface IScenario<Z extends Scenes> {
    next(to: MutableContext<Z>): Promise<Context<Z>>;
    just(next: Context<Z>): Promise<Context<Z>>;
    authorize?<A extends IActor<ANY>, R extends DomainRequirements, D extends keyof R, U extends keyof R[D]>(actor: A, domain: D, usecase: U): boolean;
}
export declare const InteractResultType: {
    readonly success: "success";
    readonly failure: "failure";
};
type InteractResultContext<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes> = {
    [InteractResultType.success]: {
        domain: D;
        actor: A;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: Context<Z>[];
        lastSceneContext: MutableContext<Z>;
    };
    [InteractResultType.failure]: {
        domain: D;
        actor: A;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        error: Error;
    };
};
type InteractResultCase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes, K extends keyof InteractResultContext<R, D, U, A, Z>> = Record<"type", K> & InteractResultContext<R, D, U, A, Z>[K];
export type InteractResult<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<ANY>, Z extends Scenes> = {
    [K in keyof InteractResultContext<R, D, U, A, Z>]: InteractResultCase<R, D, U, A, Z, K>;
}[keyof InteractResultContext<R, D, U, A, Z>];
declare class _Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], Z extends Scenes, S extends IScenario<Z>> {
    #private;
    constructor(domain: D, usecase: U, initialContext: Context<Z>, scenario: S);
    interactedBy<User, A extends IActor<User>>(actor: A): Promise<InteractResult<R, D, U, A, Z>>;
}
export type Usecase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> = Record<"name", U> & Record<"domain", D> & _Usecase<R, D, U, R[D][U]["scenes"], R[D][U]["scenario"]>;
export type AllUsecases<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]]: Usecase<R, D, U>;
}[keyof R[D]];
export type AllUsecasesOverDomain<R extends DomainRequirements> = {
    [D in keyof R]: {
        [U in keyof R[D]]: Usecase<R, D, U>;
    }[keyof R[D]];
}[keyof R];
export type Course<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], C extends Courses> = {
    [K in keyof R[D][U]["scenes"][C]]: R[D][U]["scenes"][C][K] extends Empty ? () => Usecase<R, D, U> : (withValues: R[D][U]["scenes"][C][K]) => Usecase<R, D, U>;
};
export declare abstract class BaseScenario<Z extends Scenes> implements IScenario<Z> {
    basics: Contexts<this, Basics>;
    alternatives: Contexts<this, Alternatives>;
    goals: Contexts<this, Goals>;
    constructor();
    abstract next(to: MutableContext<Z>): Promise<Context<Z>>;
    just(next: Context<Z>): Promise<Context<Z>>;
}
declare class CourseSelector<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
    basics: Course<R, D, U, Basics>;
    alternatives: Course<R, D, U, Alternatives>;
    goals: Course<R, D, U, Goals>;
    constructor(domain: D, usecase: U, scenario: ScenarioConstructor<R, D, U>);
}
export type UsecaseSelector<R extends DomainRequirements, D extends keyof R> = {
    [U in keyof R[D]]: (scenario: new (usecase: U, context: Context<R[D][U]["scenes"]>) => R[D][U]["scenario"]) => CourseSelector<R, D, U>;
};
export declare const UsecaseSelector: new <R extends DomainRequirements, D extends keyof R>(domain: D) => UsecaseSelector<R, D>;
export type UsecaseSelectorOverDomain<R extends DomainRequirements> = {
    [D in keyof R]: UsecaseSelector<R, D>;
};
export declare const UsecaseSelectorOverDomain: new <R extends DomainRequirements>() => UsecaseSelectorOverDomain<R>;
export declare class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string);
}
export {};
//# sourceMappingURL=usecase.d.ts.map