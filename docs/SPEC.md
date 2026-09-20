# SPEC — robustive-ts

最終更新: 2026-09-20

このファイルは仕様の Single Source of Truth。実装がここと食い違ったら、どちらが正しいかを決めてから直す。黙って実装に合わせない。

本 SPEC は既存実装（`src/`）とコミット履歴から起こしたもの。当時の意思決定の記録が残っていない項目は「TBD」と明示してある。推測で埋めないこと。

## 1. 目的

### 1.1 解決する課題

ロバストネス図で描いたユースケースシナリオは、実装に落とす段階で「どのシーンからどのシーンへ遷移しうるか」の情報を失う。robustive-ts は (1) シナリオを TypeScript の型として表現し、(2) その型どおりにシーンを再帰実行するランタイムを与えることで、設計図とコードの乖離をコンパイル時に検出可能にする。

### 1.2 対象ユーザー

ユースケース駆動でアプリケーションを設計する TypeScript 開発者。UI フレームワーク非依存で、ブラウザ・Node いずれからも使える。

### 1.3 やらないこと

- UI レイヤの提供。シナリオの実行結果（`InteractResult`）をどう画面に反映するかは利用側の責務。
- HTTP フレームワークとの統合。かつて `packages/express` が担っていたが削除済みで、復活させない（→ D-4, D-8）。
- ランタイムのバリデーション。`Context` の妥当性は型でしか守らない。実行時チェックは入れない。
- DI コンテナ、状態管理ストア。`Scenario` の依存注入は利用側が `delegate` で行う。

## 2. 要件

### 2.1 機能要件

| ID | 要件 | 優先度 |
|---|---|---|
| R-1 | シナリオを `Scenes`（`basics` / `alternatives` / `goals` の3コース）として型で宣言できる | 必須 |
| R-2 | シーン名から `Context`（Discriminated Union）を生成し、`switch (to.scene)` で網羅性検査が効く | 必須 |
| R-3 | `interactedBy` がゴールに到達するまでシーンを再帰実行し、経路全体を `performedScenario` として返す | 必須 |
| R-4 | `progress` で1シーンずつ手動で進められる | 必須 |
| R-5 | `IActor` の認可判定でユースケース実行を拒否できる（`ActorNotAuthorizedToInteractIn`） | 必須 |
| R-6 | ドメイン × ユースケースの要求定義（`DomainRequirements`）から、シナリオ生成用の型付きセレクタ `Robustive` を構築できる | 必須 |
| R-7 | `Robustive#typeGuards` がドメイン/ユースケースごとの型ガードを自動生成する | 必須 |
| R-8 | `SwiftEnum` が associated values 付き列挙をユーティリティ関数つきで提供する | 必須 |
| R-9 | `directive` により、ゴール未到達でも再帰を中断できる | 任意 |
| R-10 | `interactedBy` の再帰全体を利用側のラッパ（トランザクション等）で包める | 任意 |

### 2.2 非機能要件

- 対応環境: ESM（`dist/robustive.es.js`）と UMD（`dist/robustive.umd.js`）の両方を配布。型定義は `types/index.d.ts`。
- ビルドターゲット: `esnext` / `module: esnext` / `strict: true`。
- ランタイム依存: なし。`crypto.getRandomValues` のみ前提（ID 生成）。
- 配布: npm レジストリ（`@robustive/robustive-ts`）。認証なしで install できる（→ D-6）。

## 3. 設計

### 3.1 全体像

```
DomainRequirements（利用側が宣言）
  └─ Robustive            … ドメイン名で引くルート。keys / typeGuards を持つ
       └─ UsecaseSelector … ユースケース名で引く
            └─ CourseSelector … basics / alternatives / goals
                 └─ ScenarioFactory … シーン名で引くと Usecase インスタンスを生成
                      └─ UsecaseImple … progress / interactedBy を持つ実行主体
                           └─ Scenario … 利用側が delegate で next を与える遷移定義
```

`Robustive` から `ScenarioFactory` までは全て `Proxy` で、存在しないプロパティアクセスをドメイン名・ユースケース名・シーン名として解釈する。実体の型は `as new <...>() => 型` のキャストが与えている（→ D-1）。

### 3.2 データモデル

- `Scenes` = `{ basics, alternatives, goals }`、各コースは `Record<シーン名, オブジェクト>`。値が `Empty` のシーンは associated values なし。
- `Context<Z, Directive>` = `Scenes` を平坦化して作る Discriminated Union。判別子は `scene`、コース情報は `course`。`Flatten` / `PreFlatten` が `"course.scene"` のキーに展開して重複シーン名を区別する。`alternatives` が `Empty` のときはキーごと落ちる。
- `InteractResult` = `success` / `failure` の判別付きユニオン。所要時間、経路、最終シーン（失敗時は失敗シーン）を持つ。
- `UsecaseImple` は `Object.freeze` されるため、現在コンテキストはインスタンス外の `WeakMap`（`currentContextStore`）に保持する。

### 3.3 インターフェース

公開エントリは `src/index.ts` のみ。ここに export されていないものは private API とみなし、破壊的変更を許す。

`IScenarioDelegate` の3メソッド:

| メソッド | 実装義務 | 役割 |
|---|---|---|
| `next` | 必須 | 現シーンから次シーンへの分岐。未実装なら `Scenario#next` が reject する |
| `authorize` | **事実上必須** | アクターの実行可否。`UsecaseImple` は `Scenario#authorize`（クラスのメソッドなので常に存在する）の有無だけを見て必ず呼ぶため、delegate 側が未実装だと `Scenario#authorize` が throw する。しかも `interactedBy` / `progress` の中で同期的に投げるので、Promise の reject にもならない（→ 5. 未決事項） |
| `complete` | 任意 | 正常・異常いずれの終了時にも呼ばれる後処理 |

## 4. 決定記録

**ここがこのファイルで最も価値のある節。** 採用した案だけでなく、却下した案とその理由を残す。

### D-1: 公開 API を Proxy + 型キャストで構築する

- 決定: `Robustive` 系のセレクタとファクトリは `new Proxy` で任意のプロパティを受け、型は `as new <...>() => 型` のキャストで別途与える。
- 理由: シーン名は利用側が任意の文字列で定義するため、実行時にプロパティを列挙・生成できない。Proxy なら宣言した型と同じキーでアクセスでき、型定義側で補完と網羅性検査を効かせられる。
- 却下した案: ビルド時のコード生成（利用側にジェネレータ実行を強いる）、プレーンなメソッド + 文字列引数（補完も網羅性検査も効かない）。
- 代償: 型注釈とクラス実装が二重管理になる。両方を対で直すこと（CLAUDE.md に明記済み）。
- 覆す条件: TypeScript が Proxy のキー型を実装から推論できるようになったとき。

### D-2: コースを basics / alternatives / goals の3つに固定する

- 決定: `courses` 配列は const で3値。利用側は増やせない。
- 理由: ロバストネス図のシナリオ記述に対応する最小集合。基本コース・代替コース・境界（ゴール）の3分類でロバストネス図の記法を尽くせる。`interactedBy` の終了条件を `course === "goals"` の1行で書けるのもこの固定に依存している。
- 却下した案: コース名を利用側の型引数にする — 終了条件を利用側に委ねることになり、シナリオが必ず終わる保証が消える。
- 覆す条件: TBD（3分類で表現できないシナリオ要求が出たとき）。

### D-3: ビルド生成物（dist/ types/）は追跡しない

- 日付: 2026-09-20（それ以前はコミットしていた）
- 決定: `dist/` と `types/` を `.gitignore` に入れ、git 管理から外す。配布物は publish の直前に生成する。
- 理由: npm 公開へ移行した（→ D-6）ことで、git 上の生成物を参照する経路が無くなった。併せて、レビューで無視すべき差分が毎コミット入る状態と、ソースと生成物の整合が人力の規律だけに依存する状態も解消する。
- 実測（2026-09-20 時点）: 78コミット中53件が生成物を含んでいたが、生成物のみのコミットはゼロで規律自体は保たれていた。差分行数もソース変更と同程度、`.git` は 3.1MB。つまり切迫した実害があったわけではなく、npm 移行で参照経路が消えたことが決め手。
- 必須の随伴変更: Yarn 4 は `yarn install` でも `yarn pack` でも `prepare` を実行しない（実測で確認）。生成物を追跡しないなら、pack / publish の直前に必ずビルドさせる `prepack` が要る。これが無いと `dist` と `types` を欠いたパッケージを公開してしまう。`prepare` は npm 経由の git 依存インストールでは効くため残す。
- 却下した案: 現状維持 — タグや `github:` 依存での直接利用者を壊さない利点はあるが、README はその経路を案内しておらず、`prepack` / `prepare` があれば再生成される。
- 覆す条件: ビルド環境を用意できない利用者向けに tarball の直接利用を公式サポートする必要が出たとき。

### D-4: express アダプタを廃し、モノレポを core 単独に統合する

- 日付: 2026-05-17（コミット `0ba1a01`）
- 決定: `@robustive/robustive-ts-express` を削除し、Express 依存をリポジトリから外す。
- 理由: コアの責務（シナリオの型表現と実行）に HTTP レイヤは含まれない（→ 1.3）。
- 残課題: なし。作業ツリーに残っていた `packages/express/`（node_modules のみ、git 管理外）は 2026-09-20 に削除した（→ D-8）。

### D-8: 単一パッケージ構成に畳む

- 日付: 2026-09-20
- 決定: `packages/express` を削除したうえで `packages/core` をリポジトリルートへ昇格させ、Yarn workspaces をやめて単一パッケージ `@robustive/robustive-ts` にする。express アダプタは復活させない。
- 理由: 公開パッケージが core 単独になった以上、workspaces の間接コスト（`foreach` 越しのビルドと publish、二重の package.json、devDependency の重複、TypeScript のバージョン分裂）を払う理由が無い。
- 却下した案: モノレポ維持 — 追加パッケージの予定が無い以上、構成の余地を残す価値より日々の間接コストが上回る。
- 覆す条件: フレームワーク固有アダプタ等を再び別パッケージとして公開する必要が生じたとき。workspaces への復帰は `package.json` の `workspaces` フィールドと publish ワークフローを戻すだけで済む。

### D-9: TypeScript は 5 系を使う

- 日付: 2026-09-20（同日、4 系への一時固定から更新）
- 決定: TypeScript は `^5.9.3`（実解決 5.9.3）。
- 経緯: 単一パッケージ化（→ D-8）で `packages/core` の `^4.6.2` とルートの `^5.9.3` のどちらかに決める必要が生じた際、構成変更の差分とコンパイラ更新の差分が混ざるのを避けるため、いったん実際にビルドに使われていた 4 系に固定した。構成変更（D-3, D-6, D-8）が落ち着いたので、単独の変更として 5 系へ上げた。
- 検証: 4.9.5 の出力を退避してから 5.9.3 でビルドし直して比較した。`dist/`（vite が生成する JS）は完全一致。`types/` の `.d.ts` のみ差分が出たが、内容は型エイリアスの保持に関するものだけで、意味と公開 API の互換性は変わらない:
  - `C extends "basics" | "alternatives" | "goals"` → `C extends Courses`
  - `D extends Extract<keyof R, string>` → `D extends StringKeyof<R>`
  - `f?: ((swiftEnumCase: …) => U) | undefined` → `f?: (swiftEnumCase: …) => U`
- lint への影響: eslint 8 / @typescript-eslint 5 のままで警告なく通る。`parserOptions.project` を使っていないため、@typescript-eslint v5 が新しい TS に出す「サポート外バージョン」警告も出ない。flat config への移行は今回不要だった。

### D-5: SwiftEnum の Utils をクラスメソッドから関数へ変更する

- 日付: 2026-05-09（コミット `67edb70`）
- 決定: `SwiftEnum` のユーティリティは `(swiftEnumCase) => U` のファクトリ関数で与え、enum 値は明示的な self 引数として渡す。
- 理由: 生成されるケースは `Object.freeze` されるため、`this` 束縛に依存するクラスメソッドでは扱いにくい。関数なら値と振る舞いの結合が明示的になる。

### D-6: 公開はタグ駆動、公開先は npm レジストリ

- 日付: 2026-09-20（公開先の決定）。タグ駆動の仕組み自体はそれ以前から。
- 決定: `v*` タグの push で `publish.yml` が `yarn build` → `yarn npm publish` を実行する。Corepack で yarn 4.12.0 を固定する。公開先は npm レジストリで、パッケージ名は `@robustive/robustive-ts`（npm 上で `@robustive` スコープを取得して使う）。GitHub Packages への公開は廃止し、並行公開はしない。
- 理由:
  - npm を選ぶ理由: GitHub Packages は利用者側にも `.npmrc` と個人アクセストークンの設定を強いる。公開ライブラリの導入障壁として重い。
  - スコープ名を変えない理由: v1.1.5 まで `@robustive/robustive-ts` として公開済みで、名前を変えると利用者の import 文まで書き換えさせることになる。npm でスコープを取得すれば同じ名前で継続できる。
  - Corepack を明示的に叩く理由: `setup-node` のキャッシュ処理が Corepack 初期化前に Yarn へ触れて失敗した経緯があり（コミット `1f25188`）、`package-manager-cache: false` + 明示的な `corepack prepare` に倒した。
- 却下した案:
  - スコープ無しの `robustive-ts`（README が案内していた旧名）— 名前が変わると既存利用者に移行コストが生じる。
  - npm と GitHub Packages の並行公開 — 二重メンテになり、どちらが正なのかが利用者にも開発側にも曖昧になる。
- レジストリ指定: `.yarnrc.yml` で `npmRegistryServer` と `npmPublishRegistry` を `https://registry.npmjs.org` に明示する。Yarn 4 の既定は `registry.yarnpkg.com`（npm のミラー）で、指定しないと publish までそのミラー宛になる。
- 認証: Yarn 4 は npm の `.npmrc` を読まないため、`setup-node` の `registry-url` では認証できない。CI は `YARN_NPM_AUTH_TOKEN` 環境変数に `NPM_TOKEN` シークレットを渡す。リポジトリ内の `.yarnrc.yml` にトークンを書かない。
- 注意: publish はタグ push が引き金。バージョン更新とタグ付けは指示なく行わない。

### D-7: 再帰の終了条件は goals 到達または truthy な directive

- 決定: `interactedBy` の再帰は `lastScene.course === "goals" || lastScene.directive` で止まる。
- 理由: 通常の終了はゴール到達。`directive` は利用側が定義する中断シグナル（確認ダイアログ待ちなど、シナリオの外に制御を返したい場合）のための脱出口。
- 注意: `directive` は truthy 判定なので、`0` や空文字を directive 値に使うと中断されない。

### D-10: テストは Vitest で書く（ランタイムと型の両方）

- 日付: 2026-09-20
- 決定: ランタイムテストと型テストの双方を Vitest で書く。型テストは `expectTypeOf` を使い、`*.test-d.ts` に置いて `vitest --typecheck` で検査する。
- 理由: このライブラリの振る舞いは型と実行時の双方にまたがる。公開 API の実体は Proxy で、型注釈のほうが契約を担っている（→ D-1）ため、型が壊れていないことの検査はランタイムの検査と同格に要る。1つのランナーに揃えると、同じシナリオ定義を型テストとランタイムテストで共有できる。
- 随伴する更新: Vitest 5 は `vite ^6.4` 以上と `@types/node ^22` を要求するため、vite を 7 系へ上げる（→ D-11）。
- 却下した案: node:test + tsx + `tsc --noEmit` と自前の `Expect<Equal<A, B>>` — 追加依存は少ないが、型テストとランタイムテストが別系統に分かれ、vite 2.9（2022年リリース）の老朽化も残ったままになる。

### D-11: vite を 7 系へ更新する

- 日付: 2026-09-20
- 決定: `vite` を `^2.8.6` から `^7` へ、`@types/node` を `^20.11.26` から `^22` へ上げる。
- 理由: Vitest の前提（→ D-10）。加えて 2.9.18 は 2022 年のリリースで、いずれ追随が必要だった。
- 検証: 更新前後でビルドして比較した。出力ファイル名は同一、ビルド後の ES モジュールを実際に読み込んで得た export 9件が完全一致、UMD のグローバル名 `Robustive` も維持。バンドルのバイト列は変わるが公開 API は不変。`types/` は tsc の出力なので無影響。

## 5. 未決事項

決まっていないことを明示する。ここにある項目は実装してはいけない。

- [ ] `delegate.authorize` が事実上必須になっている点（→ 3.3）。README は「optional」と書いているが、未実装だと `interactedBy` が同期例外で落ちる。テストでは現状の挙動をそのまま固定してある（`test/usecase.test.ts`）。仕様として認めるのか、未実装なら認可なしで通す実装に直すのかを決める
  - 当初この節には「`UsecaseImple` 側は存在チェックで素通りする」と書いていたが、テストで否定された。`this._scenario.authorize` は常に truthy なので素通りは起きない
- [ ] 現行の `IScenarioDelegate` 方式（旧 `BaseScenario` 継承方式からの変更）を README にどう記述するか → T-2
