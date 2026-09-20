import { describe, expectTypeOf, it } from "vitest";
import { Context, ContextOf, Empty, InferDirective, InferScenes, Usecase } from "../src/index.js";
import { Requirements, SignInScenes, SuspendDirective } from "./fixtures.js";

type C = Context<SignInScenes>;

describe("Context の平坦化", () => {
    it("scene で絞り込むと、そのシーンの associated values が見える", () => {
        type UserInputs = Extract<C, { scene: "userInputs" }>;

        expectTypeOf<UserInputs["id"]>().toEqualTypeOf<string>();
        expectTypeOf<UserInputs["course"]>().toEqualTypeOf<"basics">();
    });

    it("goals のシーンも同じ形で引ける", () => {
        type Invalid = Extract<C, { scene: "invalid" }>;

        expectTypeOf<Invalid["reason"]>().toEqualTypeOf<string>();
        expectTypeOf<Invalid["course"]>().toEqualTypeOf<"goals">();
    });

    it("コースが違えば同じシーン名を共存させられる（Flatten が course.scene で展開する）", () => {
        type Confirm = Extract<C, { scene: "confirm" }>;

        expectTypeOf<Confirm["course"]>().toEqualTypeOf<"basics" | "goals">();
    });

    it("alternatives が Empty のとき、そのコースのメンバーは生まれない", () => {
        type Alternatives = Extract<C, { course: "alternatives" }>;

        expectTypeOf<Alternatives>().toEqualTypeOf<never>();
    });

    it("定義していないシーン名では絞り込めない", () => {
        type Unknown = Extract<C, { scene: "notDefined" }>;

        expectTypeOf<Unknown>().toEqualTypeOf<never>();
    });

    it("directive は既定で null 型", () => {
        type UserInputs = Extract<C, { scene: "userInputs" }>;

        expectTypeOf<UserInputs["directive"]>().toEqualTypeOf<null | undefined>();
    });

    it("Directive を指定すると directive の型が変わる", () => {
        type D = Context<SignInScenes, SuspendDirective>;
        type UserInputs = Extract<D, { scene: "userInputs" }>;

        expectTypeOf<UserInputs["directive"]>().toEqualTypeOf<SuspendDirective | undefined>();
    });
});

describe("ContextOf", () => {
    it("指定したコースのシーンだけを返す", () => {
        type Goals = ContextOf<SignInScenes, "goals">;

        expectTypeOf<Goals["scene"]>().toEqualTypeOf<"success" | "invalid" | "confirm">();
    });

    it("basics のシーン名は goals とは別集合になる", () => {
        type Basics = ContextOf<SignInScenes, "basics">;

        expectTypeOf<Basics["scene"]>().toEqualTypeOf<"userInputs" | "validate" | "confirm">();
    });
});

describe("要求定義からの推論", () => {
    it("InferScenes が Scenario の Scenes を取り出す", () => {
        expectTypeOf<InferScenes<Requirements, "authentication", "signIn">>().toEqualTypeOf<SignInScenes>();
    });

    it("InferDirective が既定では null になる", () => {
        expectTypeOf<InferDirective<Requirements, "authentication", "signIn">>().toEqualTypeOf<null>();
    });

    it("InferDirective が宣言した Directive を取り出す", () => {
        expectTypeOf<InferDirective<Requirements, "authentication", "suspendable">>().toEqualTypeOf<SuspendDirective>();
    });

    it("Usecase は domain と name を型として保持する", () => {
        type SignIn = Usecase<Requirements, "authentication", "signIn">;

        expectTypeOf<SignIn["domain"]>().toEqualTypeOf<"authentication">();
        expectTypeOf<SignIn["name"]>().toEqualTypeOf<"signIn">();
    });
});

describe("Empty", () => {
    it("値を持たないシーンは associated values を要求しない", () => {
        type EmptyScenes = {
            basics: { start: Empty };
            alternatives: Empty;
            goals: { done: Empty };
        };
        type Start = Extract<Context<EmptyScenes>, { scene: "start" }>;

        expectTypeOf<Start>().toEqualTypeOf<{ scene: "start"; course: "basics"; directive?: null }>();
    });
});
