import { Context, Scenes, IActor, InferScenes, DomainRequirements, NOCARE, Empty, SwiftEnum, SwiftEnumCases } from "robustive-ts";
import { Request, Response } from "express";
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
declare module "robustive-ts" {
    interface IScenarioDelegate<Z extends Scenes> {
        proceedUntilResponse?<A extends IActor<NOCARE>, S extends Scenario<Z>>(req: Request, res: Response, to: Context<Z>, actor: A, scenario: S): Promise<ResponseContext<Z>>;
    }
    interface Scenario<Z extends Scenes> {
        proceedUntilResponse<A extends IActor<NOCARE>>(req: Request, res: Response, to: Context<Z>, actor: A): Promise<ResponseContext<Z>>;
        respond(next: Context<Z>, status?: ResponseStatus): Promise<ResponseContext<Z>>;
    }
    interface UsecaseImple<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
        handleRequest<User, A extends IActor<User>>(req: Request, res: Response, actor: A): Promise<ResponseContext<InferScenes<R, D, U>>>;
    }
}
export {};
