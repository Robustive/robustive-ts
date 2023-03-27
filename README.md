# Robustive-ts

Robustive-ts is Reactive and OBjective USecase Transactor for TypeScript.
It provides a way to implement usecases described as the robustness diagram as codes.

# Get started

## Install

```shell
$ yarn add robustive-ts
```

## Describe Usecases as codes.

```typescript
export const SignIn = {
    /* Basic Courses */
    userStartsSignInProcess : "ユーザはサインインを開始する"
    , serviceValidateInputs : "サービスは入力項目に問題がないかを確認する"
    , onSuccessInValidatingThenServiceTrySigningIn : "入力項目に問題がない場合_サービスはサインインを試行する"

    /* Alternative Courses */
    // nothing

    /* Boundaries */
    , goals : {
        onSuccessInSigningInThenServicePresentsHomeView : "サインインに成功した場合_サービスはホーム画面を表示する"
        , onFailureInValidatingThenServicePresentsError : "入力項目に問題がある場合_サービスはエラーを表示する"
        , onFailureInSigningInThenServicePresentsError : "サインインに失敗した場合_サービスはエラーを表示する"
    }
} as const;

type SignIn = typeof SignIn[keyof typeof SignIn];
```

```typescript
export type SignInGoal = UsecaseScenario<{
    [SignIn.goals.onSuccessInSigningInThenServicePresentsHomeView] : { user: User; };
    [SignIn.goals.onFailureInValidatingThenServicePresentsError] : { result: SignInValidationResult; };
    [SignIn.goals.onFailureInSigningInThenServicePresentsError] : { error: Error; };
}>;

export type SignInScenario = UsecaseScenario<{
    [SignIn.userStartsSignInProcess] : { id: string|null; password: string|null; };
    [SignIn.serviceValidateInputs] : { id: string|null; password: string|null; };
    [SignIn.onSuccessInValidatingThenServiceTrySigningIn] : { id: string; password: string; };
}> | SignInGoal;
```

```typescript
export type SignInContext = UsecaseContext<SignInScenario>;
```

This is same as below.

```typescript
type SignInScenario = {
     { scene: SignIn.userStartsSignInProces, id: string|null; password: string|null; }
    , { scene: SignIn.serviceValidateInputs, id: string|null; password: string|null; }
    , { scene: SignIn.onSuccessInValidatingThenServiceTrySigningIn, id: string; password: string; }
    , { scene: SignIn.goals.onSuccessInSigningInThenServicePresentsHomeView, user: User; }
    , { scene: SignIn.goals.onFailureInValidatingThenServicePresentsError, result: SignInValidationResult; }
    , { scene: SignIn.goals.onFailureInSigningInThenServicePresentsError, error: Error; }
};
```


```typescript
export class SignInUsecase extends Usecase<SignInScenario> {

    override next(): Observable<this>|Boundary {
        switch (this.context.scene) {
        case SignIn.userStartsSignInProcess: {
            return this.just({ scene: SignIn.serviceValidateInputs, id: this.context.id, password: this.context.password });
        }
        case SignIn.serviceValidateInputs: {
            return this.validate(this.context.id, this.context.password);
        }
        case SignIn.onSuccessInValidatingThenServiceTrySigningIn : {
            return this.signIn(this.context.id, this.context.password);
        }
        case SignIn.onSuccessThenServicePresentsHomeView:
        case SignIn.onFailureInValidatingThenServicePresentsError:
        case SignIn.onFailureThenServicePresentsError: {
            return boundary;
        }
        }
    }

    private validate(id: string|null, password: string|null): Observable<this> {
        const result = UserModel.validate(id, password);
        if (result === true && id !== null && password != null) {
            return this.just({ scene: SignIn.onSuccessInValidatingThenServiceTrySigningIn, id, password });
        } else {
            return this.just({ scene: SignIn.onFailureInValidatingThenServicePresentsError, result });
        }
    }

    private signIn(id: string, password: string): Observable<this> {
        return UserModel
            .signIn(id, password)
            .pipe(
                map(user => {
                    return this.instantiate({ scene: SignIn.onSuccessThenServicePresentsHomeView, user });
                })
                , catchError(error => this.just({ scene: SignIn.onFailureThenServicePresentsError, error }))
            );
    }
}
```

item     | kind      | description
---------|-----------|-------------------------------------
just     | method    | use when performing the next scene.
next     | method    | a definitions of scenario branch.
Boundary | type      | a typealias of null.
boundary | constant  | an alias of null.

## Perform a Usecase

```typescript
const signIn = (id: string|null, password: string|null) => {
    let subscription: Subscription|null = null;
    subscription = new SignInUsecase({ scene: SignIn.userStartsSignInProcess, id, password})
        .interactedBy(new Nobody())
        .subscribe({
            next: (performedScenario) => {
                const lastContext = performedScenario.slice(-1)[0];
                switch(lastContext.scene){
                case SignIn.onSuccessThenServicePresentsHomeView:
                    router.replace("/");
                    break;

                case SignIn.onFailureInValidatingThenServicePresentsError: {
                    if (lastContext.result === true){ return; }
                    const labelMailAddress = t.common.labels.mailAddress;
                    const labelPassword = t.common.labels.password;

                    switch (lastContext.result.id) {
                    case "isRequired":
                        state.idInvalidMessage = t.common.validations.isRequired(labelMailAddress);
                        break;
                    case "isMalformed":
                        state.idInvalidMessage = t.common.validations.isMalformed(labelMailAddress);
                        break;
                    case null:
                        state.idInvalidMessage = null;
                        break;
                    }

                    switch (lastContext.result.password) {
                    case "isRequired":
                        state.passwordInvalidMessage = t.common.validations.isRequired(labelPassword);
                        break;
                    case "isTooShort":
                        state.passwordInvalidMessage = t.common.validations.isTooShort(labelPassword, 8);
                        break;
                    case "isTooLong":
                        state.passwordInvalidMessage = t.common.validations.isTooLong(labelPassword, 20);
                        break;
                    case null:
                        state.passwordInvalidMessage = null;
                        break;
                    }
                    break;
                }
                case SignIn.onFailureThenServicePresentsError: {
                    console.log("SERVICE ERROR:", lastContext.error);
                    break;
                }
                }
            }
            , error: (e) => {
                if (e instanceof ActorNotAuthorizedToInteractIn) {
                    console.error(e);
                } else {
                    console.error(e);
                }
            }
            , complete: () => {
                console.info("complete");
                subscription?.unsubscribe();
            }
        });
}
```