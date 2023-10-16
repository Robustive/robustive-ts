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
export type UsecaseDefinition<Z extends Scenes, S extends IScenario<Z>> = {
    scenes: Z;
    scenario: S;
};
export type UsecaseDefinitions = Record<string, UsecaseDefinition<Scenes, IScenario<Scenes>>>;
type ScenarioConstructor<D extends UsecaseDefinitions, U extends keyof D> = new () => D[U]["scenario"];
export interface IScenario<Z extends Scenes> {
    next(to: MutableContext<Z>): Promise<Context<Z>>;
    just(next: Context<Z>): Promise<Context<Z>>;
    authorize?<A extends IActor<ANY>, D extends UsecaseDefinitions>(actor: A, usecase: keyof D): boolean;
}
export declare const InteractResultType: {
    readonly success: "success";
    readonly failure: "failure";
};
type InteractResultContext<A extends IActor<ANY>, D extends UsecaseDefinitions, U extends keyof D, Z extends Scenes> = {
    [InteractResultType.success]: {
        actor: A;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: Context<Z>[];
        lastSceneContext: MutableContext<Z>;
    };
    [InteractResultType.failure]: {
        actor: A;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        error: Error;
    };
};
type InteractResultCase<A extends IActor<ANY>, D extends UsecaseDefinitions, U extends keyof D, Z extends Scenes, K extends keyof InteractResultContext<A, D, U, Z>> = Record<"type", K> & InteractResultContext<A, D, U, Z>[K];
export type InteractResult<A extends IActor<ANY>, D extends UsecaseDefinitions, U extends keyof D, Z extends Scenes> = {
    [K in keyof InteractResultContext<A, D, U, Z>]: InteractResultCase<A, D, U, Z, K>;
}[keyof InteractResultContext<A, D, U, Z>];
declare class Scene<D extends UsecaseDefinitions, U extends keyof D, Z extends Scenes, S extends IScenario<Z>> {
    #private;
    constructor(usecase: U, context: Context<Z>, scenario: S);
    interactedBy<User, A extends IActor<User>>(actor: A): Promise<InteractResult<A, D, U, Z>>;
}
export type Usecase<D extends UsecaseDefinitions, U extends keyof D> = Record<"name", U> & Scene<D, U, D[U]["scenes"], D[U]["scenario"]>;
export type Usecases<D extends UsecaseDefinitions> = {
    [U in keyof D]: Usecase<D, U>;
}[keyof D];
export type Course<D extends UsecaseDefinitions, U extends keyof D, C extends Courses> = {
    [K in keyof D[U]["scenes"][C]]: D[U]["scenes"][C][K] extends Empty ? () => Usecase<D, U> : (withValues: D[U]["scenes"][C][K]) => Usecase<D, U>;
};
export declare abstract class BaseScenario<Z extends Scenes> implements IScenario<Z> {
    basics: Contexts<this, Basics>;
    alternatives: Contexts<this, Alternatives>;
    goals: Contexts<this, Goals>;
    constructor();
    abstract next(to: MutableContext<Z>): Promise<Context<Z>>;
    just(next: Context<Z>): Promise<Context<Z>>;
}
declare class CourseSelector<D extends UsecaseDefinitions, U extends keyof D> {
    basics: Course<D, U, Basics>;
    alternatives: Course<D, U, Alternatives>;
    goals: Course<D, U, Goals>;
    constructor(usecase: U, scenario: ScenarioConstructor<D, U>);
}
export type UsecaseSelector<D extends UsecaseDefinitions> = {
    [U in keyof D]: (scenario: new (usecase: U, context: Context<D[U]["scenes"]>) => D[U]["scenario"]) => CourseSelector<D, U>;
};
export declare const UsecaseSelector: new <D extends UsecaseDefinitions>() => UsecaseSelector<D>;
export declare class ActorNotAuthorizedToInteractIn extends Error {
    constructor(actor: string, usecase: string);
}
export {};
//# sourceMappingURL=usecase.d.ts.map