# Robustive-ts

Robustive-ts is Reactive and OBjective USecase Transactor for TypeScript.

Robustive framework is a framework for (1) expressing the use-case scenario shown in the robustness diagram in codes, and (2) executing them (behaving itself) according to the scenario.

# Get started

## Install

```shell
$ yarn add robustive-ts
```

## How to use

To use the Robustive framework, define the scenarios shown in the robustness diagram as enumerated types for each scene. A scene is a situation with the content of the behavior and the context in which it takes place.

A scenario is an object that has the method to execute scenes. A scenario can start execution from any scene within the scenario, recursively call the next scene to be executed based on the execution result of the previous scene, and execute scenes until the last scene. Finally it returns executed scenes as an array.

Control Objects in the robustness diagram are the behavior (processing) of the system in each scene, and Entity Objects are the context (states) in that processing.

### Describe Usecases as codes

Define contents of behaviors like below.

```typescript
const SignIn = {
    /* Basic Courses */
    basics: {
        userStartsSignInProcess: "ユーザはサインインを開始する"
        , serviceValidateInputs: "サービスは入力項目に問題がないかを確認する"
        , onSuccessInValidatingThenServiceTrySigningIn: "入力項目に問題がない場合_サービスはサインインを試行する"
    }
    
    /* Alternative Courses */
    // alternatives: { /* nothing on this usecase. */ }

    /* Boundaries */
    , goals: {
        onSuccessInSigningInThenServicePresentsHomeView: "サインインに成功した場合_サービスはホーム画面を表示する"
        , onFailureInValidatingThenServicePresentsError: "入力項目に問題がある場合_サービスはエラーを表示する"
        , onFailureInSigningInThenServicePresentsError: "サインインに失敗した場合_サービスはエラーを表示する"
    }
} as const;
```

Define contexts of behaviors like below.

```typescript
import type { Empty } from "robustive-ts";

/**
 *  This must be extends Scenes. 
 * 
 *  ```
 *  type ContextualValues = Record<string, object>;
 *  type Scenes = {
 *      basics: ContextualValues;
 *      alternatives: ContextualValues;
 *      goals: ContextualValues;
 *  };
 *  ```
 **/ 
type SignInScenes = {
    basics : {
        [SignIn.basics.userStartsSignInProcess]: { id: string | null; password: string | null; };
        [SignIn.basics.serviceValidateInputs]: { id: string | null; password: string | null; };
        [SignIn.basics.onSuccessInValidatingThenServiceTrySigningIn]: { id: string; password: string; };
    };
    alternatives: Empty;
    goals : {
        [SignIn.goals.onSuccessInSigningInThenServicePresentsHomeView]: { user: UserProperties; };
        [SignIn.goals.onFailureInValidatingThenServicePresentsError]: { result: SignInValidationResult; };
        [SignIn.goals.onFailureInSigningInThenServicePresentsError]: { error: Error; };
    };
};
```

Please extend the BaseScenario abstract class and define your Scenario class for each usecase.

If the scene behavior is a process performed by the system, define it as a private function in the Scenario class. If the scene has an Entity Object, use that as arguments.

The return value should be a Promise that returns the Context of the next scene.

```typescript
import { BaseScenario, Context } from "robustive-ts";

class SignInScenario extends BaseScenario<SignInScenes> {

    next(to: MutableContext<SignInScenes>): Promise<Context<SignInScenes>> {
        switch (to.scene) {
        case _u.basics.userStartsSignInProcess: {
            return this.just(this.basics[SignIn.basics.serviceValidateInputs]({ id: to.id, password: to.password }));
        }
        case _u.basics.serviceValidateInputs: {
            return this.validate(to.id, to.password);
        }
        case _u.basics.onSuccessInValidatingThenServiceTrySigningIn: {
            return this.signIn(to.id, to.password);
        }
        default: {
            throw new Error(`not implemented: ${ to.scene }`);
        }
        }
    }

    private validate(id: string | null, password: string | null): Promise<Context<SignInScenes>> {
        // TODO: Implement UserModel so that it can validate id and password.
        const result = User.validate(id, password);
        if (result === true && id !== null && password != null) {
            return this.just(this.basics[SignIn.basics.onSuccessInValidatingThenServiceTrySigningIn]({ id, password }));
        } else {
            return this.just(this.goals[SignIn.goals.onFailureInValidatingThenServicePresentsError]({ result }));
        }
    }

    private signIn(id: string, password: string): Promise<Context<SignInScenes>> {
        // TODO: Implement UserModel so that a user can sign in with id and password.
        return User.signIn(id, password)
            .then(userProperties => {
                return this.just(this.goals[SignIn.goals.onSuccessInSigningInThenServicePresentsHomeView]({ user: userProperties }));
            })
            .catch((error: Error) => {
                return this.just(this.goals[SignIn.goals.onFailureInSigningInThenServicePresentsError]({ error })
            });
    }
}
```

In the end, describe domains and usecases and declare requirements like this.

```typescript
import { Robustive } from "robustive-ts";

/**
 *  This must be implement DomainRequirements.
 * 
 *  ```
 *  type UsecaseScenarios = Record<string, new () => IScenario<any>>;
 *  type DomainRequirements = Record<string,  UsecaseScenarios>;
 *  ```
 **/ 
const requirements = {
    applicationDomain : {
        boot : BootScenario
    }
    , authenticationDomain : {
        signIn : SignInScenario
        , signUp : SignUpScenario
        , signOut : SignOutScenario
    }
    ...
};

type Requirements = typeof requirements;
const U = new Robustive(requirements);
```

item      | kind      | implement   | description
----------|-----------|-------------|---------------------------------------------
just      | method    | implemented | use when performing the next scene.
next      | method    | required    | a definitions of scenario branch.
authorize | method    | optional    | a method to check if the actor can perform the usecase.
complete  | method    | optional    | a termination process when the usecase ends normally or abnormally.


### Perform a Usecase

Describe application behaviors.

```typescript
import { Usecase } from "robustive-ts";

const signIn = (usecase: Usecase<Requirements, "authentication", "signIp">, actor: Actor): Promise<void> => {
    return usecase
        .interactedBy(actor)
        .then(result => {
            if (result.type !== InteractResultType.success) { return; }
            const context = result.lastSceneContext;
            
            switch(context.scene){
            case SignIn.goals.onSuccessThenServicePresentsHomeView:
                // TODO: show home view.
                break;

            case SignIn.goals.onFailureInValidatingThenServicePresentsError: {
                // TODO: show errors.
                break;
            }
            case SignIn.goals.onFailureThenServicePresentsError: {
                // TODO: show errors.
                break;
            }
            }
        });
    });
};
```

### Start performing a Usecase

```typescript
const usecase = U.authenticationDomain
                    .signIn
                    .basics[SignIn.basics.userStartsSignInProcess]({ 
                        id: state.email
                        , password: state.password 
                    });

signIn(usecase, new Nobody());
```