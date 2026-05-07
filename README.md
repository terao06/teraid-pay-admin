# teraid-pay-admin

Teraid Pay の店舗ウォレットを管理するための Next.js 管理画面です。

現在の画面では、店舗 ID `104` のウォレット情報を確認し、ウォレットの登録・削除を行えます。ウォレット接続には `wagmi` と `RainbowKit` を使用しています。

## 主な機能

- 登録済み店舗ウォレットの確認
- 店舗ウォレットの新規登録
- 登録済みウォレットの削除
- Teraid Pay API との連携
- Sepolia / JPYC を前提にしたウォレット設定

## 必要な環境

- Node.js
- npm
- Teraid Pay API サーバー

依存関係は `package-lock.json` で管理されています。基本的には npm を使用してください。

## セットアップ

依存関係をインストールします。

```bash
npm install
```

API の接続先を変更する場合は、`.env.local` に次の環境変数を設定します。

```bash
NEXT_PUBLIC_TERAID_PAY_API_BASE_URL=http://localhost:8005
```

未設定の場合は `http://localhost:8005` が使われます。

設定例は `.env.example` にあります。ローカル開発では、必要に応じて `.env.example` を参考に `.env.local` を作成してください。

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで次の URL を開きます。

```text
http://localhost:3000
```

このプロジェクトでは、開発時に `next dev --webpack` を使います。Windows でリポジトリのパスに日本語などの非 ASCII 文字が含まれる場合、Turbopack が失敗することがあるためです。

## よく使うコマンド

```bash
npm run dev
```

開発サーバーを起動します。

```bash
npm run build
```

本番用にビルドします。`next.config.ts` で `output: "export"` を指定しているため、ビルド結果は `out/` に静的ファイルとして出力されます。

```bash
npm run start
```

Next.js の本番サーバーを起動するスクリプトです。ただし、このリポジトリは静的エクスポート構成のため、公開時は `npm run build` 後に `out/` を静的ホスティングする運用が基本です。

```bash
npm run lint
```

ESLint を実行します。

## 画面構成

- `/`  
  登録済み店舗ウォレットの詳細画面です。
- `/register`  
  店舗ウォレットの登録画面です。

## ディレクトリ構成

```text
app/                         Next.js のルーティングとレイアウト
components/                  アプリ全体で使う Provider など
features/store-wallet/        店舗ウォレット管理機能
features/store-wallet/api/    Teraid Pay API クライアント
features/store-wallet/domain/ 設定値、型、表示用フォーマット
features/store-wallet/ui/     画面コンポーネント
lib/                          wagmi、MUI、Webpack 用の補助設定
docs/swagger.yaml             API 仕様
public/                       静的ファイル
```

## API 設定

店舗ウォレット API の接続先は次のファイルで管理しています。

```text
features/store-wallet/domain/config.ts
```

現在の主な固定値は次のとおりです。

| 項目 | 値 |
| --- | --- |
| 店舗 ID | `104` |
| チェーン種別 | `ethereum` |
| ネットワーク | `sepolia` |
| トークン | `JPYC` |
| チェーン ID | `11155111` |

API のベース URL は `NEXT_PUBLIC_TERAID_PAY_API_BASE_URL` で上書きできます。

## 環境変数

このプロジェクトで使用する環境変数は次のとおりです。すべて `NEXT_PUBLIC_` で始まるため、ブラウザ側のコードから参照されます。秘密情報は入れないでください。

| 変数名 | 必須 | 設定内容 |
| --- | --- | --- |
| `NEXT_PUBLIC_TERAID_PAY_API_BASE_URL` | 任意 | Teraid Pay API のベース URL です。未設定の場合は `http://localhost:8005` を使用します。 |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | 必須 | RainbowKit / WalletConnect でウォレット接続を行うための Project ID です。WalletConnect Cloud で取得した値を設定します。 |
| `NEXT_PUBLIC_RPC_URL_ETHEREUM_MAINNET` | 推奨 | Ethereum Mainnet に接続する RPC URL です。ウォレット接続設定と残高取得で使用します。 |
| `NEXT_PUBLIC_RPC_URL_ETHEREUM_SEPOLIA` | 推奨 | Ethereum Sepolia に接続する RPC URL です。現在のデフォルトネットワークが Sepolia のため、開発時は設定してください。 |
| `NEXT_PUBLIC_RPC_URL_POLYGON_MAINNET` | 推奨 | Polygon Mainnet に接続する RPC URL です。Polygon のウォレット情報を扱う場合に使用します。 |
| `NEXT_PUBLIC_RPC_URL_POLYGON_AMOY` | 推奨 | Polygon Amoy に接続する RPC URL です。Amoy のウォレット情報を扱う場合に使用します。 |
| `NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_ETHEREUM_MAINNET` | 条件付き | Ethereum Mainnet 上の JPYC トークンコントラクトアドレスです。対象ウォレットの `chainType` が `ethereum`、`networkName` が `mainnet`、`tokenSymbol` が `JPYC` の場合に残高表示で使用します。 |
| `NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_ETHEREUM_SEPOLIA` | 条件付き | Ethereum Sepolia 上の JPYC トークンコントラクトアドレスです。現在のデフォルト設定で JPYC 残高を表示する場合に使用します。 |
| `NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_POLYGON_MAINNET` | 条件付き | Polygon Mainnet 上の JPYC トークンコントラクトアドレスです。対象ウォレットが Polygon Mainnet の JPYC の場合に使用します。 |
| `NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_POLYGON_AMOY` | 条件付き | Polygon Amoy 上の JPYC トークンコントラクトアドレスです。対象ウォレットが Polygon Amoy の JPYC の場合に使用します。 |

`必須` はアプリの主要機能に必要な値、`推奨` は対象チェーンを使う場合に設定すべき値、`条件付き` は JPYC 残高表示に必要な値です。

## 補足

`wagmi` の一部依存がブラウザ管理画面では使わないパッケージを要求するため、`next.config.ts` で空モジュールへ置き換えています。

```text
accounts
@react-native-async-storage/async-storage
```

この設定は、該当コネクタを使わない前提でビルドを通すためのものです。
