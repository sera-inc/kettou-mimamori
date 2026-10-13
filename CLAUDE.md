# CLAUDE.md — デザインシステム移行対象リポジトリ用（テンプレート）

<!-- 移行対象プロダクトのリポジトリ直下に置く。<> 内を埋めて使う -->

このリポジトリは自社デザインシステム（digital-design-system、DADS v2.17.1 基盤）への移行中です。
移行の正典: デザインシステムリポジトリの `docs/01_SaaS向けデザインシステム拡張_設計書.md` §6、
進行管理: `docs/03_移行手順チェックリスト.md`。現在のフェーズ: **Phase 5の最終配布検証（UI・日本語・実データ操作・全51状態axeを検証済み。全rootは1,566通過・上流保留3・失敗0、client-core263通過。ユーザーのデザイン承認と支援技術の確認回答を取得済み。配布用Docker検証・main反映・対象コンテナ停止は未完）**。

2026-10-12、ユーザーは今回のトークン選定と検証をCodexに委任した。
既存jQuery/D3の互換性を保つためDADS HTMLを土台とし、Reactへの全面移植は行わない。
最終反映を全作業終了後のmainへのcommit/pushと指定されているため、部品は一つずつ実装・検証し変更記録を残す。
原本のトークンは `static/design-system/tokens/` に同一内容で同梱する。
ビルドは `npm run bundle`、機能テストは隔離DBを指定して `node scripts/regression.cjs unit|integration|core|stress`。

## 移行の絶対規則（AIエージェント運用ルール / 設計書 §8）

1. **`docs/mapping.md` が唯一の置換根拠。** 表に無い値が出現したら、推測で置換せず
   「未解決」として報告する。表への追記は人間のレビュー承認が必要。
2. **1PR = 1コンポーネント。** 複数コンポーネントの同時変更は禁止。
3. **Layer 1 の改変禁止**: `--dads-*` 変数・`vendor/dads/` 由来コードは読み取り専用。
4. スタイルの判断根拠はデザインシステムリポジトリの `vendor/dads/docs/` と
   `tokens/semantic.css` を参照する。記憶やWeb検索で判断しない。
5. 品質ゲート（下記）を全通過するまで完了を宣言しない。
6. `outline: none` の追加禁止。フォーカスリングは `--app-focus-ring` を使用。

## フェーズ別の作業規則

- **Phase 2（トークン置換）**: 既存のCSS変数名は変えず、参照先のみ差し替える
  （例: `--color-primary: #0066CC;` → `--color-primary: var(--app-primary);`）。
  参照側コードは触らない。「見た目が変わったが機能は無傷」がゴール。
- **Phase 3（プリミティブ差し替え）**: 依存が少ない順（Button → Input → Select →
  Checkbox/Radio → Textarea）。DADS実装のアクセシビリティを損なう変更は禁止。
- **Phase 4（複合UI）**: Layer 3 コンポーネント（AppShell / DataGrid / Toast 等）を適用。
  自前実装を残す場合は `docs/deviations.md` に理由を記録。

## 品質ゲート

```
npm run lint
npm run build
npm test
npx axe <検証対象>   # または CI の test:a11y（critical/serious 0件）
```

<!-- プロダクト固有の起動・テストコマンドをここに追記 -->

## トークンの読み込み

```css
@import "digital-design-system/tokens/index.css";
/* ブランド色を差し替える場合は brand.css をプロダクト側で上書きし、
   WCAG 再検証の結果を docs/deviations.md に記録する（設計書 §3.5） */
```
