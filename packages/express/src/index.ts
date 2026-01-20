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
    ActorNotAuthorizedToInteractIn,
} from "@robustive/robustive-ts";
import { Request, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Self = any;

type ResponseStatusContext = {
    normal: { statusCode: number; }
    responded: Empty
}

export const ResponseStatus = new SwiftEnum<ResponseStatusContext>();
export type ResponseStatus = SwiftEnumCases<ResponseStatusContext>;

export type ResponseContext<Z extends Scenes> = Context<Z> & { status?: ResponseStatus };

declare module "@robustive/robustive-ts" {
    interface IScenarioDelegate<Z extends Scenes> {
        proceedUntilResponse?<A extends IActor<NOCARE>, S extends Scenario<Z>>(req: Request, res: Response, to: Context<Z>, actor: A, scenario: S): Promise<ResponseContext<Z>>;
    }

    interface Scenario<Z extends Scenes> {
        proceedUntilResponse<A extends IActor<NOCARE>>(req: Request, res: Response, to: Context<Z>, actor: A): Promise<ResponseContext<Z>>;
        respond(next: Context<Z>, status?: ResponseStatus): Promise<ResponseContext<Z>>;
    }

    interface UsecaseImple<R extends DomainRequirements, D extends keyof R, U extends keyof R[D]> {
        handleRequest<User, A extends IActor<User>>(req: Request, res: Response, actor: A, recursiveWrapper?: (recursive: () => Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>) => Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>): Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>;
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

export const HandleResultType = {
    success: "success"
    , failure: "failure"
} as const;

type HandleResultContext<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes> = {
    [HandleResultType.success] : {
        id: string;
        actor : A;
        domain : D;
        usecase : U;
        startAt : Date;
        endAt : Date;
        elapsedTimeMs : number;
        performedScenario : ResponseContext<Z>[];
        lastSceneContext : ResponseContext<Z>;
    };
    [HandleResultType.failure] : {
        id: string;
        actor : A;
        domain : D;
        usecase : U;
        startAt : Date;
        endAt : Date;
        elapsedTimeMs : number;
        performedScenario : ResponseContext<Z>[];
        failedSceneContext : ResponseContext<Z>;
        error: Error;
    };
};

type HandleResultCase<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes, K extends keyof HandleResultContext<R, D, U, A, Z>> = Record<"type", K> & HandleResultContext<R, D, U, A, Z>[K];

export type HandleResult<R extends DomainRequirements, D extends keyof R, U extends keyof R[D], A extends IActor<NOCARE>, Z extends Scenes> = { 
    [K in keyof HandleResultContext<R, D, U, A, Z>] : HandleResultCase<R, D, U, A, Z, K>;
}[keyof HandleResultContext<R, D, U, A, Z>];

/**
 * @param recursiveWrapper An optional function to wrap the recursive calls. Useful for integrating with async context tracking.
 */
UsecaseImple.prototype.handleRequest = function <R extends DomainRequirements, D extends keyof R, U extends keyof R[D], User, A extends IActor<User>, T extends object>(
    this: UsecaseImple<R, D, U>,
    req: Request,
    res: Response,
    actor: A,
    recursiveWrapper?: (recursive: () => Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>) => Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>>
): Promise<HandleResult<R, D, U, A, InferScenes<R, D, U>>> {
    const self = this as Self;
    const startAt = new Date();
    const recursive = (req: Request, res: Response, scenario: ResponseContext<InferScenes<R, D, U>>[]): Promise<ResponseContext<InferScenes<R, D, U>>[]> => {
        const lastScene = scenario.slice(-1)[0];
        if (lastScene.course === "goals" || lastScene.status) { // exit criteria
            return Promise.resolve(scenario);
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

    const execRecursion = () => recursive(req, res, scenario)
        .then((performedScenario) => {
            const endAt = new Date();
            const elapsedTimeMs = (endAt.getTime() - startAt.getTime());
            const lastSceneContext = performedScenario.slice(-1)[0];
            return {
                type: HandleResultType.success
                , id: self.id
                , actor
                , domain: self._domain
                , usecase : self._usecase
                , startAt
                , endAt
                , elapsedTimeMs
                , performedScenario
                , lastSceneContext
            } as HandleResultCase<R, D, U, A, InferScenes<R, D, U>, "success">;
        })
        .catch((error: Error) => {
            const endAt = new Date();
            const elapsedTimeMs = (endAt.getTime() - startAt.getTime());
            const lastSceneContext = scenario.slice(-1)[0];
            return {
                type: HandleResultType.failure
                , id: self.id
                , actor
                , domain: self._domain
                , usecase : self._usecase
                , startAt
                , endAt
                , elapsedTimeMs
                , performedScenario : scenario
                , failedSceneContext : lastSceneContext
                , error
            } as HandleResultCase<R, D, U, A, InferScenes<R, D, U>, "failure">;
        });

    if (recursiveWrapper) {
        return recursiveWrapper(execRecursion);
    } else {
        return execRecursion();
    }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;