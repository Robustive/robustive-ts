import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        // lint 対象外。生成物と依存はそもそも見ない
        ignores: ["dist/**", "types/**", "node_modules/**"]
    }
    , js.configs.recommended
    , ...tseslint.configs.recommended
    , {
        languageOptions: {
            ecmaVersion: "latest"
            , sourceType: "module"
            // このライブラリはブラウザと Node の双方で動く（→ docs/SPEC.md 1.2）。
            // テストと設定ファイルは Node 側（→ docs/SPEC.md D-13）
            , globals: { ...globals.browser, ...globals.node }
        }
        , plugins: { "@stylistic": stylistic }
        // フォーマット系は eslint 本体から @stylistic へ移してある（→ docs/SPEC.md D-14）
        , rules: {
            "@stylistic/indent": ["error", 4, { SwitchCase: 0 }]
            , "@stylistic/linebreak-style": ["error", "unix"]
            , "@stylistic/quotes": ["error", "double"]
            , "@stylistic/semi": ["error", "always"]
        }
    }
);
