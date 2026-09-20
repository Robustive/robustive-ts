# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# robustive-ts

ロバストネス図のユースケースシナリオを TypeScript の型で表現し、そのとおりに実行するライブラリ。Yarn 4 workspaces のモノレポで、公開物は `packages/core`（`@robustive/robustive-ts`）のみ。

## ドキュメント運用

このリポジトリは3つのファイルで状態を管理する。役割を混ぜないこと。

- `SPEC.md` — 仕様と決定の根拠。What と Why。
- `TASK-TREE.md` — 現在地。階層タスクとステータス。
- `CLAUDE.md`（このファイル）— ルールのみ。

守ること:

1. 実装に着手する前に `SPEC.md` の該当節を読む。
2. 仕様が変わったら、コードより先に `SPEC.md` を直す。
3. タスクの状態が変わったら、そのターンのうちに `TASK-TREE.md` を更新する。完了報告と同時に行う。
4. `SPEC.md` に書かれていない判断を迫られたら、実装せずに確認する。推測で埋めない。

## コマンド

`.yarnrc.yml` が `npmAuthToken: "${GITHUB_TOKEN}"` を参照するため、**環境変数 `GITHUB_TOKEN` が無いと `yarn` はサブコマンド以前に失敗する**。読み取りだけの操作でもダミー値で足りる。

```bash
export GITHUB_TOKEN=dummy                          # 未設定なら必ず先に置く
yarn install --immutable                           # 依存の導入
yarn build                                         # 全 workspace ビルド（tsc → vite）
yarn build:clean                                   # dist/ types/ の削除
yarn run eslint "packages/core/src/**/*.ts"        # lint（package.json に script は無い）
```

テストは未整備。ルートの `yarn test` は `packages/core` に `test` script が無いため何も検証しない。テストを足すまで「テストが通った」とは言わないこと（→ TASK-TREE T-1）。

作業完了を報告する前に、少なくとも lint と `yarn build` を通すこと。

## このプロジェクト固有の注意

- `packages/core/dist/` と `packages/core/types/` は**生成物だが git 管理下にある**。直接編集しない。変更は `src/` に入れ、`yarn build` で再生成してからコミットする（→ SPEC D-3）。
- ビルドは2段。`tsc` は `emitDeclarationOnly` で `types/` に `.d.ts` のみを吐き、JS は `vite build` が `dist/` に es/umd を吐く。型だけ直したいときも両方走らせる。
- 公開 API の実体は `new Proxy` で、クラス本体にはプロパティが無い。`Robustive` / `UsecaseSelector` / `ScenarioFactory` / `SceneFactory` / `ContextFactory` / `SwiftEnum` はいずれも `as new <...>() => 型` のキャストで型を与えている。**型注釈が API 契約そのもの**なので、挙動を変えるときは Proxy の `get` とキャスト側の型の両方を必ず対で直す。片方だけ直すと型は通るのに実行時に落ちる。
- `NOCARE` は `any` のエイリアス。型推論を意図的に諦めている箇所の目印なので、`unknown` に置き換えようとしない。
- コーススタイルは `basics` / `alternatives` / `goals` の3つ固定。増やす前に SPEC D-2 を読む。
- コーディング規約は `.eslintrc.js` が持つ: インデント4スペース、ダブルクォート、セミコロン必須、改行 LF。プロパティの区切りカンマを行頭に置く既存スタイルに合わせる。
- `packages/core/README.md` は現行 API とズレている（`BaseScenario` / `MutableContext` は存在しない）。**README を仕様の根拠にしない**。正は `src/` と `SPEC.md`（→ TASK-TREE T-2）。
- `packages/express/` は削除済みパッケージの残骸ディレクトリ。git 管理下には無い（→ TASK-TREE T-3）。
- 公開は `v*` タグの push がトリガー（`.github/workflows/publish.yml`）。GitHub Packages 向け。`packages/core/package.json` の version 更新とタグ付けが公開操作にあたるので、指示なく行わない。
