# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# robustive-ts

ロバストネス図のユースケースシナリオを TypeScript の型で表現し、そのとおりに実行するライブラリ。リポジトリルートがそのまま公開パッケージ `@robustive/robustive-ts` の単一構成（→ SPEC D-8）。

## ドキュメント運用

このリポジトリは3つのファイルで状態を管理する。役割を混ぜないこと。

- `docs/SPEC.md` — 仕様と決定の根拠。What と Why。
- `docs/TASK-TREE.md` — 現在地。階層タスクとステータス。
- `CLAUDE.md`（このファイル）— ルールのみ。

守ること:

1. 実装に着手する前に `docs/SPEC.md` の該当節を読む。
2. 仕様が変わったら、コードより先に `docs/SPEC.md` を直す。
3. タスクの状態が変わったら、そのターンのうちに `docs/TASK-TREE.md` を更新する。完了報告と同時に行う。
4. `docs/SPEC.md` に書かれていない判断を迫られたら、実装せずに確認する。推測で埋めない。

## コマンド

```bash
yarn install --immutable       # 依存の導入
yarn build                     # tsc（types/）→ vite（dist/）
yarn build:clean               # dist/ types/ の削除
yarn lint                      # eslint（src / test / vitest.config.ts）
yarn test                      # vitest run --typecheck（ランタイム + 型テスト）
yarn test:watch                # 同上の watch
yarn pack --dry-run            # 公開パッケージに何が入るかの確認
```

単体で走らせるとき: `yarn vitest run test/enum.test.ts`、名前で絞るなら `yarn vitest run -t "directive"`。型テストだけなら `yarn vitest run --typecheck --typecheck.only`。

作業完了を報告する前に、少なくとも `yarn lint`、`yarn test`、`yarn build` を通すこと。

## このプロジェクト固有の注意

- テストは `test/` に置く。`*.test.ts` がランタイム、`*.test-d.ts` が型テスト（`expectTypeOf`）で、どちらも `yarn test` が走らせる（→ docs/SPEC.md D-10）。型が API 契約を担うライブラリなので、振る舞いを変えたら型テストも対で直す。
- `tsconfig.json` は `include: ["src"]` でビルド専用。テストの型検査は `tsconfig.test.json` が担う。`test/` を足すために `rootDir` をルートへ広げてあるが、`noEmit` なので生成物には影響しない。
- `dist/` と `types/` は生成物で、**git 管理外**（→ docs/SPEC.md D-3）。clone 直後は存在しない。`yarn install` では作られないので、必要なら `yarn build` を明示的に走らせる。
- ビルドは2段。`tsc` は `emitDeclarationOnly` で `types/` に `.d.ts` のみを吐き、JS は `vite build` が `dist/` に es/umd を吐く。型だけ直したいときも両方走らせる。
- 公開 API の実体は `new Proxy` で、クラス本体にはプロパティが無い。`Robustive` / `UsecaseSelector` / `ScenarioFactory` / `SceneFactory` / `ContextFactory` / `SwiftEnum` はいずれも `as new <...>() => 型` のキャストで型を与えている。**型注釈が API 契約そのもの**なので、挙動を変えるときは Proxy の `get` とキャスト側の型の両方を必ず対で直す。片方だけ直すと型は通るのに実行時に落ちる。
- `NOCARE` は `any` のエイリアス。型推論を意図的に諦めている箇所の目印なので、`unknown` に置き換えようとしない。
- コーススタイルは `basics` / `alternatives` / `goals` の3つ固定。増やす前に SPEC D-2 を読む。
- コーディング規約は `.eslintrc.js` が持つ: インデント4スペース、ダブルクォート、セミコロン必須、改行 LF。プロパティの区切りカンマを行頭に置く既存スタイルに合わせる。
- `README.md` は現行 API とズレている（`BaseScenario` / `MutableContext` は存在しない）。**README を仕様の根拠にしない**。正は `src/` と `docs/SPEC.md`（→ TASK-TREE T-2）。
- `prepack` が pack / publish の直前に `yarn build` を走らせる。**Yarn 4 は `yarn install` でも `yarn pack` でも `prepare` を実行しない**ので、`prepare` だけに頼ると `dist` `types` を欠いたパッケージを公開してしまう。`prepare` は npm 経由の git 依存インストール用に残してある。
- 公開は `v*` タグの push がトリガー（`.github/workflows/publish.yml`）。公開先は npm（→ SPEC D-6）。`package.json` の version 更新とタグ付けが公開操作にあたるので、指示なく行わない。
- CI の publish 認証は `YARN_NPM_AUTH_TOKEN` に渡す `NPM_TOKEN` シークレット。Yarn 4 は npm の `.npmrc` を読まないので、`setup-node` の `registry-url` を足しても認証は通らない。
