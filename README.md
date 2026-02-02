# Friday (フライデー)

> 外部公開用 Claude チャットサービス

## 概要

Cloudflare Tunnel経由で外部公開するClaude チャットサービス。
パクッ太郎とは完全に分離した独立プロジェクト。

## 機能

- チャットUI経由でClaudeと対話
- 会話履歴の永続化（PostgreSQL）
- スキルによるカスタマイズ
- Google連携（将来予定）

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React + Vite |
| バックエンド | FastAPI |
| DB | PostgreSQL |
| AI | Anthropic API (Claude) |
| 公開 | Cloudflare Tunnel |
| コンテナ | Docker Compose |

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
# .env を編集して必要な値を設定
```

### 2. 起動

```bash
docker compose up -d
```

### 3. アクセス

- UI: http://localhost:3003
- API: http://localhost:8003

## ディレクトリ構成

```
friday/
├── docker-compose.yml
├── .env.example
├── api/                    # FastAPI バックエンド
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── routers/
│       └── services/
├── ui/                     # React フロントエンド
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── skills/                 # スキル定義
    ├── rules/
    ├── base.md
    └── custom/
```

## ライセンス

MIT License
