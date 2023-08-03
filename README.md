# Robustive-ts

Robustive-ts is Reactive and OBjective USecase Transactor for TypeScript.
It provides a way to implement usecases described as the robustness diagram as codes.

# Get started

## Install

```shell
$ yarn add robustive-ts
```

## Describe Usecases as codes.

Describe the usecase with robustness analysis as codes like below.

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

Describe the entities you need in each scene of the usecase.

```typescript
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

In the end, describe all usecases and declare definitions like this.

```typescript
// This should be extends UsecaseDefinitions.
type MyUsecaseDefinitions = {
    boot : { scenes: BootScenes; scenario: BootScenario; };
    signIn : { scenes: SignInScenes; scenario: SignInScenario; };
    signUp : { scenes: SignUpScenes; scenario: SignUpScenario; };
    signOut : { scenes: SignOutScenes; scenario: SignOutScenario; };
    ...
};

const usecases = new UsecaseSelector<MyUsecaseDefinitions>();
```

```typescript
import { catchError, map, Observable } from "rxjs";

class SignInScenario extends BaseScenario<SignInScenes> {

    authorize<User, A extends IActor<User>>(actor: A, usecase: keyof MyUsecaseDefinitions): boolean {
        // TODO
        return true;
    }

    next(to: MutableContext<SignInScenes>): Observable<Context<SignInScenes>> {
        switch (to.scene) {
        case SignIn.basics.userStartsSignInProcess: {
            return this.just(this.basics[SignIn.basics.serviceValidateInputs]({ id: to.id, password: to.password }));
        }
        case SignIn.basics.serviceValidateInputs: {
            return this.validate(to.id, to.password);
        }
        case SignIn.basics.onSuccessInValidatingThenServiceTrySigningIn: {
            return this.signIn(to.id, to.password);
        }
        default: {
            throw new Error(`not implemented: ${ to.scene }`);
        }
        }
    }
    
    private validate(id: string | null, password: string | null): Observable<Context<SignInScenes>> {
        // TODO: Implement UserModel so that it can validate id and password.
        const result = User.validate(id, password);
        if (result === true && id !== null && password != null) {
            return this.just(this.basics[SignIn.basics.onSuccessInValidatingThenServiceTrySigningIn]({ id, password }));
        } else {
            return this.just(this.goals[SignIn.goals.onFailureInValidatingThenServicePresentsError]({ result }));
        }
    }

    private signIn(id: string, password: string): Observable<Context<SignInScenes>> {
        // TODO: Implement UserModel so that a user can sign in with id and password.
        return User.signIn(id, password)
            .pipe(
                map(userProperties => this.goals[SignIn.goals.onSuccessInSigningInThenServicePresentsHomeView]({ user: userProperties }))
                , catchError((error: Error) => this.just(this.goals[SignIn.goals.onFailureInSigningInThenServicePresentsError]({ error })))
            );
    }
}
```

item      | kind      | description
----------|-----------|--------------------------------------------------------
authorize | method    | a method to check if the actor can perform the usecase.
just      | method    | use when performing the next scene.
next      | method    | a definitions of scenario branch.


## Perform a Usecase

Describe application behaviors.

```typescript
const signIn = (usecase: Usecase<MyUsecaseDefinitions, "signIn">, actor: Actor) => {
    let subscription: Subscription|null = null;
    subscription = usecase
        .interactedBy(actor, {
            next: (performedScenario) => {
                next: ([lastSceneContext]) => {
                    switch(lastSceneContext.scene){
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
                }
                , complete: () => {
                    subscription?.unsubscribe();
                }
        });
}
```

## Start performing a Usecase

```typescript
const usecases = new UsecaseSelector<MyUsecaseDefinitions>();

const usecase = usecases
                    .signIn(SignInScenario)
                    .basics[Nobody.signIn.basics.userStartsSignInProcess]({ 
                        id: state.email
                        , password: state.password 
                    });

signIn(usecase, new Nobody());
```