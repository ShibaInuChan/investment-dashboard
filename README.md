# 📊 投資マクロダッシュボード

AIを活用した投資家向けマクロ経済指標ダッシュボードです。米国・日本の主要経済指標をリアルタイムで可視化し、Claude AIによる構造的インサイトを提供します。

---

## 概要

このダッシュボードは、短期的な価格変動に振り回されず、**マクロ経済の大きな流れを把握する**ために設計されています。FRED（セントルイス連邦準備銀行）のリアルタイムデータと、Anthropic の Claude AI を組み合わせ、現在の相場フェーズを「構造的フレームワーク」に基づいて分析します。

---

## 主な機能

- **マクロ指標のリアルタイム表示**
  - 米国CPI（総合・コア）、失業率、FF金利
  - 米国10年債利回り、日本10年国債利回り
  - 日米金利差（円安圧力の可視化）

- **インタラクティブチャート**（Chart.js）
  - CPI推移（12ヶ月）
  - 失業率推移（12ヶ月）
  - 米国10年債・日本10年国債推移
  - 日米金利スプレッド（12ヶ月）

- **AIによるマクロ分析**
  - Claude AI が最新指標を分析し、3つのセクションで insight を提供
    - 【構造的インサイト】
    - 【フェーズ判定】（ノイズ / 調整 / パラダイムシフト）
    - 【今週の行動指針】
  - Web 検索で最新の政策動向も踏まえた分析

- **分析ログ機能**
  - 過去7日分のAI分析をローカルストレージで保存・参照

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML5 / Vanilla JavaScript / Chart.js 4.4.1 |
| バックエンド | Node.js / Express.js |
| AI | Anthropic Claude API（`claude-sonnet-4-5`） |
| 経済データ | FRED API（セントルイス連邦準備銀行） |
| デプロイ | Vercel（サーバーレス関数） |

---

## セットアップ

### 必要なもの

- Node.js 18 以上
- [FRED API キー](https://fred.stlouisfed.org/docs/api/api_key.html)（無料）
- [Anthropic API キー](https://console.anthropic.com/)

### インストール

```bash
git clone https://github.com/shibainuchan/investment-dashboard.git
cd investment-dashboard
npm install
```

### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します。

```env
FRED_API_KEY=your_fred_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### ローカル起動

```bash
node server.js
```

ブラウザで `http://localhost:3000` を開きます。

---

## デプロイ（Vercel）

Vercel CLI またはダッシュボードからデプロイできます。環境変数（`FRED_API_KEY`、`ANTHROPIC_API_KEY`）を Vercel のプロジェクト設定に追加してください。

```bash
vercel deploy
```

---

## プロジェクト構成

```
investment-dashboard/
├── api/
│   ├── indicators.js   # FRED API からの経済指標取得（サーバーレス関数）
│   └── insight.js      # Claude AI によるマクロ分析（サーバーレス関数）
├── index.html          # フロントエンド SPA
├── server.js           # ローカル開発用 Express サーバー
├── vercel.json         # Vercel デプロイ設定
└── package.json
```

---

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/indicators` | FRED から6系列の経済指標を取得・整形 |
| `POST` | `/api/insight` | 指標データを受け取り、Claude AI による分析を返す |

---

## ライセンス

MIT
