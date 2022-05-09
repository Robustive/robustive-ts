export interface IActor<User> {
    user: User|null;
}

export type UserType<Actor> = Actor extends { user: infer T } ? T : never;

export abstract class BaseActor<User> implements IActor<User> {
    user: User|null;
    constructor(user: User|null = null) {
        this.user = user;
    }
}

export class Anyone extends BaseActor<null> {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAnyone = (actor: any): actor is Anyone => actor.constructor === Anyone;

export type Actor<T> = BaseActor<UserType<T>>;