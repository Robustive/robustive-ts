import { DomainRequirements } from "./usecase";

export interface IActor<User> {
    user: User | null;
    isAuthorizedTo?: <R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]) => boolean
}

export abstract class AbstractActor<User> implements IActor<User> {
    user: User | null;
    constructor(user: User | null = null) {
        this.user = user;
    }

    abstract isAuthorizedTo?: <R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]) => boolean
}

export class Nobody extends AbstractActor<null> {
    isAuthorizedTo?: (<R extends DomainRequirements>(domain: keyof R, usecase: keyof R[keyof R]) => boolean) | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNobody = (actor: any): actor is Nobody => actor.constructor === Nobody;
