# SPEC — robustive-ts

最終更新: 2026-09-20

このファイルは仕様の Single Source of Truth。実装がここと食い違ったら、どちらが正しいかを決めてから直す。黙って実装に合わせない。

本 SPEC は既存実装（`packages/core/src/`）とコミット履歴から起こしたもの。当時の意思決定の記録が残っていない項目は「TBD」と明示してある。推測で埋めないこと。

## 1. 目的

### 1.1 解決する課題

ロバストネス図で描いたユースケースシナリオは、実装に落とす段階で「どのシーンからどのシーンへ遷移しうるか」の情報を失う。robustive-ts は (1) シナリオを TypeScript の型として表現し、(2) その型どおりにシーンを再帰実行するランタイムを与えることで、設計図とコードの乖離をコンパイル時に検出可能にする。

### 1.2 対象ユーザー

ユースケース駆動でアプリケーションを設計する TypeScript 開発者。UI フレームワーク非依存で、ブラウザ・Node いずれからも使える。

### 1.3 やらないこと

- UI レイヤの提供。シナリオの実行結果（`InteractResult`）をどう画面に反映するかは利用側の責務。
- HTTP フレームワークとの統合。かつて `packages/express` が担っていたが削除済み（→ D-4）。
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
- 配布: GitHub Packages（`@robustive` scope、`npmAlwaysAuth`）。

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

公開エントリは `packages/core/src/index.ts` のみ。ここに export されていないものは private API とみなし、破壊的変更を許す。

`IScenarioDelegate` の3メソッド:

| メソッド | 実装義務 | 役割 |
|---|---|---|
| `next` | 必須 | 現シーンから次シーンへの分岐。未実装なら `Scenario#next` が reject する |
| `authorize` | 任意 | アクターの実行可否。未実装だと `Scenario#authorize` は throw するが、`UsecaseImple` 側は `this._scenario.authorize` の存在チェックで呼ぶため既定では認可なしで通る |
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

### D-3: ビルド生成物（dist/ types/）をリポジトリにコミットする

- 決定: `packages/core/dist/` と `packages/core/types/` を git 管理下に置く。
- 理由: TBD。GitHub Packages 経由での参照や、タグからの直接利用を想定したものと推測されるが、記録が残っていない。
- 現状の代償: `yarn build` のたびに差分が出るため、レビューがノイズに埋もれる。CI（`publish.yml`）は publish 前に自前で build しており、コミット済み生成物には依存していない。
- 覆す条件: → TASK-TREE T-4 で判断する。

### D-4: express アダプタを廃し、モノレポを core 単独に統合する

- 日付: 2026-05-17（コミット `0ba1a01`）
- 決定: `@robustive/robustive-ts-express` を削除し、Express 依存をリポジトリから外す。
- 理由: コアの責務（シナリオの型表現と実行）に HTTP レイヤは含まれない（→ 1.3）。
- 残課題: `packages/express/` ディレクトリが node_modules だけ残っている（→ TASK-TREE T-3）。

### D-5: SwiftEnum の Utils をクラスメソッドから関数へ変更する

- 日付: 2026-05-09（コミット `67edb70`）
- 決定: `SwiftEnum` のユーティリティは `(swiftEnumCase) => U` のファクトリ関数で与え、enum 値は明示的な self 引数として渡す。
- 理由: 生成されるケースは `Object.freeze` されるため、`this` 束縛に依存するクラスメソッドでは扱いにくい。関数なら値と振る舞いの結合が明示的になる。

### D-6: 公開はタグ駆動で GitHub Packages へ

- 決定: `v*` タグの push で `publish.yml` が `yarn build` → `yarn npm publish` を実行する。Corepack で yarn 4.12.0 を固定する。
- 理由: `setup-node` のキャッシュ処理が Corepack 初期化前に Yarn へ触れて失敗した経緯があり（コミット `1f25188`）、`package-manager-cache: false` + 明示的な `corepack prepare` に倒した。
- 注意: publish はタグ push が引き金。バージョン更新とタグ付けは指示なく行わない。

### D-7: 再帰の終了条件は goals 到達または truthy な directive

- 決定: `interactedBy` の再帰は `lastScene.course === "goals" || lastScene.directive` で止まる。
- 理由: 通常の終了はゴール到達。`directive` は利用側が定義する中断シグナル（確認ダイアログ待ちなど、シナリオの外に制御を返したい場合）のための脱出口。
- 注意: `directive` は truthy 判定なので、`0` や空文字を directive 値に使うと中断されない。

## 5. 未決事項

決まっていないことを明示する。ここにある項目は実装してはいけない。

- [ ] テストの方式（型テストをどう書くか、ランタイムテストのランナー選定）→ T-1
- [ ] `dist/` / `types/` のコミットを継続するか → D-3 / T-4
- [ ] `packages/express` を再設計して復活させるか、モノレポ構成自体をやめて単一パッケージにするか → T-3
- [ ] `Scenario#authorize` が delegate 未実装時に throw する一方、`UsecaseImple` 側は存在チェックで素通りする。この非対称が意図的かどうか
- [ ] 現行の `IScenarioDelegate` 方式（旧 `BaseScenario` 継承方式からの変更）を README にどう記述するか → T-2
