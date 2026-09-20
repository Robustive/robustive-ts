import js from "@eslint/js";
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
        , rules: {
            indent: ["error", 4]
            , "linebreak-style": ["error", "unix"]
            , quotes: ["error", "double"]
            , semi: ["error", "always"]
        }
    }
);
