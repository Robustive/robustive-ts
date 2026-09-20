import { DomainRequirements } from "./usecase";

export interface IActor<User> {
    user: User | null;
    /**
     * Determine if the actor is authorized to perform a usecase in a domain
     * @param domain 
     * @param usecase 
     * @returns 
     */
    isAuthorizedTo?<R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]): boolean

    /**
     * Determine if the actor can access a page
     * @param pageId 
     * @returns 
     */
    canAccessPage?(pageId: string): boolean
}

export abstract class AbstractActor<User> implements IActor<User> {
    user: User | null;
    constructor(user: User | null = null) {
        this.user = user;
    }

    abstract isAuthorizedTo?<R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]): boolean;
}