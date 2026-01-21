import { Context, Scenes, IActor, InferScenes, DomainRequirements, NOCARE, Empty, SwiftEnum, SwiftEnumCases, StringKeyof } from "@robustive/robustive-ts";
import { Request, Response } from "express";
export type Self = any;
type ResponseStatusContext = {
    normal: {
        statusCode: number;
    };
    responded: Empty;
};
export declare const ResponseStatus: SwiftEnum<ResponseStatusContext, Empty>;
export type ResponseStatus = SwiftEnumCases<ResponseStatusContext>;
export type ResponseContext<Z extends Scenes> = Context<Z> & {
    status?: ResponseStatus;
};
declare module "@robustive/robustive-ts" {
    interface IScenarioDelegate<Z extends Scenes> {
        validateHttpMethod?<R extends DomainRequirements, D extends StringKeyof<R>, U extends StringKeyof<R[D]>>(domain: D, usecase: U, method: string): boolean;
        proceedUntilResponse?<A extends IActor<NOCARE>, S extends Scenario<Z>>(req: Request, res: Response, to: Context<Z>, actor: A, scenario: S): Promise<ResponseContext<Z>>;
    }
    interface Scenario<Z extends Scenes> {
        validateHttpMethod<R extends DomainRequirements, D extends StringKeyof<R>, U extends StringKeyof<R[D]>>(domain: D, usecase: U, method: string): boolean;
        proceedUntilResponse<A extends IActor<NOCARE>>(req: Request, res: Response, to: Context<Z>, actor: A): Promise<ResponseContext<Z>>;
        respond(next: Context<Z>, status?: ResponseStatus): Promise<ResponseContext<Z>>;
    }
    interface UsecaseImple<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
        handleRequest<User, A extends IActor<User>>(req: Request, res: Response, actor: A, recursiveWrapper?: (recursive: () => Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>) => Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>): Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>;
    }
}
export declare class HttpMethodIsNotAuthorized<Domain, Usecase> extends Error {
    constructor(domain: Domain, usecase: Usecase, method: string);
}
export declare const HandleResultType: {
    readonly success: "success";
    readonly failure: "failure";
};
type HandleResultContext<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes> = {
    [HandleResultType.success]: {
        id: string;
        actor: A;
        domain: D;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: ResponseContext<Z>[];
        lastSceneContext: ResponseContext<Z>;
    };
    [HandleResultType.failure]: {
        id: string;
        actor: A;
        domain: D;
        usecase: U;
        startAt: Date;
        endAt: Date;
        elapsedTimeMs: number;
        performedScenario: ResponseContext<Z>[];
        failedSceneContext: ResponseContext<Z>;
        error: Error;
    };
};
type HandleResultCase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes, K extends keyof HandleResultContext<R, D, U, A, Z>> = Record<"type", K> & HandleResultContext<R, D, U, A, Z>[K];
export type HandleResult<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes> = {
    [K in keyof HandleResultContext<R, D, U, A, Z>]: HandleResultCase<R, D, U, A, Z, K>;
}[keyof HandleResultContext<R, D, U, A, Z>];
export {};
//# sourceMappingURL=index.d.ts.map