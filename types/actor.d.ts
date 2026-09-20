import { DomainRequirements } from "./usecase";
export interface IActor<User> {
    user: User | null;
    isAuthorizedTo?<R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]): boolean;
    canAccessPage?(pageId: string): boolean;
}
export declare abstract class AbstractActor<User> implements IActor<User> {
    user: User | null;
    constructor(user?: User | null);
    abstract isAuthorizedTo?<R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]): boolean;
}
//# sourceMappingURL=actor.d.ts.map