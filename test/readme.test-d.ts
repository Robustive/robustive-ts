/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * README.md の "How to use" に載せているコード例と同じもの。
 * README の例が現行 API でコンパイルできることを保つために置いてある。
 * 片方を直したらもう片方も直すこと（→ docs/TASK-TREE.md T-2）。
 */
import { describe, expectTypeOf, it } from "vitest";
import {
    AbstractActor
    , Context
    , Empty
    , InteractResultType
    , Robustive
    , Scenario
    , SwiftEnum
    , SwiftEnumCases
    , Usecase
} from "../src/index.js";

// ---- 1. Describe scenes ----
const SignIn = {
    basics: {
        userStartsSignInProcess: "userStartsSignInProcess"
        , serviceValidatesInputs: "serviceValidatesInputs"
        , serviceTriesSigningIn: "serviceTriesSigningIn"
    }
    , goals: {
        servicePresentsHomeView: "servicePresentsHomeView"
        , servicePresentsValidationError: "servicePresentsValidationError"
        , servicePresentsSignInError: "servicePresentsSignInError"
    }
} as const;

type UserProperties = { id: string };

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

// ---- 2. Define a scenario ----
declare const User: {
    validate(id: string | null, password: string | null): string | null;
    signIn(id: string, password: string): Promise<UserProperties>;
};

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

            , authorize: (actor) => actor.user === null
        };
    }

    private validate(id: string | null, password: string | null): Promise<Context<SignInScenes>> {
        const reason = User.validate(id, password);
        return (reason === null && id !== null && password !== null)
            ? this.just(this.basics.serviceTriesSigningIn({ id, password }))
            : this.just(this.goals.servicePresentsValidationError({ reason: reason ?? "unknown" }));
    }

    private signIn(id: string, password: string): Promise<Context<SignInScenes>> {
        return User.signIn(id, password)
            .then(user => this.just(this.goals.servicePresentsHomeView({ user })))
            .catch((error: Error) => this.just(this.goals.servicePresentsSignInError({ error })));
    }
}

// ---- 3. Declare requirements ----
const requirements = {
    authentication: {
        signIn: SignInScenario
    }
};

type Requirements = typeof requirements;
const U = new Robustive<Requirements>(requirements);

// ---- 4. Define an actor ----
class Nobody extends AbstractActor<UserProperties> {
    isAuthorizedTo(): boolean {
        return true;
    }
}

// ---- 5. Perform a usecase ----
const signIn = (usecase: Usecase<Requirements, "authentication", "signIn">, actor: Nobody): Promise<void> => {
    return usecase
        .interactedBy(actor)
        .then(result => {
            if (result.type !== InteractResultType.success) {
                console.error(result.error);
                return;
            }

            const context = result.lastSceneContext;

            switch (context.scene) {
            case SignIn.goals.servicePresentsHomeView:
                console.log(context.user.id);
                break;

            case SignIn.goals.servicePresentsValidationError:
                console.log(context.reason);
                break;

            case SignIn.goals.servicePresentsSignInError:
                console.log(context.error.message);
                break;
            }
        });
};

const usecase = U.authentication.signIn.basics.userStartsSignInProcess({ id: "alice", password: "pw" });
void signIn(usecase, new Nobody());

// ---- 6. typeGuards ----
declare const someScenario: Scenario<never, never>;
if (U.typeGuards.authentication.signIn(someScenario)) {
    void someScenario;
}

// ---- 7. SwiftEnum ----
type ValidationResult = {
    valid: Empty;
    invalid: { reason: string };
};

const ValidationResult = new SwiftEnum<ValidationResult, { describe: () => string }>(
    (c) => ({ describe: () => (c.case === "invalid" ? c.reason : "valid") })
);

const r: SwiftEnumCases<ValidationResult, { describe: () => string }> = ValidationResult.invalid({ reason: "empty id" });
console.log(r.case, r.describe());

// ---- 8. Directive ----
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

// ---- 9. recursiveWrapper ----
declare function beginTransaction(): void;
declare function commit(): void;

const runInTransaction = (uc: Usecase<Requirements, "authentication", "signIn">, actor: Nobody) =>
    uc.interactedBy(actor, async (recursive) => {
        beginTransaction();
        const r = await recursive();
        commit();
        return r;
    });

// ---- 10. ブラケット記法でのシーン指定（README の "Start performing a Usecase"） ----
declare const state: { email: string; password: string };

const usecaseByBracket = U.authentication
    .signIn
    .basics[SignIn.basics.userStartsSignInProcess]({
        id: state.email
        , password: state.password
    });

// ---- 11. Utils を渡さない SwiftEnum ----
const PlainValidationResult = new SwiftEnum<ValidationResult>();
const plain = PlainValidationResult.invalid({ reason: "empty id" });

describe("README の例", () => {
    it("現行 API のままコンパイルできる", () => {
        // このファイル全体が型検査を通ること自体が検証にあたる。
        expectTypeOf(usecase).toExtend<Usecase<Requirements, "authentication", "signIn">>();
        expectTypeOf(ValidationResult.invalid({ reason: "x" }).describe()).toEqualTypeOf<string>();
        expectTypeOf(usecaseByBracket).toExtend<Usecase<Requirements, "authentication", "signIn">>();
        expectTypeOf(plain.case).toEqualTypeOf<"invalid">();
        expectTypeOf(plain.reason).toEqualTypeOf<string>();
        expectTypeOf(PlainValidationResult.keys.invalid).toEqualTypeOf<"invalid">();
    });
});
