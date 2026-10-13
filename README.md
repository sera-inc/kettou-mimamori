# 血糖みまもり

![血糖みまもり](static/brand/logo.svg)

血糖値の推移と、食事・投与量・治療記録を確認するサービスです。
株式会社世良が提供します。問い合わせ先：**info@sera-inc.co.jp**。

主画面、11種類のレポート、プロフィール、食品・食事セット、利用者と権限、期間指定の記録管理、時計表示を備えています。日本語とデジタルデザインシステムに対応しています。

## 確認用の起動

この作業環境では、専用のMongoDBとDockerコンテナを使い、実患者の情報を使わずに動作を確認しています。

```powershell
docker compose --env-file .env.local -f compose.local.yaml up -d
```

確認先：**http://localhost:8410**。レポートは `/report`、プロフィールは `/profile`、食品は `/food`、管理画面は `/admin`、時計の設定は `/clock/config` です。

`.env.local` はGitに含めません。`API_SECRET` に12文字以上の十分に長いランダムな値を設定します。現環境ではTLS検査用の信頼済み証明書を使用しており、`LOCAL_CA_FILE` はその証明書のパスを指定します。秘密情報や証明書をリポジトリに追加しません。

依存ファイルをインストール済みの場合、専用の確認DBへサンプルを投入できます。

```powershell
node scripts/seed-demo.cjs
```

このコマンドの接続先はローカルの `kettou_demo` に限定されています。認証が必要な編集機能は、確認用のAPI秘密文字列を画面で設定して使用します。

## 実装と検証

Node.js 22とMongoDB 7で検証しています。ホスト側の `node_modules` は起動・ビルド・テストに使用するため保持しています。削除した場合は `npm ci` が必要です。

```powershell
npm ci
npm run bundle
npm run lint
```

機能試験は、本番と異なる専用DBを指定して `node scripts/regression.cjs all <出力先>` を実行します。確認用DockerのQAコンテナは `testdb` を使用します。実画面の検証では、期間の境界、血糖・投与量の計算、実保存・再読み込み、閲覧権限の書き込み拒否、PCとスマートフォンのキーボード操作を確認します。

最新の結果と制限は [最終検証](docs/final-verification.md)、各段階の記録は [実装の現在地](docs/implementation-progress.md)、デザイン移行の根拠は [移行記録](docs/design-system-migration.md)、ブランドは [ブランド仕様](docs/brand-design.md) を参照してください。自動試験だけで人間のデザイン承認や支援技術の確認が完了したとは扱いません。

## データ接続と運用

機器や外部サービスの接続は、必要なアカウント・権限・通信環境を用意して個別に確認します。確認環境の表示結果を、実機との接続試験に置き換えません。表示や通知の設定は、利用者と運用担当者が用途に応じて確認してください。

`MONGO_CONNECTION`、`API_SECRET`、`ENABLE` など、既存の接続設定の識別子は維持しています。APIの従来の名前 `nightscout` は接続機器との互換性のため保持し、配布パッケージとリポジトリの名前は `kettou-mimamori` としています。

## ライセンスと帰属

本ソフトウェアのライセンスは [GNU AGPL 第3版](LICENSE) です。[COPYRIGHT](COPYRIGHT) と [NOTICE](NOTICE) に著作権と同梱素材の帰属を記載しています。基盤の設定資料は [元のREADME](docs/upstream/README.md) に保存しています。

ソースコード：[sera-inc/kettou-mimamori](https://github.com/sera-inc/kettou-mimamori)。

## 停止

```powershell
docker compose --env-file .env.local -f compose.local.yaml stop
docker stop kettou-mimamori-qa
```

停止で保存されたDBは削除しません。他のサービスのDockerコンテナは操作しません。
