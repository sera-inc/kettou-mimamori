# 血糖みまもり 最終検証

2026-10-14。サービス名は血糖みまもり、公開ソースは sera-inc/kettou-mimamori。NightscoutのAGPL、著作権、機器/APIの既存識別子を保持する。会社・問い合わせは株式会社世良 / info@sera-inc.co.jp。

## 製品と配布物

- 最終全root：138ファイル・353 suites、1,569件中1,566通過・失敗0・上流保留3。`verification/final-all-regression.json`。
- client-core：goldenと同じLinuxのAmerica/Los_Angeles・en_US.UTF-8で263通過。Windows既定ロケールでの日時4件の差は成功扱いにせず、goldenを変更していない。
- lint：エラー0・既存security警告16。全51状態、全11レポート、API説明画面等でaxe違反0。判定不能項目は証跡に保持する。
- 実DB/UIによる食品・治療・プロフィール・利用者/権限のCRUD、再読み込み、期間保守、閲覧だけの書込み拒否、通知音拒否・再試行、再接続の条件維持を確認した。実機センサー・物理音声・外部通知プロバイダーは実機での接続試験を代替しない。
- 合成データをローカルのkettou_demoに投入。最新投入は4,067 entries（血糖4,039）・治療128・プロフィール1・食品3。実患者データは使用していない。
- 本番AlpineイメージとローカルBookwormイメージを実ビルド。各522ソースファイルが現行ソースとSHA一致、app/clockの両bundleあり、LICENSE/COPYRIGHT/NOTICEあり、`.env.local` とビルドsecretなし。`verification/production-image-verification.json` / `local-image-verification.json`。
- 本番イメージをソース/依存のホストマウントなしで8414番に起動。PC/mobileの8画面で実サンプル、最新血糖、有限SVG座標、保存済み食品/定型セット/プロフィール、横はみ出しなし、例外・書込み0を確認。`verification/production-preview/results.json`。
- 既存1,028依存パッケージの版と本番依存指定を保持。追加は開発用axe/Playwright。配布ビルドのnpm監査は33件（低1・中12・高19・重大1）を報告した。UI移行で解消したとは扱わない。`verification/dependency-preservation.json`。

## デザインと公開LP

ユーザーが製品・LPのデザインを承認し、動的な血糖、表、設定dialogの支援技術確認について「確認済みで問題なし」と回答した。これは人間からの確認結果。使用した支援技術の版や全機能の手動キーボード完走まで断定しない。

DDSのトークン/DADS-VERSIONの原本一致、固定planの逆ソース/AST、計算・臨床payloadを照合。既存jQuery/D3のイベントを維持するHTML adapterの差はdeviations.mdに記録する。初期Phase 2専用チェックは後続の日本語/ブランド変更を許容する最終チェッカーではなく、現行ソースの固定plan検査と区別する。

企業サイトの医療業界へLPを登録。すまいデスク/スケッチの詳細10セクションについて数・順序・ID・配置クラスが100%一致。文章/価格/機能/ピクセルが同一という意味ではない。14操作画面＋11レポート＋モバイルの26画像と実録画2動画を掲載し、公開ファイル・distまで原本バイト一致。月990円・年9,900円、医療機関向け3,300円からの導入目安を公式価格調査に基づき記載する。

## 運用・終了

Dockerバックエンドの応答喪失は、ユーザーから全体再起動の許可を得てDocker/WSLを再起動して復旧した。データディスクの初期化や修復は行わず、既存shinryo-deskのOpenEMR/MySQLのhealthyを確認した。

両ホストnode_modules、DB、依存ボリュームを保持する。mainへのcommit/pushと当プロダクトの最終停止は、各リモートSHAと停止状態を確認して記録する。作業中の8410/8414、LP8411/8413は確認用のローカルURLであり、恒久公開URLではない。
