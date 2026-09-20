import { describe, expect, it } from "vitest";
import { Empty, SwiftEnum } from "../src/index.js";

type LoadState = {
    idle: Empty;
    loading: { progress: number };
    failed: { error: Error };
};

describe("SwiftEnum", () => {
    it("associated values を持たないケースを作れる", () => {
        const State = new SwiftEnum<LoadState>();
        const idle = State.idle();

        expect(idle.case).toBe("idle");
    });

    it("associated values 付きのケースを作れる", () => {
        const State = new SwiftEnum<LoadState>();
        const loading = State.loading({ progress: 0.5 });

        expect(loading.case).toBe("loading");
        expect(loading.progress).toBe(0.5);
    });

    it("生成したケースは凍結される", () => {
        const State = new SwiftEnum<LoadState>();
        const loading = State.loading({ progress: 0.5 });

        expect(Object.isFrozen(loading)).toBe(true);
    });

    it("keys からケース名を文字列として引ける", () => {
        const State = new SwiftEnum<LoadState>();

        expect(State.keys.loading).toBe("loading");
        expect(State.keys.idle).toBe("idle");
    });

    it("Utils ファクトリを渡すと、ケースに振る舞いが載る", () => {
        const State = new SwiftEnum<LoadState, { describe: () => string }>(
            (c) => ({ describe: () => (c.case === "loading" ? `loading ${ c.progress }` : c.case) })
        );

        expect(State.loading({ progress: 0.25 }).describe()).toBe("loading 0.25");
        expect(State.idle().describe()).toBe("idle");
    });

    it("Utils を載せても associated values と case は保たれる", () => {
        const State = new SwiftEnum<LoadState, { describe: () => string }>(
            (c) => ({ describe: () => c.case })
        );
        const failed = State.failed({ error: new Error("boom") });

        expect(failed.case).toBe("failed");
        expect(failed.error.message).toBe("boom");
    });
});
