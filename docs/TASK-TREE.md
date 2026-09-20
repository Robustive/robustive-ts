# TASK TREE — robustive-ts

最終更新: 2026-09-20

作業の現在地。タスクの状態が変わったら、そのターンのうちにここを更新する。

## 記法

- ステータス: `[ ]` 未着手 / `[~]` 進行中 / `[x]` 完了 / `[!]` ブロック中 / `[-]` 取り止め
- 各タスクには ID を振る。会話では ID で指す（例: 「T-2.1 を進めて」）。
- `→ SPEC 3.2` のように、根拠となる `docs/SPEC.md` の節番号を書く。節が無いタスクは、仕様が未定か、そもそも不要なタスク。
- `[!]` には必ず理由を書く。理由の無いブロックは放置される。

## 現在のフォーカス

**T-6.8** — npm の org 作成と `NPM_TOKEN` 登録（リポジトリ外の作業。これが済めば公開できる）

## マイルストーン 1: 土台の立て直し

v1.1.5 公開済みの実装に対して、検証・文書・構成の穴を塞ぐ。

- [x] **T-1** テスト基盤を整備する → SPEC D-10, D-11
  - [x] T-1.1 Vitest に決定（ランタイムと型テストを1ツールで）。前提として vite 7 / @types/node 22 へ更新 → SPEC D-10, D-11
  - [x] T-1.2 `test` / `test:watch` script を追加。`lint` も `test/` と `vitest.config.ts` を対象に含めた
  - [x] T-1.3 `Context` の平坦化の型テスト（`test/context.test-d.ts`、14件）→ SPEC 3.2
  - [x] T-1.4 `interactedBy` のランタイムテスト（`test/usecase.test.ts`、13件）→ SPEC D-7, R-3, R-5
  - [x] T-1.5 `SwiftEnum`（`test/enum.test.ts`、6件）と `Robustive` / `typeGuards`（`test/robustive.test.ts`、9件）→ SPEC R-7, R-8
  - [x] T-1.6 設定の分離: `tsconfig.json` を `include: ["src"]` でビルド専用にし、型検査用に `tsconfig.test.json` を追加
- [x] **T-2** README を現行 API に追従させる → SPEC 3.3
  - [x] T-2.1 `BaseScenario` / `MutableContext` / 未定義の `_u` を、`Scenario` + `delegate` / `Context` に置き換え
  - [x] T-2.2 未記載だった機能を追記: directive による中断（→ D-7）、`typeGuards` と `keys`（→ R-7）、`SwiftEnum`（→ R-8）、`interactedBy` の recursiveWrapper（→ R-10）、`progress`、`InteractResult` の中身
  - [x] T-2.3 インストール手順と import パスを `@robustive/robustive-ts` に修正（T-6.6 で実施）→ SPEC 2.2
  - [x] T-2.4 `authorize` の行を実態に合わせ「required in practice」とし、型の上は optional だが未実装だと `interactedBy` が throw することを明記。T-7 で実装を直す決定になれば README も追従させる
  - [x] T-2.5 README のコード例を `test/readme.test-d.ts` に写し、`yarn test` で型が通ることを継続的に検査するようにした。この作業で directive の例が実際に壊れていたことが判明（`to` を絞り込まずに `to.id` を参照）
- [x] **T-3** モノレポを畳み、単一パッケージ構成にする → SPEC D-8, D-9
  - [x] T-3.1 構成を決定（2026-09-20）。当初「モノレポ維持」としたが利用者判断で単一パッケージ化に改訂 → SPEC D-8
  - [x] T-3.2 `packages/express/`（node_modules のみ、git 管理外）を削除
  - [x] T-3.3 `packages/core/*` をルートへ昇格し、`workspaces` を廃止。`package.json` を統合（`lint` script を新設、TypeScript は ^4.6.2 に統一 → SPEC D-9）、`publish.yml` の `foreach` を `yarn build` / `yarn npm publish` に置換
  - [x] T-3.4 検証: 再ビルドで `dist/` `types/` に差分なし、lint 通過、`yarn pack --dry-run` の同梱物が移動前と同等
- [x] **T-4** `dist/` `types/` を追跡から外す → SPEC D-3
  - [x] T-4.1 依存経路を調査。`publish.yml` は自前で build しており非依存、README も `github:` 依存や tarball 利用を案内していない。78コミット中53件が生成物を含むが生成物のみのコミットはゼロ、`.git` は 3.1MB で肥大も軽微 — 実害より「npm 移行で参照経路が消えた」ことが決め手 → SPEC D-3
  - [x] T-4.2 `.gitignore` に `/dist` `/types` を追加し、`git rm --cached` で追跡解除。D-3 を改訂
  - [x] T-4.3 調査中に判明した publish 事故リスクへの対処: Yarn 4 は `yarn install` でも `yarn pack` でも `prepare` を実行しないため、生成物を追跡しないと**中身の無いパッケージを公開しうる**。`package.json` に `prepack` を追加して pack/publish 直前のビルドを保証（`publish.yml` は元から `yarn build` を明示していたため変更不要）
  - [x] T-4.4 CLAUDE.md の記述を修正。旧記述「`prepare` により `yarn install` がビルドを巻き込む」は実測と異なっていた
- [x] **T-5** TypeScript を 5 系へ更新する → SPEC D-9
  - [x] T-5.1 `^4.6.2` → `^5.9.3`（実解決 4.9.5 → 5.9.3）。更新前の出力を退避して比較し、`dist/` は完全一致、`.d.ts` の差分は型エイリアスの保持のみで意味は不変と確認 → SPEC D-9
  - [x] T-5.2 eslint 8 / @typescript-eslint 5 のままで警告なく通ると確認。`parserOptions.project` 未使用のためバージョン警告も出ず、flat config 移行は不要だった
- [~] **T-6** パッケージの公開先を GitHub Packages から npm へ移行する → SPEC 2.2, D-6
  - [x] T-6.1 パッケージ名は `@robustive/robustive-ts` のまま、npm 上で `@robustive` スコープを取得する方針に決定（2026-09-20）→ SPEC D-6
  - [x] T-6.2 GitHub Packages 版は廃止。並行公開しないと決定（2026-09-20）→ SPEC D-6
  - [x] T-6.3 `.yarnrc.yml` から GitHub Packages 向けの `npmScopes.robustive` を削除し、`npmRegistryServer` / `npmPublishRegistry` を npm 公式に明示。`GITHUB_TOKEN` 無しで `yarn` が動くようになった
  - [x] T-6.4 `publish.yml` を更新: ワークフロー名、`registry-url` / `scope` / `env.GITHUB_TOKEN` / `permissions.packages` を削除し、publish に `YARN_NPM_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` を付与
  - [x] T-6.5 `package.json` は `name` / `publishConfig.access: public` とも変更不要と確認。`yarn pack --dry-run` の同梱物も従来どおり
  - [x] T-6.6 README のインストール手順と、コード例4箇所の import パスを `@robustive/robustive-ts` に統一（T-2.3 もこれで解消）
  - [x] T-6.7 CLAUDE.md から `GITHUB_TOKEN` 前提の記述を削除し、公開先と CI 認証の記述を更新
  - [!] T-6.8 npm 側の受け入れ準備 — **リポジトリ外の作業のため未完**: npm で `@robustive` org（スコープ）を作成し、publish 権限を持つ Automation トークンを発行して、GitHub リポジトリに `NPM_TOKEN` シークレットとして登録する。これが済むまでタグを push しても publish は失敗する

- [x] **T-7** `delegate.authorize` が事実上必須になっている件を決着させる → SPEC D-12
  - [x] T-7.1 「未実装なら認可なしで通す」実装修正を選択（2026-09-20）→ SPEC D-12
  - [x] T-7.2 `Scenario#authorize` の throw を `return true` に変更。テストを新挙動に書き換え（未実装で成功する / progress も通る / 直接呼んでも true）、README の表を optional に戻し、directive の例からは `authorize` を省いて optional であることを示した
  - [x] T-7.3 SPEC 3.3 と 5. 未決事項を改訂。挙動変更にあたるため、次のリリースは patch ではなく minor 以上を当てる旨を D-12 に明記
## マイルストーン 2: TBD

T-1〜T-6 の決着後に定義する。

## 完了済み

完了したマイルストーンは丸ごとここへ移す。個別タスクの完了は移さず、上のツリーで `[x]` にしておく。ツリーが読みにくくなってから移動する。

## 気づいたこと

作業中に見つかった、今やらないが忘れたくないこと。溜まったら `docs/SPEC.md` の未決事項か正式なタスクに昇格させる。

- `README.md` と `test/readme.test-d.ts` は同じコード例を二重に持っている。型が通ることは保証されるが、内容の同期は人力。README からコードブロックを抽出して検査する形にできれば、二重管理をやめられる。
- `.yarn/install-state.gz` が untracked のまま残っている。`.gitignore` に `.yarn/install-state.gz` を足すのが Yarn 4 の定石。
- `.eslintrc.js` は `env.browser` のみ。`crypto.getRandomValues` を使う一方で Node 実行も想定するなら `env` の見直しが要る → SPEC 2.2
- eslint 8 系 + `.eslintrc.js`（旧形式）のまま。TypeScript 5.9 では支障が無いと確認済み（→ T-5.2）だが、flat config への移行はいずれ必要になる。
