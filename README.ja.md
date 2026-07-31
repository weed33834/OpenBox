# OpenBox

> **FreeAPI**（React + Vite + Supabase で構築された無料 AI API ナビゲーター）と **FreeNode**（無料ネットワークノードを発見・クロール・重複排除・公開する Python パイプライン）を統合したオープンソースツールボックス。

OpenBox は、かつて別々だった 2 つのプロジェクトを単一のフラットリポジトリに統合します。

| コンポーネント | スタック | 機能 |
|---------------|---------|------|
| **FreeAPI**（`src/`、`public/`、`supabase/`） | TypeScript · React · Vite · Supabase | 無料 AI API エンドポイントを集約・ナビゲートする Web アプリ。フィルタ、比較、お気に入り、健全性チェック、多言語対応。 |
| **FreeNode**（`scripts/`、`nodes/`、`docs/`、`tests/`） | Python | 公開ノードソースをクロールし、重複排除と検証を行った上で Jekyll ステータスサイトを構築し、Clash/V2Ray 設定をエクスポートするパイプライン。 |

## リポジトリ構成

```
openbox/
├── src/                 # FreeAPI — React アプリソース
├── public/              # FreeAPI — 静的アセット
├── supabase/            # FreeAPI — DB マイグレーション
├── scripts/             # FreeNode — クローラ / フォーマッタ / 検証 (Python)
│   ├── adapters/        #   ソースアダプタ (git, rss, html, …)
│   └── ...
├── nodes/               # FreeNode — 生成されたノード出力
├── docs/                # FreeNode — Jekyll ステータスサイト
├── tests/               # FreeNode — pytest スイート
├── config/              # FreeNode — ソースリスト
├── index.html           # FreeAPI — Vite エントリ
├── package.json         # FreeAPI — npm スクリプト
├── pyproject.toml       # FreeNode — Python プロジェクト設定
└── requirements.txt     # FreeNode — Python 依存関係
```

## クイックスタート

### FreeAPI（フロントエンド）
```bash
pnpm install
cp .env.example .env      # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を入力
pnpm dev
```

### FreeNode（パイプライン）
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # FREENODE_* 変数を調整
python scripts/update.py
```

ワークフローの詳細は `CONTRIBUTING.md`、CI 設定は `.github/workflows/`（`deploy.yml` がフロントエンド、`daily-update.yml` がノードパイプライン）を参照してください。

## ライセンス

MIT — [LICENSE](LICENSE) を参照。
