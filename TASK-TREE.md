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
  - [ ] T-1.2 `packages/core/package.json` に `test` script を足し、ルートの `yarn test` を実効にする
  - [ ] T-1.3 `Context` の平坦化と網羅性（`Flatten` / `PreFlatten`、`alternatives: Empty` のケース）の型テスト → SPEC 3.2
  - [ ] T-1.4 `interactedBy` の終了条件（goals 到達 / directive 中断 / 認可拒否 / 例外時の failure）のランタイムテスト → SPEC D-7, R-3, R-5
  - [ ] T-1.5 `SwiftEnum` と `typeGuards` のテスト → SPEC R-7, R-8
- [ ] **T-2** README を現行 API に追従させる → SPEC 3.3
  - [ ] T-2.1 存在しない `BaseScenario` / `MutableContext` の記述を `Scenario` / `IScenarioDelegate` / `Context` に置き換える
  - [ ] T-2.2 未記載の機能を追記する: `Directive`（→ D-7）、`Robustive#typeGuards`（→ R-7）、`SwiftEnum`（→ R-8）、`interactedBy` の recursiveWrapper（→ R-10）
  - [ ] T-2.3 インストール手順を `@robustive/robustive-ts`（GitHub Packages）に直す。現状は `yarn add robustive-ts` のままで誤り → SPEC 2.2
- [ ] **T-3** `packages/express` の扱いを決める → SPEC 1.3, D-4
  - [ ] T-3.1 モノレポを維持するか単一パッケージに畳むかを決め、SPEC 4 に決定記録を足す
  - [ ] T-3.2 決定に沿って `packages/express/` の残骸を処理する（git 管理外のため作業ツリーの掃除のみ）
- [ ] **T-4** `dist/` `types/` のコミット運用を見直す → SPEC D-3
  - [ ] T-4.1 コミット済み生成物に依存している利用者・手順がないか確認する（publish.yml は自前で build しており非依存）
  - [ ] T-4.2 追跡から外すなら `.gitignore` と `.github/workflows/publish.yml` を対で更新し、D-3 を改訂する

## マイルストーン 2: TBD

T-1〜T-4 の決着後に定義する。

## 完了済み

完了したマイルストーンは丸ごとここへ移す。個別タスクの完了は移さず、上のツリーで `[x]` にしておく。ツリーが読みにくくなってから移動する。

## 気づいたこと

作業中に見つかった、今やらないが忘れたくないこと。溜まったら SPEC.md の未決事項か正式なタスクに昇格させる。

- `.yarnrc.yml` が `${GITHUB_TOKEN}` を必須にしているため、トークン未設定の環境では `yarn` が一切動かない。読み取り専用の操作でも落ちるので、開発者向けに `.env` 方式か既定値を用意するか検討の余地がある。
- ルートの devDependency は TypeScript 5.9 だが `packages/core` は ^4.6.2 を持つ。ビルドに使われるのは core 側。意図的でなければ揃える。
- `.eslintrc.js` は `env.browser` のみ。`crypto.getRandomValues` を使う一方で Node 実行も想定するなら `env` の見直しが要る → SPEC 2.2
- eslint 8 系 + `.eslintrc.js`（旧形式）のまま。flat config への移行はいずれ必要になる。
