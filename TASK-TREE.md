# TASK TREE — robustive-ts

最終更新: 2026-09-20

作業の現在地。タスクの状態が変わったら、そのターンのうちにここを更新する。

## 記法

- ステータス: `[ ]` 未着手 / `[~]` 進行中 / `[x]` 完了 / `[!]` ブロック中 / `[-]` 取り止め
- 各タスクには ID を振る。会話では ID で指す（例: 「T-2.1 を進めて」）。
- `→ SPEC 3.2` のように、根拠となる SPEC.md の節番号を書く。節が無いタスクは、仕様が未定か、そもそも不要なタスク。
- `[!]` には必ず理由を書く。理由の無いブロックは放置される。

## 現在のフォーカス

**T-1** — テスト基盤の整備

## マイルストーン 1: 土台の立て直し

v1.1.5 公開済みの実装に対して、検証・文書・構成の穴を塞ぐ。

- [ ] **T-1** テスト基盤を整備する → SPEC 5（未決）
  - [ ] T-1.1 テスト方式を決める（ランタイムテストのランナー、型テストの書き方）→ 決まったら SPEC 4 に決定記録を足す
  - [ ] T-1.2 `package.json` に `test` script を足す（現在は未定義で `yarn test` は失敗する）
  - [ ] T-1.3 `Context` の平坦化と網羅性（`Flatten` / `PreFlatten`、`alternatives: Empty` のケース）の型テスト → SPEC 3.2
  - [ ] T-1.4 `interactedBy` の終了条件（goals 到達 / directive 中断 / 認可拒否 / 例外時の failure）のランタイムテスト → SPEC D-7, R-3, R-5
  - [ ] T-1.5 `SwiftEnum` と `typeGuards` のテスト → SPEC R-7, R-8
- [ ] **T-2** README を現行 API に追従させる → SPEC 3.3
  - [ ] T-2.1 存在しない `BaseScenario` / `MutableContext` の記述を `Scenario` / `IScenarioDelegate` / `Context` に置き換える
  - [ ] T-2.2 未記載の機能を追記する: `Directive`（→ D-7）、`Robustive#typeGuards`（→ R-7）、`SwiftEnum`（→ R-8）、`interactedBy` の recursiveWrapper（→ R-10）
  - [x] T-2.3 インストール手順と import パスを `@robustive/robustive-ts` に修正（T-6.6 で実施）→ SPEC 2.2
- [x] **T-3** モノレポを畳み、単一パッケージ構成にする → SPEC D-8, D-9
  - [x] T-3.1 構成を決定（2026-09-20）。当初「モノレポ維持」としたが利用者判断で単一パッケージ化に改訂 → SPEC D-8
  - [x] T-3.2 `packages/express/`（node_modules のみ、git 管理外）を削除
  - [x] T-3.3 `packages/core/*` をルートへ昇格し、`workspaces` を廃止。`package.json` を統合（`lint` script を新設、TypeScript は ^4.6.2 に統一 → SPEC D-9）、`publish.yml` の `foreach` を `yarn build` / `yarn npm publish` に置換
  - [x] T-3.4 検証: 再ビルドで `dist/` `types/` に差分なし、lint 通過、`yarn pack --dry-run` の同梱物が移動前と同等
- [ ] **T-4** `dist/` `types/` のコミット運用を見直す → SPEC D-3
  - [ ] T-4.1 コミット済み生成物に依存している利用者・手順がないか確認する（publish.yml は自前で build しており非依存）
  - [ ] T-4.2 追跡から外すなら `.gitignore` と `.github/workflows/publish.yml` を対で更新し、D-3 を改訂する
- [ ] **T-5** TypeScript を 5 系へ更新する → SPEC D-9
  - [ ] T-5.1 単独の変更として上げ、`dist/` `types/` の差分がコンパイラ更新由来だけになることを確認する
  - [ ] T-5.2 eslint 8 / @typescript-eslint 5 が追随できるか確認する（必要なら flat config 移行と併せて）
- [~] **T-6** パッケージの公開先を GitHub Packages から npm へ移行する → SPEC 2.2, D-6
  - [x] T-6.1 パッケージ名は `@robustive/robustive-ts` のまま、npm 上で `@robustive` スコープを取得する方針に決定（2026-09-20）→ SPEC D-6
  - [x] T-6.2 GitHub Packages 版は廃止。並行公開しないと決定（2026-09-20）→ SPEC D-6
  - [x] T-6.3 `.yarnrc.yml` から GitHub Packages 向けの `npmScopes.robustive` を削除し、`npmRegistryServer` / `npmPublishRegistry` を npm 公式に明示。`GITHUB_TOKEN` 無しで `yarn` が動くようになった
  - [x] T-6.4 `publish.yml` を更新: ワークフロー名、`registry-url` / `scope` / `env.GITHUB_TOKEN` / `permissions.packages` を削除し、publish に `YARN_NPM_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` を付与
  - [x] T-6.5 `package.json` は `name` / `publishConfig.access: public` とも変更不要と確認。`yarn pack --dry-run` の同梱物も従来どおり
  - [x] T-6.6 README のインストール手順と、コード例4箇所の import パスを `@robustive/robustive-ts` に統一（T-2.3 もこれで解消）
  - [x] T-6.7 CLAUDE.md から `GITHUB_TOKEN` 前提の記述を削除し、公開先と CI 認証の記述を更新
  - [!] T-6.8 npm 側の受け入れ準備 — **リポジトリ外の作業のため未完**: npm で `@robustive` org（スコープ）を作成し、publish 権限を持つ Automation トークンを発行して、GitHub リポジトリに `NPM_TOKEN` シークレットとして登録する。これが済むまでタグを push しても publish は失敗する

## マイルストーン 2: TBD

T-1〜T-6 の決着後に定義する。

## 完了済み

完了したマイルストーンは丸ごとここへ移す。個別タスクの完了は移さず、上のツリーで `[x]` にしておく。ツリーが読みにくくなってから移動する。

## 気づいたこと

作業中に見つかった、今やらないが忘れたくないこと。溜まったら SPEC.md の未決事項か正式なタスクに昇格させる。

- `.yarn/install-state.gz` が untracked のまま残っている。`.gitignore` に `.yarn/install-state.gz` を足すのが Yarn 4 の定石。
- `.eslintrc.js` は `env.browser` のみ。`crypto.getRandomValues` を使う一方で Node 実行も想定するなら `env` の見直しが要る → SPEC 2.2
- eslint 8 系 + `.eslintrc.js`（旧形式）のまま。flat config への移行はいずれ必要になる。
