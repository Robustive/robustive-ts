import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActorNotAuthorizedToInteractIn, InteractResultType, Robustive } from "../src/index.js";
import { completionLog, NoAuthorizeScenario, Requirements, requirements, User } from "./fixtures.js";

const U = new Robustive<Requirements>(requirements);
const alice = () => new User({ name: "alice" });

beforeEach(() => {
    completionLog.length = 0;
});

describe("interactedBy", () => {
    it("goals に到達するまで再帰し、通った経路をすべて返す", async () => {
        const usecase = U.authentication.signIn.basics.userInputs({ id: "alice" });
        const result = await usecase.interactedBy(alice());

        expect(result.type).toBe(InteractResultType.success);
        if (result.type !== InteractResultType.success) { return; }

        expect(result.performedScenario.map(c => c.scene)).toEqual(["userInputs", "validate", "success"]);
        expect(result.lastSceneContext.course).toBe("goals");
        expect(result.domain).toBe("authentication");
        expect(result.usecase).toBe("signIn");
    });

    it("分岐した先の goals でも終了する", async () => {
        const usecase = U.authentication.signIn.basics.userInputs({ id: "" });
        const result = await usecase.interactedBy(alice());

        expect(result.type).toBe(InteractResultType.success);
        if (result.type !== InteractResultType.success) { return; }

        expect(result.lastSceneContext.scene).toBe("invalid");
    });

    it("truthy な directive が付いた時点で、goals 未到達でも止まる", async () => {
        const usecase = U.authentication.suspendable.basics.userInputs({ id: "alice" });
        const result = await usecase.interactedBy(alice());

        expect(result.type).toBe(InteractResultType.success);
        if (result.type !== InteractResultType.success) { return; }

        expect(result.lastSceneContext.scene).toBe("validate");
        expect(result.lastSceneContext.course).toBe("basics");
        expect(result.lastSceneContext.directive).toBe("suspend");
    });

    it("id と計測値を持つ", async () => {
        const usecase = U.authentication.signIn.basics.userInputs({ id: "alice" });
        const result = await usecase.interactedBy(alice());

        expect(result.id).toHaveLength(8);
        expect(result.startAt).toBeInstanceOf(Date);
        expect(result.endAt).toBeInstanceOf(Date);
        expect(result.elapsedTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("recursiveWrapper を渡すと再帰全体を包める", async () => {
        const order: string[] = [];
        const usecase = U.authentication.signIn.basics.userInputs({ id: "alice" });

        const result = await usecase.interactedBy(alice(), async (recursive) => {
            order.push("before");
            const r = await recursive();
            order.push("after");
            return r;
        });

        expect(order).toEqual(["before", "after"]);
        expect(result.type).toBe(InteractResultType.success);
    });

    it("成功時に complete が呼ばれる", async () => {
        const usecase = U.authentication.signIn.basics.userInputs({ id: "alice" });
        await usecase.interactedBy(alice());

        expect(completionLog).toEqual([InteractResultType.success]);
    });

    describe("next が失敗したとき", () => {
        beforeEach(() => {
            // interactedBy は catch 内で console.error を呼ぶ
            vi.spyOn(console, "error").mockImplementation(() => undefined);
        });

        it("reject ではなく failure の InteractResult を返す", async () => {
            const usecase = U.authentication.failing.basics.userInputs({ id: "alice" });
            const result = await usecase.interactedBy(alice());

            expect(result.type).toBe(InteractResultType.failure);
            if (result.type !== InteractResultType.failure) { return; }

            expect(result.error.message).toBe("boom");
            expect(result.failedSceneContext.scene).toBe("userInputs");
            expect(result.performedScenario).toHaveLength(1);
        });

        it("失敗時にも complete が呼ばれる", async () => {
            const usecase = U.authentication.failing.basics.userInputs({ id: "alice" });
            await usecase.interactedBy(alice());

            expect(completionLog).toEqual([InteractResultType.failure]);
        });
    });
});

describe("authorize", () => {
    it("delegate.authorize が false を返すと ActorNotAuthorizedToInteractIn で reject する", async () => {
        const usecase = U.authentication.authorizedSignIn.basics.userInputs({ id: "alice" });

        await expect(usecase.interactedBy(new User(null))).rejects.toBeInstanceOf(ActorNotAuthorizedToInteractIn);
    });

    it("delegate.authorize が true を返せば通常どおり実行される", async () => {
        const usecase = U.authentication.authorizedSignIn.basics.userInputs({ id: "alice" });
        const result = await usecase.interactedBy(alice());

        expect(result.type).toBe(InteractResultType.success);
    });

    it("delegate.authorize が未実装なら認可を課さず、そのまま実行される", async () => {
        // authorize を書かないシナリオは「誰でも実行できる」とみなす（→ docs/SPEC.md D-12）。
        // 2026-09-20 以前は、ここで同期的に例外が飛んでいた。
        const usecase = U.authentication.noAuthorize.basics.userInputs({ id: "alice" });
        const result = await usecase.interactedBy(alice());

        expect(result.type).toBe(InteractResultType.success);
    });

    it("delegate.authorize が未実装なら progress も通る", async () => {
        const usecase = U.authentication.noAuthorize.basics.userInputs({ id: "alice" });

        await expect(usecase.progress(alice())).resolves.toBeDefined();
    });

    it("Scenario#authorize を直接呼んでも、未実装なら true を返す", () => {
        const scenario = new NoAuthorizeScenario("authentication", "noAuthorize", "id");

        expect(scenario.authorize(alice(), "authentication", "noAuthorize")).toBe(true);
    });
});

describe("progress", () => {
    it("1シーンずつ進み、currentContext が更新される", async () => {
        const usecase = U.authentication.signIn.basics.userInputs({ id: "alice" });
        expect(usecase.currentContext.scene).toBe("userInputs");

        const next = await usecase.progress(alice());

        expect(next.scene).toBe("validate");
        expect(usecase.currentContext.scene).toBe("validate");
    });

    it("凍結されたインスタンスでも currentContext を更新できる", () => {
        const usecase = U.authentication.signIn.basics.userInputs({ id: "alice" });

        expect(Object.isFrozen(usecase)).toBe(true);
        expect(usecase.currentContext.scene).toBe("userInputs");
    });
});
