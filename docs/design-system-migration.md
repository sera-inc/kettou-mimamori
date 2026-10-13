# 血糖みまもり：デザイン移行記録

上流：nightscout/cgm-remote-monitor、基準commit 92d0834219aa771b5837dbcbf1baeb839a200cf6。
作業ブランチ：codex/kettou-mimamori-design。
デザイン基準：sera-inc/digital-design-system、commit 6051bceb67c60fb805b757c22bbd66f3318ea980、DADS v2.17.1。

ユーザーは2026-10-12に今回のトークン選定と検証を委任し、Codex内蔵画像生成の使用を承認した。

## 実行順序

1. 変更前の起動・既存機能テスト・主要画面キャプチャ。
2. inventory、対応表の作成、Layer 1/2を原本のまま導入。
3. ファイル単位のトークン置換。画面ロジック、ID、入力値、API形式は維持。
4. Button → Input → Select → Checkbox/Radio → Textareaを順に変更して検証。
5. 共通ナビ、スキップリンク、ダイアログ、一覧、状態表示を変更して検証。
6. 日本語化、企業表記、サンプルデータ、実画面検証、LP、Git反映、Docker停止。

## 検証と例外

Windows/OneDriveのファイル読み込みによる起動遅延とテストタイムアウトを観測したため、Docker内の依存ファイルで検証する。初回のWindowsテストはビルドが完了する前に開始したため、careportalのバンドル参照も失敗した。これらの結果は基準状態として合格扱いにしない。

jQuery/D3の画面をReactへ全面書き換えるとイベント、グラフ座標、プラグイン連携の互換性を失うため、DADSのHTMLプリミティブと同じネイティブ構造・トークンで適合させる。第三者のCSS原本は変更せず、共通テーマでラップする。血糖の閾値・計算式・用量計算・通知条件・認証ポリシーはデザイン変更の対象外。

ユーザー指定の最終反映はmainへのcommit/push。部品の変更と検証は逐次実施する。技術上の臨床外部連携は実機資格情報がないため、合成入力と既存テストで検証し、実機検証と区別して記録する。

## 2026-10-12：変更前検証の確定

Docker内、MongoDBのtestdbを使用。試験ファイルごとの新しいNodeプロセスで実行。
shouldのprototype assertionを共通で読み込み、他の試験ファイルからの暗黙的なimportに依存させない。
固定fixtureのCRLFをGit原本と同じLFへ正規化し、pills-goldenの捕捉時刻表示と同じAmerica/Los_Angelesで該当試験のみ実行。
fixtureの値やassertion、テストの時間制限は変更していない。実際の製品のタイムゾーンはAsia/Tokyo。

| 種別 | 通過 | 失敗 | 保留 | 証拠 |
|---|---:|---:|---:|---|
| 単体 |319|0|0|verification/baseline-unit.json|
| 結合 |704|0|3|verification/baseline-integration-isolated.json|
| 計算・プラグイン |263|0|0|verification/baseline-core-verified.json|
| 同時処理 |13|0|0|verification/baseline-stress.json|

保留3件は上流のreports試験。合格と数えない。変更前スクリーンショットはverification/baseline/。
変更前の空データ状態ではclock/configと時計画面に既存のpageerrorがある。サンプル投入後および空状態の改善時に別途検証する。

## Phase 2：トークンとグラフ表示色

11 CSSファイルを一つずつ適用・検査。対応表はmapping.md（456宣言）、template-mapping.md（25宣言）、chart-mapping.md（49文字列）。
原本のLayer 1/2は同一内容で同梱し、design-token-checksums.jsonにSHA-256を保存。
字句の「stored」を「red」と誤分類していたプロフィール背景は、画面レビューで発見して通常サーフェスへ修正した。
運動とメモの分類色はchart-semantic.cssにLayer 2として追加し、臨床閾値は変更しない。

グラフのASTは確認済みの色49文字列以外が同一、すべてのテンプレートのイベントID・EJS処理・scriptが同一であることをcheck-phase2-invariants.cjsで検証。
変更後も単体319、結合704、計算263が通過（verification/phase2-chart-unit.json、phase2-integration.json、phase2-chart-core.json）。
webpackビルド成功。上流にも存在したバンドルサイズの警告3件は継続して記録。
主要8ルートのキャプチャはverification/phase2/。clockの既存の空データエラーは残り、機能全体の検証はまだ完了していない。

## Phase 3：Button

先にButtonのみ実装。DADS HTMLのbutton.css/playground.htmlをvendor/button/に原本として保存し、Layer 3でネイティブ要素にDDSセマンティックトークンを適用。
既存のイベントとフォーム送信方式を維持。検証用のbutton-preview.htmlはPlayground相当。
実Chrome、幅390pxで、44pxの操作領域、11.10:1の文字コントラスト、Tabと可視フォーカス、Enter/Space、disabledのスキップ、ネイティブsubmitを検証し全通過。
証拠：verification/button/results.json、button/mobile.png。
既存単体319件、結合704件が再度通過（verification/button-unit.json、button-integration.json）。保留3件は上流からのreports試験。
Buttonの変更・検証を完了してからInputへ進む。

## Phase 3：残りのプリミティブ

Input → Select → Checkbox/Radio → Textareaの順で、一つずつ実装して検証を完了してから次へ進んだ。
各段階で既存の単体319件・結合704件が通過。結合の保留3件は上流由来。
各部品の原本はvendorに保存。実Chromeによる検証はscripts/check-{input,select,choice,textarea}.cjs。

|部品|実操作の検証|証拠|
|---|---|---|
|Input|必須・範囲・小数・日時値、readonly/disabled、可視フォーカス、既存プロフィール値の変更と復元（保存なし）|verification/input/results.json、input-unit.json、input-integration.json|
|Select|ネイティブの矢印キー・必須・disabled、mg/dlとUTCの保存値維持|verification/select/results.json、select-unit.json、select-integration.json|
|Checkbox/Radio|44px領域、Space・矢印キーの排他的選択、indeterminate、強制配色でネイティブ表示|verification/choice/results.json、choice-unit.json、choice-integration.json|
|Textarea|日本語複数行、必須・maxlength、HTML文字列、エラー説明、readonly/disabled|verification/textarea/results.json、textarea-unit.json、textarea-integration.json|

## Phase 4：AppShell

DDS AppShellとuseFocusTrap原本を保存し、既存jQuery/D3向けにHeader → Nav → Mainへ適用。
主要5画面の200応答、pageerrorなし、aria-current、スキップリンク、モバイルのTab循環・Escape・背景クリック・フォーカス復帰・mainのinertを検証。
時間範囲はネイティブbuttonにし、既存liのdata-hoursをclosest('li')で参照。6時間のクリック・3時間のEnterが計算上のfocusRangeMSに反映されることを確認。
設定ドロワーと表示オプションも既存イベントで開く。トークン付きURLは同一サービス内リンクへ引き継ぐ。
キャプチャからモバイルの旧absolute配置とButtonの詳細度による重なり・選択色不明を発見し、配置と選択色を修正。縦に長い画面・低い画面はスクロール可能にし、グラフ高さ24remを確保。
証拠：verification/app-shell/results.json、desktop.png、mobile.png。
変更後の単体319・結合704（保留3）・計算263が通過。app-shell-{unit,integration,core}.jsonに記録。
webpack成功（上流由来のサイズ警告3）。変更した3 clientファイルのlintは通過。
全体lintは変更していない上流ファイルに8エラー・16警告。最終品質ゲートで解消するまで全体完了扱いにしない。

## Phase 4：DataGridと入力配置

DDS DataGrid原本をvendor/data-gridに保存。HTML adapterを実装し、既存のテーブルにはcaption・scope・フォーカス可能な横スクロール領域を追加する。
食品は既存のdiv/ドラッグ対象を保ち、ARIA table/rowgroup/row/columnheader/cellとして意味を補う。検索・編集・ドラッグ用のID/class/indexを変更せず、画像の既存jQuery handlerをネイティブbuttonから呼び出してEnter/Spaceに対応。
スマートフォンでは食品の編集フォームを一列にし、表の横スクロールだけを領域内に限定。食品・プロフィールの状態メッセージは見出し下へ移し、固定ヘッダーの重なりを解消した。
実Chromeのverification/data-grid/results.jsonで食品検索・IDと糖質値の維持・キーボード編集・quickpick作成・ドラッグ追加・プロフィール時間帯の追加/削除・基礎値0.6維持・管理権限表のcaption/scope・横幅を確認。食品GET/POSTはブラウザで合成fixtureへ置換し、DBへの保存は行っていない。
単体319・結合704（上流保留3）が通過（verification/data-grid-unit.json、data-grid-integration.json）。
同じコンポーネントの最終キャプチャとブラウザ試験は、状態メッセージ位置の修正後に再実施済み。全体のCRUD・アクセシビリティは後続の品質ゲートで検証する。

## Phase 4：EmptyState

DDS EmptyStateのCSS/TSX原本を保存し、CSSを同一内容で適用。初期データなし・検索結果なし・起動失敗を区別する。
グラフの空状態を明示し、測定データなしを0として表示しない。食品の検索条件に応じてno-data/no-resultsを切り替え、利用者・機器の空一覧にも案内を出す。
時計の誤った&&判定がbgnow未定義やsgvs未定義で例外を起こしていたため、安全に測定配列を取得して空状態にする。null/未定義のbgnow/未定義配列/空配列/null配列の5パターンから正常100mg/dL表示へ戻る試験を追加。時計の既存5試験と追加5試験が通過（verification/empty-state-clock.json）。この時計試験は既存test:unitの選択対象外なので単体319件とは別に数える。
単体319・結合704（上流保留3）が通過。empty-state-{unit,integration}.json。
実Chromeは空DBのグラフ、時計と設定の欠損応答からの復帰、食品の空/検索ゼロ、実splitの空状態、5件のURL/名前を持つEJS fixture、起動エラーEJS fixtureの再接続導線を検証。pageerrorは0。証拠はverification/empty-state/results.jsonとキャプチャ。
複数画面の既存FRAME_URL/FRAME_NAME契約を保持し、奇数件時の未設定iframeをなくして実設定だけを表示。frame/error/clockテンプレートへUTF-8宣言を追加し、fixtureの日本語名が文字化けしないことも確認。
時計の色や設定フォーム・通知・設定ドロワーの刷新、全体アクセシビリティは未完。

## Phase 4：時計設定と表示色

時計設定にAppShell・DDSフォーム・プレビューカードを適用。すべての既存cfg ID/name、サイズ初期値、face grammar、暗い背景、経過時間、閾値、改行、undoを保持した。
プレビューのサイズは対応ブラウザでcqminにし、全画面は従来のvminを保持。多くの要素を追加した場合はプレビュー内をスクロールできる。ネイティブの1〜99のサイズ検証と、設定URLへの既存tokenの引き継ぎを追加。
背景色だけをDDSのsemantic tokenへ変更。閾値や比較演算・データ単位・古いデータの打消し線・矢印・絵文字の判定は維持。
旧red/yellow/green/blue → danger-bg/warning-bg/success-bg/primary-bg、旧black背景 → text（暗色）とsurface（白文字）、旧grey/blackの古いデータ → surface-sunken/text。明るい色背景の文字はtextに統一し、暗い背景と区別する。
実Chromeで54/55/80/180/260の境界と対応色、11.09以上の文字コントラスト、暗い背景12.63、古いデータ、全表示要素の生成とundo、モバイル幅とキーボードナビを確認。verification/clock-design/results.json、config-{desktop,mobile}.png。
既存＋追加の時計10試験が通過（verification/clock-design-unit.json）。変更ファイルlint・CSS検査・webpackが成功。全root試験・通知・ドロワー・a11yは続けて検証する。

## Phase 4：Toast

DDS Toast.css/Toast.tsx/useToastQueue.tsを原本として保存。純粋なキュー処理（定数2つとcreateToastStore）だけをTypeScript compilerで型除去し、同じロジックをHTML adapterから使用。原本SHA-256を生成物に記録する。React hookは製品に導入しない。
`TYPESCRIPT_MODULE_PATH`をインストール済みTypeScriptへ指定してscripts/generate-toast-store.cjsを実行すると再生成できる。製品の実行時にはcompilerやReactを必要としない。
元のshowNotification/closeNotification APIから呼ぶ。info/warn/success/urgentの意味を保ち、従来の通知は明示的に閉じるまで保持する。安全なリンク・強調等のHTMLを保持し、実行可能なmarkupを除去。ポインタ・キーボードのフォーカスを奪わず、閉じたときは起動元へ戻す。
新しい通知の最短5秒・最大3件・FIFO・hover/focusの独立した停止理由・action付きの永続表示は、原本のキューをそのまま用いる。polite/statusとassertive/alertを常設する。
純キューの時間制御試験はverification/toast-store.json、実Chromeの既存API/リンク/永続/キーボードclose/フォーカス復帰/キュー/clear/アクション/モバイルはverification/toast/results.jsonとmobile.pngで通過。
時計とToastの変更後、既存test:unit/integrationの選択外も含む全root *.test.jsを、元のnpm testと同じ5秒制限で新しいプロセスごとに実行。1538件通過・失敗0・上流保留3、結果はverification/clock-toast-all.json。client-coreの別ディレクトリ263件とは別に数える。assertionや時間制限を緩和しない。全体の最終ゲートはドロワー・a11yなどの変更後に再確認する。

## Phase 4：設定・記録・計算・管理通知ドロワー

既存browserUtilsのopen/close/toggleと各入力ID・イベントを維持し、DDSのフォーム・面・境界・影を適用。名前付きdialog、背景のinert、Tab循環、Escape、背景クリック、閉じるボタン、起動元へのフォーカス復帰を追加した。
閉じるボタンが既存の「ドロワー内の全buttonで保存する」selectorへ混入しないよう、careportal/boluscalcの保存handlerからdata-drawer-closeを除外する。clinical計算と保存payloadは変更しない。
入れ子のjQuery UI食品選択は既存dialogの処理を保持し、Escapeで食品選択だけを閉じる。外側のドロワーへイベントを横取りしない。
確認用ComposeのSHOW_PLUGINSにcareportal/boluscalcを含め、認証に従った通常の導線から検証する。操作を表示するとスマートフォンの固定ヘッダー右端からお知らせがはみ出したため、同じIDの操作群を見出し下へ移して折り返し、操作名を表示する。権限による表示制御は維持した。
実Chromeの6ケースが通過。4ドロワーの390×844表示・keyboard・focus、入れ子dialog、448pxのdesktop幅と背景closeを確認。記録追加に有効な下書きを入れた後で閉じ、保存リクエスト0・確認dialog0・pageerror0だった。証拠はverification/drawer/results.json、*-mobile.png。
操作群をネイティブbuttonにして既存のclick handlerを保ち、4種類ともSpaceで開く実操作も通過。DDSのoutline buttonを用い、アイコンに加えて操作名を表示する。
ドロワー内の動的なred/blue/blackの色・影8箇所もmapping.mdへ追加選定した上でsemantic tokenに統一。check-drawer-invariants.cjsで、レビュー済みの色/影と閉じるボタン除外だけを逆置換した3ファイルの完全ASTが上流基準と一致することを確認した。入力判定・計算・confirm文・ネットワークpayloadの構造は維持。証拠はverification/drawer-invariants.json（この段階の差分証明であり、後続の日本語化後は別途確認する）。
CSS検査・変更ファイルlint・bundleが通過（webpackの上流サイズ警告3）。Dockerが停止した初回の全root試験は成功として数えず、復旧後に再実行し1538通過・失敗0・上流保留3を回収した。verification/drawer-all.json。先に完了済みのclient-core263通過もverification/drawer-core.jsonへ回収。最終的なネイティブ操作ボタンの適用後に、主要5画面、時間範囲、skip link、スマートフォンのナビ/フォーカス/横幅/グラフ高さも再検証して通過。verification/app-shell/results.jsonとキャプチャを更新した。

## Phase 4：Skeleton・読み込みと再接続

DDS Skeleton.css/tsxを原本として保存し、CSSを同一内容で利用。全画面の旧ロゴ/3点spinnerを、実際の血糖・時刻・グラフのコンテナ内に置くプレースホルダへ変更した。装飾はaria-hidden、groupはaria-busy、読み込み/完了と接続状態は日本語のstatusで通知する。既存centerMessagePanel/loadingMessageText/currentTime/currentBG/chartContainerのIDを維持。
原本のprefers-reduced-motionとforced-colorsを保持。受信前・接続断では測定値を隠し、データの描画完了後にbusyを解除してプレースホルダを除去する。グラフ座標はロード中だけ既存bottomOfPillsと同じ画面幾何を使用し、血糖計算や受信データを変更しない。全画面のオーバーレイをなくしたため、読み込み中もナビと認証dialogへ到達できる。
既存initの接続失敗/認証後のsetTimeoutには、関数の代わりにinitの実行結果を渡す不具合があり、即時に再要求していた。5秒待つ関数に修正。起動待ちを含む3経路で完了callbackも引き継ぐ。check-startup-retry.cjsは現在の実init関数をASTで取得して試験し、即時要求が増えないこと・5000ms・callback同一性を確認。verification/startup-retry.json。
実Chromeはdesktop/mobileの装飾の寸法・未受信値の非表示・busy解除・空データ表示・減速/強制配色・接続断後reloadを検証。さらに一度の接続失敗/起動待ち/401 fixtureから、実サーバーのstatus/言語/データ/認証の処理へ復帰することを確認。いずれも最初の3秒は要求1件、5秒後の再試行を経て2件で成功。pageerror0、API保存0。verification/skeleton/results.json、loading/ready-{desktop,mobile}.png。
視覚確認でoutline buttonの詳細度がbase ruleに負けていたため修正し、アイコンの旧固定高さ/色も親に追従させた。両ボタン形式の文字コントラスト11.09、44pxとnative keyboard/submitが通過。verification/button/results.json。Skeleton修正後のAppShellと4ドロワーも再度通過。
変更ファイルlint・CSS検査・bundleが通過（上流のサイズ警告3）。全root1538通過・失敗0・上流保留3、client-core263通過をverification/skeleton-{all,core}.jsonに回収。次はPhase 5の全体a11yと品質ゲート。人間のデザイン/NVDAレビューはまだ未実施。

## Phase 5：自動アクセシビリティとキーボード

axe-core 4.13.0・Playwright 1.62.1を固定したdev依存として追加。古い依存バージョンは変更しない。check-a11y.cjsは無効化や除外なしに全default ruleをdocument全体へ実行。desktop/mobileの8ルート、レポート11タブ、4ドロワー、入れ子食品選択、認証、mobile navの51状態を検査する。初回29状態の89指摘をinitial-audit.jsonに保持。レポート全タブを含めたsemantic-pass-1.jsonでは8指摘が残り、修正後のkeyboard-pass.jsonでは全違反0・critical/serious0・pageerror0・保存0。

HTML言語・ズーム制限・title、旧フォーム入力名、profileのdl構造、空の操作header、名前付きclose、時計の見出し、凡例コントラスト、inline link下線を修正。全8ルートの静的titleは日本語にし、空データの動的titleはページtitleをfallbackとして保持。アラーム/血糖によるtitleの優先順位は維持。mobile navの外側をdiv dialog、内側をnative navとしてARIAの役割衝突をなくした。

check-report-tabs.cjsは11種類のレポートを矢印/Home/End/Enter/Spaceで切替え、active panel一つ・roving stop一つ・focus可視・Tabでフィルターへ移動・期間/目標/メモの維持・横幅をdesktop/mobileで確認。verification/report-tabs/results.json。DADS tab原本はvendor/tabに保存した。

check-food-keyboard.cjsは合成GET fixtureで食品を選択した食事へSpaceで追加、食数変更、Enter/Spaceで上下移動を確認。既存のdrop/update callbackと計算で55g→110gになり、再描画後のfocusと記録/食数が維持される。非表示の食事を含む並べ替え後に「表示する」を有効にし、非表示の記録を含む全順序も確認。両viewportでaxe全違反0・例外0・API保存0。food-order.jsonの6ケースとfood-invariants.jsonでsort以外の既存ロジックを確認。verification/food-keyboard/results.jsonとキャプチャ。元のドラッグ操作・profile追加削除・管理表もcheck-data-grid.cjsの再実行で通過。

main向けaccessibility.ymlを追加し、Mongoの隔離デモ・bundle・起動・axe・証跡保存を組み込んだ。GitHub上のCI実行はまだ行っていない。ローカル合格をCI合格とは記載しない。自動結果には重なりやcanvas背景等で判定不能のincompleteが16件あり、除外せず保存した。手動デザイン・NVDA・UIチェックリスト、全機能keyboard、グラフ系列色、全体lintと最終回帰ゲートは未完。

食品sort修正後の全root回帰は1538通過・失敗0・上流保留3（133ファイル、1541tests、348suites）。verification/accessibility-all.json。この結果は後述のlint整理より前のsnapshot。AppShellの5画面・時間範囲・skip link・新しいdiv/native nav構造のmobile trap/restoreも再度通過。

## Phase 5：lint品質ゲート

上流で残っていた8エラーを7ファイルで整理した。未使用の分割代入をrequire呼び出しだけにしてmoduleの副作用を維持、同じ関数scopeのvar i再宣言を除去、未使用callback引数/ctxを除去、未使用のprofile wrapperだけを削除、websocketの初期化呼び出しを維持して未使用bindingを削除、Mongoの無条件retryを等価なfor (;;)へ変更。check-lint-invariants.cjsはこれらの変更だけを逆変換した全ASTと上流との一致を確認。profileは使われていないwrapper以外が同一で、実際のmigrateRecordStoreと時間帯計算は保持。verification/lint-invariants.json。

npm run lintはexit 0・エラー0、元からあるsecurity plugin警告16件は残る。新しいaccessibility.js/food-keyboard.js/app-shell.jsもESLint通過。警告を無効化したり全体を無警告と記載したりしない。scripts/regression.cjsに既存root試験の明示的なselectedモードを追加し、変更関連9ファイルを元の5秒制限・別プロセスで確認。57通過・失敗0・保留0をverification/lint-regression.json、lintの結果をlint-quality.jsonへ保存。整理後のbundleも成功（従来のサイズ警告3）。最終的な全機能/全文言/人間レビューを済ませるまで移行完了扱いにしない。

レポートの直接指定はaudit-report-styles.cjsで131レコードを追加抽出。verification/report-styles/inventory.json。これはcolor文字列と埋め込みstyleの作業一覧であり、131件がすべて移行・検証済みという意味ではない。Flotのcolor parserに未解決var()を渡さず、実トークン色の解決と合成データによるseries/値の検証を次工程で行う。

lint整理後のbundleをappの専用依存volumeへ反映し、当appだけを再起動。APIがloadedへ戻り、実Chromeで食品検索/編集/旧ドラッグ、profileの時間帯追加削除、管理権限表の4ケースを再度通過。ソース・DB・両node_modules・無関係の稼働中コンテナを保持した。

## Phase 5：レポートの実描画とトークン移行（進行中）

初回の131件一覧はCSS色名とtemplateの抽出が限定的だった。audit-report-styles.cjsを148色名・埋め込みtemplate・font style/attrまで広げ、171レコードをcomplete-before-inventory.jsonへ保存。選定済み186置換を10モジュールに逐次適用し、design-report-migration.cjs verifyでレビューした見た目だけを逆置換すると全ソースSHA256とASTが変更前に一致する。内部のgray/raw判定、透明sentinel、血糖分類、データ系列・計算・フィルターは維持。Flotはsemantic tokenの実色を描画境界で解決し、SVGはsemantic varを使用する。追加したLayer 2カテゴリ以外のdads/brand/semantic原本3ファイルはSHA256一致。

12校正カテゴリと7曜日カテゴリを実Chromeで確認し、すべてグラフィック3:1・対応面上の文字4.5:1以上、各パレット内の色値の重複なしを確認。初回の不適合3組はtheme-initial-observation.jsonに保持し、mapping.mdへ追加選定後に製品エイリアスだけを修正。検証theme.json。これは色値の区別とコントラストの証明であり、人間による色覚・見分けやすさの確認は未実施。

14日分4060件の合成entryと70件のtreatmentをブラウザー内GET fixtureとして使用し、元のShow操作で11種類を変更前後とも描画。DB書き込み0・例外0。42日別SVG、2週間SVG、14日別Flot、配分/時間帯/パーセント図、校正SVG、全表、Loopalyzerの5つのFlotと有限の血糖値を取得した。before/results.jsonとafter/results.jsonに保存。ただし厳密比較の初回はDateオブジェクトとJSONのISO文字列/NaNとnullの表現差、次にパーセント図のnew Date()に残る実時刻の秒・ミリ秒差で失敗。10種類の内容一致は診断済みだが、11種類すべての最終比較成功はまだ宣言しない。

比較ハーネスを同じJSON表現で照合するよう修正し、Playwright clock.setFixedTimeでDate.nowとnew Dateの両方を固定（タイマーは動作）。旧バンドルでfixed-clock-before/results.jsonを再取得済み。その後、更新バンドルへ戻してAPI readyを確認。データ入りaxeとfixed-clock-afterの実行は日別図のキャプチャでタイムアウトし未完。旧51状態の自動合格をこの実データ状態の合格として扱わない。未完の途中結果を保存するようにし、10000px超の長い日別画面はviewportキャプチャへ分割する方式へ変更した。再実行・11種類の比較・データ入りaxeの指摘修正が必要。

実描画で発見した上流不具合として、Loopalyzer.interpolateArrayが空/288個すべてNaNで終端を越えて無限ループするため、終端チェックを追加。現在の実関数をVMで実行し、元の2欠損ケースがtimeout、修正版は欠損を維持、有限・上昇・下降・負値の5ケースは上流出力と完全一致。interpolation.jsonの7ケース通過。さらに、元のgetSGVsは5分区間の両端を除外するため、正確な5分刻みの測定が欠損になる既存挙動を発見。今回の見た目比較は区間内のサンプルを使っている。この境界挙動の機能修正・検証は未完で、サンプル/全機能段階で必ず扱う。14日の既存処理時間は約52〜59秒で、値の保持を優先し計算の最適化は行っていない。

全体lintはエラー0・既存警告16、bundle成功（従来のサイズ警告3）。既存reportstorage4ケース通過、reports2ケースは上流から保留のまま。report-tests.json。全rootの最終検証は後続変更後に必要。動的校正checkboxとLoopalyzer入力6個に日本語のアクセシブル名を追加。Flotの凡例がDataGridとして全幅に拡大してグラフを覆っていたため、レイアウト用tableをpresentationとして分け、DDSの文字・境界トークンを適用した。追加adapterのlintとCSS検査が通過したが、実描画後のアクセシビリティ・レイアウト再検証は継続中。

両リポジトリのnode_modulesは残している。削除はローカルの起動/ビルド/テストを止め、再インストールが必要になる。稼働中appは専用Docker依存volume、DBは別のdata volumeなので、この2フォルダの削除だけではそれらを直接停止/消去しない。削除を無影響とは扱わず、現在の検証で必要なため保持する。

## Phase 5：実レポート、Popover、再接続の追加検証（2026-10-13）

14日分の全11種類の厳密比較はfixed-clock-after/comparison.jsonで成功。その後、治療表の追加境界1宣言を選定・反映し、表示だけを逆変換した187宣言の全ソース/AST一致を確認した。データ入りaxeではレイアウトregion名の重複と3個の空見出しを修正。日別「血糖範囲の分布」、時間帯「日付」、治療「操作」の見出しだけを明示的に比較差分から外し、数値・実系列・凡例ラベル・SVG座標は厳密に維持する。

最終の全11種類のShow操作、比較、データ入りaxeはreport-styles/final-flow-reconnect/results.json、comparison.json、a11y.jsonで完了。全系列・臨床表セル・SVG座標の一致、全違反0、例外/保存0。Loopalyzerの5図にも有限の血糖値が入る。これらはブラウザー内のGET fixtureであり、DBへの本サンプル投入と実機のデータ連携試験は別工程で未完。

警報停止と予測のメニューへDDS Popover原本4ファイルとHTML adapterを追加。実際の警報callbackと3個の停止時間を使用し、キーボードEnter/Space/矢印/Home/End/Escape、44px領域、viewport内表示、同じ予測設定の保存・focus復帰をPC/mobileで確認。停止時間75分のsocket ackは元の[1, BG High, 4500000]と一致し、検証では送信前にinterceptする。API保存0。初回は予測checkboxのaria-checked更新順序と、共通buttonのID詳細度による青い面の誤継承を検出し修正。最後のmenus/results.jsonは面トークンのcomputed styleを含めて全ケース通過し、両メニューの全axe違反0。原本SHAも一致。

プロフィールの時間帯追加・削除後、再生成された開始時刻selectへfocusを戻す処理を追加した。check-data-grid.cjsの4ケースは元のdrag/drop、食品編集、基礎値0.6、時間帯追加削除、管理表を保持して再通過。保存せず検証する。全root回帰はreport-menu-all.jsonで1538通過・失敗0・上流保留3（133ファイル、1541tests、348suites）。このsnapshotは次の再接続修正・追加文字サイズ変更より前であり、最終出荷ゲートとは区別する。

実データ+axeの途中に期間が7日へ戻る現象を発見し、filter-changes.jsonのsetter traceからsocket authorize完了の再初期化を特定。変更前の実再認証で期間・目標値・active tabが初期値へ戻り、plugin objectが置き換わることを再現。reportclient.jsのloaded callbackに一度だけの画面初期化を追加し、client本体の権限確認・再接続・データ受信処理は保持した。report-reconnect/results.jsonは実際の再認証とtransport disconnect/connectでPC/mobileの4ケースが通過し、フィルター・メモ・tab・plugin identityを維持、Show handlerは1個のまま。全11描画のfinal-flow-reconnectもこの修正後に通過した。

最新の空/プロフィール状態とダイアログ等51状態の全axe検査もa11y-report-menu/results.jsonで全違反0・重大0・例外0・保存0。自動判定不能項目は保存し、目視/支援技術の確認を省略しない。人間によるデザイン・NVDA・色覚とUIチェックリスト確認、全機能の業務検証は未完。

クライアントで残る固定文字サイズと黒影13宣言を追加抽出し、mapping.mdとdesign-client-type-plan.jsonへ選定後、chart→renderer→boluscalcの順に移行した。治療ラベルの数値/件数/scale計算は維持し、描画の返り値だけを本文トークンに換算する。client-type-invariants.jsonで全ソース/AST逆変換一致、client-type-core.jsonで計算263通過・失敗0、各モジュールlintとbundleも通過（既存サイズ警告3）。実表示の最初の比較は空状態adapterの非同期layoutを待たず、chart高さが28px異なるため失敗。元の条件を緩めず、fonts.ready、adapterの2描画フレーム、元のresize操作とD3 transition完了を待つ方式に整え、旧バンドルでbefore-stableを再取得した。変更後との厳密比較は続けて回収する。

DDSトークン原本4ファイルは再度SHA256一致。両リポジトリのnode_modules、DB volume、無関係のコンテナは保持している。

文字サイズの比較はbefore-stable/after-stableでPC/mobileの実系列座標・食品表・糖質90g・元のインスリン計算値が厳密一致した。最終のキャプチャを目視すると、ブラウザーへ直接渡した治療fixtureに、サーバーのtreatmenttocurveが付与するmgdlが欠け、親gのtransformが非有限になっていた。旧/新とも同じ表示だが、このfixtureでは正常配置の証明にならない。食品計算・型の逆ASTの証跡は有効として保持する一方、治療の画面証拠は正式な描画payloadのmgdlを追加し、親gを含むtransformの厳密比較・有限座標assertを追加して再取得する。合格条件を緩めない。

治療fixtureのmgdlと親gの検証を補った最終比較はclient-type/before-positioned/results.json、after-positioned/results.jsonでPC/mobileとも通過。全治療gの時刻/血糖座標が有限で、表示位置を目視で確認した。親gを含む全SVG座標・治療/軸テキスト、食品2食分300g/糖質90g、元の補正/IOB/最終量などの計算値は厳密一致。文字サイズと影だけが選定した表示差分。最終画面はafter-positioned/*-chart.pngと食品選択後の*.png。改善前の不完全なfixtureキャプチャを最終画面として使用しない。

残存監査ではopenaps/loopの配信データに予測の既定色がある。通信・分類値を変えず、rendererの描画境界でDDSの色に解決する方式を次に確認する。旧「全体CSSに生値なし」の検査だけで、受信データの実色まで全面移行済みとは宣言しない。全文日本語化、企業/ブランド、DB本サンプル、LP/公開サイト、Git最終反映、Docker終了も継続して実施する。

## 受信予測の色と日本語表示の追加検証

forecast-paint.jsは既定7色を描画境界でDDSへ解決する。配信値・モデル・時刻・血糖値は保持し、可視の既定予測点は不透明度0.7以上へ補う。7色の白背景合成後の3:1以上、凍結レコード/custom/noFade/過去/非有限の保持、3境界の逆ソース/ASTとPC/mobile実描画の元の幾何・食品/投与量計算の一致をforecast-paint/へ保存した。これは日本語化前の比較であり、現在の日本語画面の高さまで同じとする証明ではない。

日本語辞書は705キーの416値を修正し、未登録UIキーと混在ラベル137行を追加レビュー、831キーになった。各辞書planを逆順に取り除くと、キー/差し込み値と英語の既存値が上流と一致する。D3/momentの日時、言語30選択肢、全タイムゾーンの日本語名、認証/管理/計算の補助表示、DataGridの翻訳後のaria-label、jQuery UIの閉じる名を対応。タイムゾーンの元の値/選択肢や権限DSLを翻訳して保存しない。japanese-ui-text.cjsはこれらの技術識別子や出典の固有名詞を理由付きで別記し、任意の英語の文章を除外しない。

日本語化の初回全rootは1542通過・既存保留3、UI追加50・初期化/fallback29・プロフィール互換16が通過。ui-all.jsonでは薄いプロフィールclientにlanguageがない場合の1失敗を記録し、productionのhelper省略時fallbackを修正した。ui-all-corrected.jsonは1543通過・失敗0・保留3。元のsecurity/option-valueのassertionを変更していない。runtime/results.jsonは実ChromeのPC/mobileで既定ja/24時間、保存済みja/12時間、辞書503時の同梱日本語、明示的なen/12時間、設定の保存/本当のreloadの8ケースを確認し保存API呼び出し0。bundleは成功し既存サイズ警告3が残る。

ui-classified/results.jsonは51状態の全axe違反0。populated-reports/results.jsonは14日分の合成データで全11種類を描画し、全種類axe違反0・例外0・保存0。校正の数値ラベルとプロフィールのtimezone表示を追加修正した2種類はpopulated-reports-corrected/で再検証。Sensor Changeの未登録翻訳はまだ残る。11モジュール/テンプレートの表示変更は逆ソースSHAと必要な元のASTで確認している。

主画面のclinical-rendering/の最初の日本語比較は失敗のまま保持する。日時は元と同じDateから12時間/24時間の各期待表示を確認したが、日本語化で上部のcontainer高さが417.9375→444.125pxとなり、その分グラフ高さが減るため同じviewportの座標が異なる。レイアウト/グラフの関係を確認し、表示領域を揃えた比較や元の系列/投与量計算の確認を続ける。未通過を成功として数えず、人間のレビュー、日本語の全条件分岐、全業務機能と最終ゲートも継続する。


## 日本語の表示領域と会社表記の確認

Sensor Changeの未登録を追加し、辞書は832キー・追加UIレビュー138行になった。japanese/clinical-matched-bounds/results.jsonはPC/mobileで実際の日本語レイアウトを記録した上で、比較時だけ同じプロット領域を作り、全SVG座標・予測レコード・食品/投与量計算を元の表示と厳密に比較して通過した。12時間/24時間の表示差は両者を同じDateから検証する。比較用CSSは除去し元の高さへ戻してから操作と最終キャプチャを行う。同じviewportの元の失敗証跡は残し、日本語でも容器高さが不変という主張はしない。

company/runtime/results.jsonは主要8経路のPC/mobile16ケースで会社・メールリンク・タイトル・keyboard到達・横はみ出しなしを確認した。プロフィールの長い日本語タイムゾーンがflex子の最小幅で横にはみ出す問題を検出し、dt/ddのmin-inline-size:0とmax-inline-size:100%で修正した。選択肢/値/プロフィール操作は変更していない。展開した会社/著作権/ライセンス欄のaxe全違反0、manifestと実API1/API3連絡先、既存status.name=nightscoutの互換性を確認。company/regression.jsonは52通過。7ソースのレビュー変更を厳密逆変換し、package/API metadataの全体ハッシュも比較。サンプルDB、ブランド、LP、全条件分岐、人間のデザイン/NVDA、最終ゲートは引き続き未完。


## 実DBのサンプルと保存操作（2026-10-13）

seed-demoは接続先をローカルのkettou_demoに固定検査し、JSTの14暦日分の血糖/測定/校正/治療/食品/定型セットを自身の記録だけにupsertする。実患者の情報や外部DBへの接続は使用しない。Loopalyzerが開始と終端の両方を除外して5分ちょうどの血糖を全て捨てることを再現し、[開始, 終端)へ修正。loop-boundary-plan.jsonで元のソースへ厳密に逆変換し、loopalyzer-boundary7試験と関連37回帰を確認。

demo-reports-finalは実HTTP応答とDB保存の約3,900点を使う全11種類のShow操作で、全axe違反0・ブラウザー例外0・保存0・英語候補0。元のdemo-reportsは会社案内がランドマーク外というmoderate指摘を全種類で記録したため、toolbarの会社案内をcontentinfoに修正し、指摘の証跡も保持する。demo-a11yはサンプル入り51状態の全違反0。メールと元の著作権の固有名詞は厳密なラベル/URL条件で理由付き識別子とし、任意の英語を除外しない。

demo-crudは実際の画面から食品を作成/再読み込み/編集/再読み込み/削除し、将来の検証用プロフィールだけを画面で保存して再読み込みで値を確認。治療とプロフィールのAPI CRUD、閲覧だけの権限の作成拒否(401)を確認。削除はその実行で作ったIDだけ。保存の英語statusを日本語へ置き換え、19回帰・厳密逆ソースと食品の全ASTの比較が通過。

食品選択の一食分/糖質/表示単位、経過のd/h/mを表示境界で日本語化。display-ageは4つの年齢pluginだけの日本語DOM表示を解決し、元のoptions/modelを変更しない。非日本語/他plugin/不明な形式/欠損は保持し、入力長を64文字までに限定する。demo-localizationはPC/mobileの元のmodel displayと日本語DOM、保存された食品2食分の110g、4全document axe scan、英語候補0/例外0/保存0を検証。関連29回帰・13モジュール/テンプレートの厳密逆ソースが通過した。辞書は837キー、追加レビュー143行。demo-previewはPC/mobileの主要4画面8件の実サンプルキャプチャと、最新サーバー血糖/全chart座標の有限値/食品/定型セット/基礎値0.6と元のIANA選択を確認する。全業務の残りの操作、分岐、人間のNVDA/デザイン、最終ゲートは未完。

## 2026-10-14 最終候補の確認

過去の節は各段階の記録であり、そこにある「未完」は当時の状態。最新のUI、日本語、サンプルの実保存・再読み込み、利用者/権限、期間保守、API説明画面まで検証済み。最終全rootは1,569件中1,566通過、上流保留3、失敗0。client-coreはgoldenと同じLinuxのAmerica/Los_Angeles・en_US.UTF-8で263通過。lintはエラー0・既存警告16。デザインはユーザーが承認し、動的な血糖・表・設定dialogの支援技術確認について「確認済みで問題なし」と回答した。具体的な支援技術の版や、人間が全機能をキー操作だけで完走したことまでは主張しない。

初期Phase 2専用のcheck-phase2-invariants.cjsは、その後の日本語・文字サイズ・ブランドを含む現行ソースに直接実行する最終ゲートではない。現行ソースへの直接実行は「unreviewed literal」で失敗したまま記録し、許容条件を拡張して成功扱いにしない。現在はdesign-client-type-migration.cjs verify、migrate-japanese-ui-source.cjs verify等の固定した段階別planを逆順に取り除く全ソースSHA/AST比較が通過する。臨床payloadや計算は別途実画面・全root/coreで照合する。

公式UIチェックリストの取得ハッシュとレビュー範囲はdigital-ui-review.md。DDSトークン/DADS-VERSIONの原本一致を再確認し、HTML adapterの互換性例外をdeviations.mdに保存した。次プロダクトへの展開は本依頼の対象外。配布用Docker・main反映・対象コンテナの最終停止は別途完了証拠を取得する。
