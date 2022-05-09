import { Observable, of, throwError } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { Actor, BaseActor, isAnyone } from "./actor";

export type Boundary = null;
export const boundary: Boundary = null;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Empty = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UsecaseScenario<T extends Record<keyof any, Empty>> = {
    [K in keyof T]: Record<"scene", K> & T[K];
  }[keyof T];

export interface IUsecase<Context> {
    context: Context;
    next(): Observable<this>|Boundary;
    authorize<T extends Actor<T>>(actor: T): boolean;
    interactedBy<T extends Actor<T>>(actor: T, from: Context|null): Observable<Context[]>
}

export abstract class Usecase<Context> implements IUsecase<Context> {
    context: Context;
    abstract next(): Observable<this>|Boundary;

    constructor(initialContext: Context) {
        this.context = initialContext;
    }

    protected instantiate(nextContext: Context): this {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (this.constructor as any)(nextContext);
    }

    just(nextContext: Context): Observable<this> {
        return of(this.instantiate(nextContext));
    }

    authorize<T extends Actor<T>>(actor: T): boolean {
        throw new AuthorizingIsNotDefinedForThisActor(this, actor);
    }

    interactedBy<T extends Actor<T>>(actor: T, from: Context|null = null): Observable<Context[]> {

        const recursive = (scenario: this[]): Observable<this[]> => {
            const lastScene = scenario.slice(-1)[0];
            const observable = lastScene.next();

            if (!observable) {
                return of(scenario);
            }

            return observable
                .pipe(
                    mergeMap((nextContext: this) => {
                        scenario.push(nextContext);
                        return recursive(scenario);
                    })
                );
        };

        if (!this.authorize(actor)) {
            const err = new UserNotAuthorizedToInteractIn(this.constructor.name);
            return throwError(() => err);
        }
        const scenario: this[] = [];

        if (from !== null) {
            scenario.push(this.instantiate(from));
        } else {
            scenario.push(this);
        }

        return recursive(scenario)
            .pipe(
                map((scenes: this[]) => {
                    const performedScenario = scenes.map(scene => scene.context);
                    return performedScenario;
                })
            );
    }
}

export class UserNotAuthorizedToInteractIn extends Error {
    constructor(message: string) {
        super(`User not authorized to interact in ${ message }`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AuthorizingIsNotDefinedForThisActor<Context, T extends Usecase<Context>, User, U extends BaseActor<User>> extends Error {
    constructor(usecase: T, actor: U) {
        super(`Authorizing ${ actor.constructor.name } to ${ usecase.constructor.name } is not defined. Please override authorize() at ${ usecase.constructor.name }.`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}