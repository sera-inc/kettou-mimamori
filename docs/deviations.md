# 適用方式と例外

| ID | 対象 | 理由・適用 | 検証 |
|---|---|---|---|
| KG-001 | DADS HTMLプリミティブ | jQueryのイベントID、D3のデータ結合、既存プラグインとの互換性を維持する。DADS HTML原本を保存し、Layer 3でセマンティックトークンに適合する。 | 既存試験、実ブラウザの入力・保存・キーボード試験 |
| KG-002 | 変更単位 | ユーザー指定の「全て終了後にcommit/push」に従い、公開PRの代わりにButton→Input→Select→Checkbox/Radio→Textareaの独立した実装・検証記録を作る。複数部品を同時変更しない。 | 各部品の実装順と検証記録 |
| KG-003 | 構造寸法 | グラフやドロワーの座標系を保持する必要がある寸法はremへの等価変換、または専用Layer 2エイリアスとする。余白と文字サイズはDDSスケールへ統合。 | 対応表、レスポンシブ表示、グラフ操作 |
| KG-004 | 第三者原本 | jQuery UI・colorbrewer・フォントの原本は保持。自社テーマからラップし、利用者に見える画面の色と操作性を検証。 | 原本差分、画面・axe検証 |
| KG-005 | トークン決定 | 移行手順の人間によるトークン選定を、ユーザーが今回に限り明示的に委任。 | 2026-10-12のユーザー回答、docs/mapping.md |
| KG-006 | テスト実行 | 上流の試験には環境変数・DOMグローバルを変更するfixtureがある。テストファイルを新しいNodeプロセスで実行し、試験のassertionや時間制限を変更しない。 | docs/verification/baseline-unit.json：319/319通過 |
| KG-007 | 受信予測の表示 | 予測モデル/配信色を保持し、rendererの表示だけ既定7色をDDSエイリアスへ変換する。既定の可視予測点は不透明度0.7以上へ補い、白背景で合成後の3:1以上を検証。過去/非表示/非有限/custom/noFadeの値は保持。 | forecast-paint/results.json、rendered/results.json、design-forecast-paint-plan.jsonの逆ソース/AST |
| KG-008 | 日本語の既定表示 | 新規ブラウザーの言語をja、時間を24時間へ変更。既存の保存済み言語/12時間設定、日時のepoch、通信値を保持。言語ファイル取得に失敗しても同梱した日本語辞書を使用。 | japanese/all.json、ui-regression.json、runtime/results.json。最終全機能検証は別途必要 |

手動の支援技術・人間の目視レビューは、実施できた証拠を得るまで完了扱いにしない。
# DataGridのHTML adapter

食品の一覧はdivとjQuery UIのdraggable/drop targetを維持し、ARIA table/row/columnheader/cellを付与する。DOMを全面的にtableへ置換するとドラッグhelperのサイズや配置・既存selectorを変えるため、現存する検索/編集/ドラッグの契約を保つ。その他の実テーブルはcaption/scopeとフォーカス可能な横スクロールregionを付ける。
画像の既存handlerを残し、外側のネイティブbuttonのEnter/Spaceから同じhandlerへ到達させる。検証はcheck-data-grid.cjsの実Chrome操作で行った。

## Phase 5の既存フォームへの意味の追加

accessibility.jsは、旧フォームの入力IDごとに用途をレビューした日本語名を与える。既存のネイティブlabel/aria-labelledbyを優先し、入力DOM・name・値・validation・event handlerを変更しない。プロフィールの動的な時間帯にも種類/時間帯番号/開始時刻または上下限を含む名前を付ける。
不正なprofileのdl構造は、元の要素を移動してdt/ddに整える。jQueryで登録済みのhandlerを保持し、入力をcloneして置換しない。入れ子dialogの閉じるボタンには画面名を含む名前を補う。labelが通ることだけで操作全体の完了は主張せず、再描画・追加/削除・CRUD・キーボードの検証を続ける。

## レポートのタブと食品ドラッグ代替

DADS HTML tabの原本CSS/TabAria/例をvendor/tabに保存。既存liのIDとswitchreport_handlerを保持する必要から、カスタム要素のID再生成やhidden制御を導入せず、HTML adapterでtablist/tab/tabpanel、roving tabindex、矢印/Home/End/Enter/Spaceを追加する。選択中の太字と線、44px領域、semantic focus-ringを適用。11種類の切替で既存の期間・目標血糖・メモ条件が変化しないことを確認した。

食品の新しい「追加先の食事」「食事へ追加」「一つ上/下」は既存jQuery UIのdrop/update callbackを呼ぶ。追加・食数・糖質・保存の別実装を作らない。非表示の食事がDOMから欠けることにより、元のsort callbackが誤った配列位置へ移動する不具合は、隣接する記録の元の配列indexを基準に修正した。6ケースで全記録と栄養/食数データの維持を確認。food-invariants.jsonはこのsort関数以外の全ASTが上流と同一であることを証明する。将来の日本語化後には新しい差分証明が必要。

動的な食事名・非表示・使用後の非表示・食数に日本語の名前と可視labelを追加。元のinputを移動してhandlerを保持し、再描画後のfocusを同じ記録へ戻す。上/下操作が端へ着くと無効になったボタンの代わりに同じ記録の反対方向ボタンへfocusを戻す。ポインターのドラッグ操作も保持・再検証。
