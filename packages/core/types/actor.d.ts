import { DomainRequirements } from "./usecase";
export interface IActor<User> {
    user: User | null;
    isAuthorizedTo?: <R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]) => boolean;
}
export declare abstract class AbstractActor<User> implements IActor<User> {
    user: User | null;
    constructor(user?: User | null);
    abstract isAuthorizedTo?: <R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]) => boolean;
}
export declare class Nobody extends AbstractActor<null> {
    isAuthorizedTo?: (<R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]) => boolean) | undefined;
}
export declare const isNobody: (actor: any) => actor is Nobody;
//# sourceMappingURL=actor.d.ts.map