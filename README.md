# Friday (フライデー)

> プログラムを知らない人でも使える、行動できるAIエージェント

## 命題

**「話すだけじゃなく、実行できるAI」を「誰でも使える形」で提供する**

### 通常のClaudeとの違い

| 通常のClaude | フライデー |
|-------------|-----------|
| 情報を教える | **実際に行動する** |
| 「こうすればいいよ」 | **「やっておいたよ」** |
| 汎用的 | **スキルを保持・活用** |
| エンジニア向けツール | **誰でも使えるUI** |

### なぜブラウザUI？

- **ターゲット**: プログラムを知らない人（非エンジニア）
- **エディタは難しい**: VS Code やターミナルは素人には敷居が高い
- **管理しやすい**: 中央でスキルやシステムを管理できる

## 概要

Cloudflare Tunnel経由で外部公開するClaude チャットサービス。
パクッ太郎とは完全に分離した独立プロジェクト。

## 機能

- チャットUI経由でClaudeと対話
- **実際に行動できる**（Google API連携でメール送信、カレンダー操作等）
- **スキルを保持・活用**（カスタム知識・手順を記憶）
- 会話履歴の永続化（PostgreSQL）

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
