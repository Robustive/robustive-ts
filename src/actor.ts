export interface IActor<User> {
    user: User|null;
}

export type UserType<T> = T extends IActor<infer U> ? U : never;

export abstract class BaseActor<User> implements IActor<User> {
    user: User|null;
    constructor(user: User|null = null) {
        this.user = user;
    }
}

export class Nobody extends BaseActor<null> {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNobody = (actor: any): actor is Nobody => actor.constructor === Nobody;

export type Actor<T> = BaseActor<UserType<T>>;