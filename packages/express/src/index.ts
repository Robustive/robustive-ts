import {
    Scenario,
    UsecaseImple,
    Context,
    Scenes,
    IActor,
    InferScenes,
    DomainRequirements,
    NOCARE,
    Empty,
    SwiftEnum,
    SwiftEnumCases,
    ActorNotAuthorizedToInteractIn
} from "robustive-ts";
import { Request, Response } from "express";
import { AsyncLocalStorage } from "node:async_hooks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Self = any;

type ResponseStatusContext = {
    normal: { statusCode: number; }
    responded: Empty
}

export const ResponseStatus = new SwiftEnum<ResponseStatusContext>();
export type ResponseStatus = SwiftEnumCases<ResponseStatusContext>;

export type ResponseContext<Z extends Scenes> = Context<Z> & { status?: ResponseStatus };

declare module "robustive-ts" {
    interface IScenarioDelegate<Z extends Scenes> {
        proceedUntilResponse?<A extends IActor<NOCARE>, S extends Scenario<Z>>(req: Request, res: Response, to: Context<Z>, actor: A, scenario: S): Promise<ResponseContext<Z>>;
        /**
         * When set, it will be executed after exiting the recursive handleRequest. Please use this to ensure that no cleanup or finalization steps within the use case are missed.
         */
        gracefullyComplete?(where: string): Promise<void>;
    }

    interface Scenario<Z extends Scenes> {
        proceedUntilResponse<A extends IActor<NOCARE>>(req: Request, res: Response, to: Context<Z>, actor: A): Promise<ResponseContext<Z>>;
        respond(next: Context<Z>, status?: ResponseStatus): Promise<ResponseContext<Z>>;
    }

    interface UsecaseImple<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
        handleRequest<User, A extends IActor<User>>(req: Request, res: Response, actor: A): Promise<ResponseContext<InferScenes<R, D, U>>>;
    }
}

Scenario.prototype.proceedUntilResponse = function <Z extends Scenes, A extends IActor<NOCARE>>(
    this: Scenario<Z>,
    req: Request,
    res: Response,
    to: Context<Z>,
    actor: A
): Promise<ResponseContext<Z>> {
    if (this.delegate !== undefined && this.delegate.proceedUntilResponse !== undefined) {
        return this.delegate.proceedUntilResponse(req, res, to, actor, this);
    }
    return Promise.reject(new Error());
};

Scenario.prototype.respond = function <Z extends Scenes>(
    this: Scenario<Z>,
    next: Context<Z>,
    status: ResponseStatus = ResponseStatus.normal({ statusCode: 200 })
): Promise<ResponseContext<Z>> {
    return Promise.resolve({ ...next, status });
};

/**
 * By passing an AsyncLocalStorage instance and an initial value to the als and defaultContext arguments, the values stored in AsyncLocalStorage become available as the execution context during the use case.
 */
UsecaseImple.prototype.handleRequest = function <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], User, A extends IActor<User>, T extends object>(
    this: UsecaseImple<R, D, U>,
    req: Request,
    res: Response,
    actor: A,
    als?: AsyncLocalStorage<T>,
    defaultContext?: T
): Promise<ResponseContext<InferScenes<R, D, U>>> {
    const self = this as Self;
    const recursive = (req: Request, res: Response, scenario: ResponseContext<InferScenes<R, D, U>>[]): Promise<ResponseContext<InferScenes<R, D, U>>> => {
        const lastScene = scenario.slice(-1)[0];
        if (lastScene.course === "goals" || lastScene.status) { // exit criteria
            return Promise.resolve(lastScene);
        }

        return self._scenario.proceedUntilResponse(req, res, lastScene, actor)
            .then((nextScene: ResponseContext<InferScenes<R, D, U>>) => {
                self.currentContext = nextScene;
                scenario.push(nextScene);
                return recursive(req, res, scenario);
            });
    };

    if (self._scenario.authorize && !self._scenario.authorize(actor, self._domain as Extract<D, string>, self._usecase as Extract<U, string>)) {
        const err = new ActorNotAuthorizedToInteractIn(actor, self._domain, self._usecase);
        return Promise.reject(err);
    }

    const scenario: ResponseContext<InferScenes<R, D, U>>[] = [self.currentContext as ResponseContext<InferScenes<R, D, U>>];

    if (als) {
        return als.run(defaultContext ?? {} as T, async () => {
            try {
                return await recursive(req, res, scenario);
            } finally {
                await self._scenario.delegate?.gracefullyComplete?.("handleRequest.finally");
            }
        });
    } else {
        return recursive(req, res, scenario);
    }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;