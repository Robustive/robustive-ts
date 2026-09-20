import { AbstractActor, Empty, IScenarioDelegate, Scenario } from "../src/index.js";

/**
 * テスト用のユースケース定義。
 * basics と goals の両方に "confirm" を置いてあるのは、コースが違えば同じシーン名を
 * 共存させられること（Flatten が "course.scene" に展開すること）を検査するため。
 */
export type SignInScenes = {
    basics: {
        userInputs: { id: string };
        validate: { id: string };
        confirm: { id: string };
    };
    alternatives: Empty;
    goals: {
        success: { id: string };
        invalid: { reason: string };
        confirm: { id: string };
    };
};

/** complete が呼ばれた順に InteractResult の type を積む。テストごとに clear すること。 */
export const completionLog: string[] = [];

const allow: IScenarioDelegate<SignInScenes>["authorize"] = () => true;

export class SignInScenario extends Scenario<SignInScenes> {
    constructor(domain: string, usecase: string, id: string) {
        super(domain, usecase, id);
        this.delegate = {
            next: (to) => {
                switch (to.scene) {
                case "userInputs":
                    return this.just(this.basics.validate({ id: to.id }));
                case "validate":
                    return to.id.length > 0
                        ? this.just(this.goals.success({ id: to.id }))
                        : this.just(this.goals.invalid({ reason: "empty id" }));
                default:
                    throw new Error(`not implemented: ${ String(to.scene) }`);
                }
            }
            , authorize: allow
            , complete: (withResult) => { completionLog.push(withResult.type); }
        };
    }
}

/**
 * delegate.authorize を持たないシナリオ。認可を課さずに実行できることを見る
 * （→ docs/SPEC.md D-12）。
 */
export class NoAuthorizeScenario extends Scenario<SignInScenes> {
    constructor(domain: string, usecase: string, id: string) {
        super(domain, usecase, id);
        this.delegate = {
            next: (to) => this.just(this.goals.success({ id: (to as { id: string }).id }))
        };
    }
}

/** user が null のアクターを拒否する。 */
export class AuthorizedSignInScenario extends SignInScenario {
    constructor(domain: string, usecase: string, id: string) {
        super(domain, usecase, id);
        this.delegate = { ...this.delegate, authorize: (actor) => actor.user !== null };
    }
}

/** next が失敗するシナリオ。InteractResult の failure 側を作るために使う。 */
export class FailingScenario extends Scenario<SignInScenes> {
    constructor(domain: string, usecase: string, id: string) {
        super(domain, usecase, id);
        this.delegate = {
            next: () => Promise.reject(new Error("boom"))
            , authorize: allow
            , complete: (withResult) => { completionLog.push(withResult.type); }
        };
    }
}

/** directive で中断させるシナリオ。goals に到達する前に止まることを見る。 */
export type SuspendDirective = "suspend" | null;

export class SuspendableScenario extends Scenario<SignInScenes, SuspendDirective> {
    constructor(domain: string, usecase: string, id: string) {
        super(domain, usecase, id);
        this.delegate = {
            next: (to) => {
                switch (to.scene) {
                case "userInputs":
                    return this.withDirective(this.basics.validate({ id: to.id }), "suspend");
                case "validate":
                    return this.just(this.goals.success({ id: to.id }));
                default:
                    throw new Error(`not implemented: ${ String(to.scene) }`);
                }
            }
            , authorize: () => true
        };
    }
}

export class User extends AbstractActor<{ name: string }> {
    isAuthorizedTo(): boolean {
        return true;
    }
}

export const requirements = {
    authentication: {
        signIn: SignInScenario
        , authorizedSignIn: AuthorizedSignInScenario
        , noAuthorize: NoAuthorizeScenario
        , failing: FailingScenario
        , suspendable: SuspendableScenario
    }
};

export type Requirements = typeof requirements;
