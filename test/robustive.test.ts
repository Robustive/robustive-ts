import { describe, expect, it } from "vitest";
import { Robustive } from "../src/index.js";
import { FailingScenario, Requirements, requirements, SignInScenario } from "./fixtures.js";

const U = new Robustive<Requirements>(requirements);

describe("Robustive", () => {
    it("keys からドメイン名を引ける", () => {
        expect(U.keys.authentication).toBe("authentication");
    });

    it("UsecaseSelector の keys からユースケース名を引ける", () => {
        expect(U.authentication.keys.signIn).toBe("signIn");
        expect(U.authentication.keys.failing).toBe("failing");
    });

    it("CourseSelector の keys からシーン名を引ける", () => {
        expect(U.authentication.signIn.keys.basics.userInputs).toBe("userInputs");
        expect(U.authentication.signIn.keys.goals.success).toBe("success");
    });

    it("生成した Usecase はドメイン・ユースケース・コース・シーンを持つ", () => {
        const usecase = U.authentication.signIn.basics.userInputs({ id: "alice" });

        expect(usecase.domain).toBe("authentication");
        expect(usecase.name).toBe("signIn");
        expect(usecase.course).toBe("basics");
        expect(usecase.scene).toBe("userInputs");
    });

    it("id を明示的に渡せる。省略時は8文字が生成される", () => {
        const withId = U.authentication.signIn.basics.userInputs({ id: "alice" }, "fixed-id");
        const generated = U.authentication.signIn.basics.userInputs({ id: "alice" });

        expect(withId.id).toBe("fixed-id");
        expect(generated.id).toHaveLength(8);
        expect(generated.id).not.toBe(U.authentication.signIn.basics.userInputs({ id: "alice" }).id);
    });
});

describe("typeGuards", () => {
    it("対応するドメイン・ユースケースの Scenario を受け入れる", () => {
        const scenario = new SignInScenario("authentication", "signIn", "id");

        expect(U.typeGuards.authentication.signIn(scenario)).toBe(true);
    });

    it("コンストラクタが同じでもドメイン・ユースケースが違えば拒否する", () => {
        const scenario = new SignInScenario("authentication", "signIn", "id");

        expect(U.typeGuards.authentication.failing(scenario)).toBe(false);
    });

    it("別のクラスの Scenario を拒否する", () => {
        const failing = new FailingScenario("authentication", "failing", "id");

        expect(U.typeGuards.authentication.signIn(failing)).toBe(false);
    });

    it("基底クラスのインスタンスはサブクラスの型ガードを通らない", () => {
        // AuthorizedSignInScenario は SignInScenario を継承しているが、逆は成り立たない。
        // domain と usecase が一致していても instanceof で弾かれる
        const scenario = new SignInScenario("authentication", "authorizedSignIn", "id");

        expect(U.typeGuards.authentication.authorizedSignIn(scenario)).toBe(false);
    });
});
