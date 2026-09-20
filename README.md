# Robustive-ts

Robustive-ts is Reactive and OBjective USecase Transactor for TypeScript.

Robustive framework is a framework for (1) expressing the use-case scenario shown in the robustness diagram in codes, and (2) executing them (behaving itself) according to the scenario.

# Get started

## Install

```shell
$ yarn add @robustive/robustive-ts
```

## How to use

To use the Robustive framework, define the scenarios shown in the robustness diagram as enumerated types for each scene. A scene is a situation with the content of the behavior and the context in which it takes place.

A scenario is an object that has the method to execute scenes. A scenario can start execution from any scene within the scenario, recursively call the next scene to be executed based on the execution result of the previous scene, and execute scenes until the last scene. Finally it returns executed scenes as an array.

Control Objects in the robustness diagram are the behavior (processing) of the system in each scene, and Entity Objects are the context (states) in that processing.

Every scene belongs to one of three courses: `basics`, `alternatives` and `goals`. Execution stops when it reaches a scene in `goals`.

### Describe Usecases as codes

Define contents of behaviors like below.

```typescript
const SignIn = {
    /* Basic Courses */
    basics: {
        userStartsSignInProcess: "userStartsSignInProcess"
        , serviceValidatesInputs: "serviceValidatesInputs"
        , serviceTriesSigningIn: "serviceTriesSigningIn"
    }

    /* Alternative Courses */
    // alternatives: { /* nothing on this usecase. */ }

    /* Boundaries */
    , goals: {
        servicePresentsHomeView: "servicePresentsHomeView"
        , servicePresentsValidationError: "servicePresentsValidationError"
        , servicePresentsSignInError: "servicePresentsSignInError"
    }
} as const;
```

Define contexts of behaviors like below.

```typescript
import type { Empty } from "@robustive/robustive-ts";

/**
 *  This must extend Scenes.
 *
 *  ```
 *  type ContextualValues = Record<string, object>;
 *  type Scenes = {
 *      basics: ContextualValues;
 *      alternatives: ContextualValues;
 *      goals: ContextualValues;
 *  };
 *  ```
 *
 *  A course with no scenes is declared as `Empty`.
 **/
type SignInScenes = {
    basics: {
        [SignIn.basics.userStartsSignInProcess]: { id: string | null; password: string | null };
        [SignIn.basics.serviceValidatesInputs]: { id: string | null; password: string | null };
        [SignIn.basics.serviceTriesSigningIn]: { id: string; password: string };
    };
    alternatives: Empty;
    goals: {
        [SignIn.goals.servicePresentsHomeView]: { user: UserProperties };
        [SignIn.goals.servicePresentsValidationError]: { reason: string };
        [SignIn.goals.servicePresentsSignInError]: { error: Error };
    };
};
```

Extend the `Scenario` class for each usecase and give it a delegate. The delegate's `next` decides which scene comes after the current one.

If the scene behavior is a process performed by the system, define it as a private method of the scenario class. If the scene has an Entity Object, use that as arguments.

The return value should be a Promise that returns the Context of the next scene. `this.basics`, `this.alternatives` and `this.goals` build the context of a scene in that course, and `this.just` resolves it as the next scene.

```typescript
import { Context, Scenario } from "@robustive/robustive-ts";

class SignInScenario extends Scenario<SignInScenes> {
    constructor(domain: string, usecase: string, id: string) {
        super(domain, usecase, id);
        this.delegate = {
            next: (to) => {
                switch (to.scene) {
                case SignIn.basics.userStartsSignInProcess:
                    return this.just(this.basics.serviceValidatesInputs({ id: to.id, password: to.password }));

                case SignIn.basics.serviceValidatesInputs:
                    return this.validate(to.id, to.password);

                case SignIn.basics.serviceTriesSigningIn:
                    return this.signIn(to.id, to.password);

                default:
                    throw new Error(`not implemented: ${ String(to.scene) }`);
                }
            }

            // Optional. Without it, anyone may perform this usecase.
            , authorize: (actor) => actor.user === null
        };
    }

    private validate(id: string | null, password: string | null): Promise<Context<SignInScenes>> {
        // TODO: Implement UserModel so that it can validate id and password.
        const reason = User.validate(id, password);
        return (reason === null && id !== null && password !== null)
            ? this.just(this.basics.serviceTriesSigningIn({ id, password }))
            : this.just(this.goals.servicePresentsValidationError({ reason: reason ?? "unknown" }));
    }

    private signIn(id: string, password: string): Promise<Context<SignInScenes>> {
        // TODO: Implement UserModel so that a user can sign in with id and password.
        return User.signIn(id, password)
            .then(user => this.just(this.goals.servicePresentsHomeView({ user })))
            .catch((error: Error) => this.just(this.goals.servicePresentsSignInError({ error })));
    }
}
```

`Scenario` provides these helpers, and `IScenarioDelegate` takes these three methods:

item        | kind     | implement            | description
------------|----------|----------------------|---------------------------------------------
just        | method   | provided             | resolves the given context as the next scene.
withDirective | method | provided             | resolves the next scene with a directive attached, which stops the recursion.
next        | delegate | required             | a definition of the scenario branch.
authorize   | delegate | optional             | decides whether the actor may perform the usecase. A scenario that leaves it out imposes no authorization. Returning `false` rejects with `ActorNotAuthorizedToInteractIn`.
complete    | delegate | optional             | a termination process called when the usecase ends, both normally and abnormally.

In the end, describe domains and usecases and declare requirements like this.

```typescript
import { Robustive } from "@robustive/robustive-ts";

/**
 *  This must satisfy DomainRequirements.
 *
 *  ```
 *  type UsecaseScenarios<D extends string> = {
 *      [U in string]: new (domain: D, usecase: U, id: string) => Scenario<any, any>
 *  };
 *  type DomainRequirements = { [D in string]: UsecaseScenarios<D> };
 *  ```
 **/
const requirements = {
    authentication: {
        signIn: SignInScenario
        // , signUp: SignUpScenario
        // , signOut: SignOutScenario
    }
};

type Requirements = typeof requirements;
const U = new Robustive<Requirements>(requirements);
```

### Perform a Usecase

Describe application behaviors. `interactedBy` runs the scenario to completion and resolves with an `InteractResult`, which is either `success` or `failure`.

```typescript
import { InteractResultType, Usecase } from "@robustive/robustive-ts";

const signIn = (usecase: Usecase<Requirements, "authentication", "signIn">, actor: Nobody): Promise<void> => {
    return usecase
        .interactedBy(actor)
        .then(result => {
            if (result.type !== InteractResultType.success) {
                // result.error, result.failedSceneContext and result.performedScenario are available here.
                console.error(result.error);
                return;
            }

            const context = result.lastSceneContext;

            switch (context.scene) {
            case SignIn.goals.servicePresentsHomeView:
                // TODO: show home view.
                console.log(context.user.id);
                break;

            case SignIn.goals.servicePresentsValidationError:
                // TODO: show errors.
                console.log(context.reason);
                break;

            case SignIn.goals.servicePresentsSignInError:
                // TODO: show errors.
                console.log(context.error.message);
                break;
            }
        });
};
```

A successful result also carries `id`, `actor`, `domain`, `usecase`, `startAt`, `endAt`, `elapsedTimeMs` and `performedScenario` (every context the run went through, in order).

### Start performing a Usecase

An actor implements `IActor`, or extends `AbstractActor`.

```typescript
import { AbstractActor } from "@robustive/robustive-ts";

class Nobody extends AbstractActor<UserProperties> {
    isAuthorizedTo(): boolean {
        return true;
    }
}

const usecase = U.authentication
    .signIn
    .basics[SignIn.basics.userStartsSignInProcess]({
        id: state.email
        , password: state.password
    });

signIn(usecase, new Nobody());
```

To advance one scene at a time instead of running to completion, use `progress`:

```typescript
const next = await usecase.progress(new Nobody());
```

### Stop before a goal: directives

A scenario may declare a directive type as its second type parameter. When `withDirective` attaches a truthy directive to a context, the recursion stops there even though the scene is not in `goals`. This is the way to hand control back to the caller in the middle of a scenario, for example to wait for a confirmation.

```typescript
type SuspendDirective = "suspend" | null;

class SuspendableScenario extends Scenario<SignInScenes, SuspendDirective> {
    constructor(domain: string, usecase: string, id: string) {
        super(domain, usecase, id);
        this.delegate = {
            next: (to) => {
                switch (to.scene) {
                case SignIn.basics.userStartsSignInProcess:
                    return this.withDirective(
                        this.basics.serviceValidatesInputs({ id: to.id, password: to.password })
                        , "suspend"
                    );

                default:
                    throw new Error(`not implemented: ${ String(to.scene) }`);
                }
            }
        };
    }
}
```

Note that the check is truthiness, so `0` and `""` do not stop the recursion.

### Wrap the whole run

`interactedBy` takes an optional wrapper around the entire recursion, which is where a transaction or a spinner belongs.

```typescript
const result = await usecase.interactedBy(actor, async (recursive) => {
    beginTransaction();
    const r = await recursive();
    commit();
    return r;
});
```

### Type guards

`Robustive` generates a type guard per domain and usecase, which narrows a `Scenario` to the one declared in the requirements.

```typescript
if (U.typeGuards.authentication.signIn(scenario)) {
    // scenario is Scenario<SignInScenes, null> here.
}
```

The generated `keys` let you refer to names without repeating string literals: `U.keys.authentication`, `U.authentication.keys.signIn` and `U.authentication.signIn.keys.basics.userStartsSignInProcess`.

### SwiftEnum

`SwiftEnum` builds a Swift-like enum with associated values. Cases are frozen once created.

```typescript
import { SwiftEnum } from "@robustive/robustive-ts";
import type { Empty, SwiftEnumCases } from "@robustive/robustive-ts";

type ValidationResult = {
    valid: Empty;
    invalid: { reason: string };
};

const ValidationResult = new SwiftEnum<ValidationResult>();

const result = ValidationResult.invalid({ reason: "empty id" });
result.case;    // "invalid"
result.reason;  // "empty id"
```

Pass a factory to give every case shared behavior. The case itself is handed in as an explicit argument.

```typescript
const ValidationResult = new SwiftEnum<ValidationResult, { describe: () => string }>(
    (c) => ({ describe: () => (c.case === "invalid" ? c.reason : "valid") })
);

ValidationResult.invalid({ reason: "empty id" }).describe(); // "empty id"
```

`ValidationResult.keys.invalid` yields the case name as a string, the same way scene keys do.
