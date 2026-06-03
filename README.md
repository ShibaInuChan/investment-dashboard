# 📊 投資マクロダッシュボード

AIを活用した投資家向けマクロ経済指標ダッシュボードです。米国・日本の主要経済指標を可視化し、Claude AIによる月次構造的インサイトを提供します。

---

## 概要

このダッシュボードは、短期的な価格変動に振り回されず、**マクロ経済の大きな流れを把握する**ために設計されています。FRED（セントルイス連邦準備銀行）のデータと Anthropic の Claude AI を組み合わせ、現在の相場フェーズを「構造的フレームワーク」に基づいて分析します。

---

## 主な機能

- **マクロ指標の表示**
  - 米国CPI（総合・コア）、失業率、FF金利
  - 米国10年債利回り、日本10年国債利回り
  - 日米金利差（円安圧力の可視化）

- **インタラクティブチャート**（Chart.js）
  - CPI推移（12ヶ月）
  - 失業率推移（12ヶ月）
  - 米国10年債・日本10年国債推移
  - 日米金利スプレッド（12ヶ月）

- **AIによる月次マクロ分析**
  - 毎月25日に Claude AI が最新指標とWeb検索をもとに自動生成
  - 3つのセクションで insight を提供
    - 【構造的インサイト】
    - 【フェーズ判定】（ノイズ / 調整 / パラダイムシフト）
    - 【今月の行動指針】
  - 過去のまとめを月別に参照可能

---

## アーキテクチャ

APIコストとレート制限を排除するため、データ取得とAI分析はすべてGitHub Actionsで事前生成し、静的JSONとして配信します。

```
GitHub Actions（定期実行）
  ├── 毎日2回      → FRED APIからデータ取得 → data/indicators.json
  └── 毎月25日     → Claude APIで分析生成  → data/insight.json
                                              data/insight-YYYY-MM.json

Vercel（配信）
  ├── /api/indicators → data/indicators.json を返すだけ
  ├── /api/insight    → data/insight.json を返すだけ
  └── /              → index.html（静的）
```

ユーザーアクセス時にFRED・Claude APIは一切呼ばれません。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML5 / Vanilla JavaScript / Chart.js 4.4.1 |
| バックエンド | Node.js（Vercel サーバーレス関数） |
| AI | Anthropic Claude API（`claude-sonnet-4-5`） |
| 経済データ | FRED API（セントルイス連邦準備銀行） |
| 定期実行 | GitHub Actions |
| デプロイ | Vercel |

---

## セットアップ

### 必要なもの

- [FRED API キー](https://fred.stlouisfed.org/docs/api/api_key.html)（無料）
- [Anthropic API キー](https://console.anthropic.com/)

### GitHub Secrets の設定

リポジトリの **Settings → Secrets and variables → Actions** に以下を登録します。

| Secret名 | 内容 |
|---|---|
| `FRED_API_KEY` | FRED APIキー |
| `ANTHROPIC_API_KEY` | Anthropic APIキー |

### Vercel へのデプロイ

Vercel にリポジトリを接続するだけでデプロイされます。Vercel側の環境変数設定は不要です（データはGitHub Actionsが生成してリポジトリにコミットするため）。

### 初回データ生成

デプロイ後、GitHub Actions の **"Fetch FRED Indicators"** を手動実行してください。
`insightも生成する` にチェックを入れると初回のAI分析も生成されます。

---

## プロジェクト構成

```
investment-dashboard/
├── api/
│   ├── indicators.js         # data/indicators.json を返す
│   └── insight.js            # data/insight.json を返す（?month=YYYY-MM で月別取得）
├── data/
│   ├── indicators.json       # 最新の経済指標データ（GitHub Actionsが生成）
│   ├── insight.json          # 最新のAI分析（GitHub Actionsが生成）
│   └── insight-YYYY-MM.json  # 月次アーカイブ
├── scripts/
│   ├── fetch-indicators.js   # FRED APIからデータ取得スクリプト
│   └── fetch-insight.js      # Claude APIで分析生成スクリプト
├── .github/workflows/
│   └── fetch-indicators.yml  # 定期実行ワークフロー
├── index.html                # フロントエンド
├── server.js                 # ローカル開発用サーバー
├── vercel.json               # Vercel設定
└── package.json
```

---

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/indicators` | 最新の経済指標JSONを返す |
| `GET` | `/api/insight` | 最新のAI分析JSONを返す（`archives` フィールドに過去月一覧付き） |
| `GET` | `/api/insight?month=YYYY-MM` | 指定月のAI分析を返す |

---

## ライセンス

MIT
