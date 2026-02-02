# Google API 統合ガイド

> フライデーで使用予定のGoogle API についての知見まとめ

## 概要

Google Workspace API は基本的に**完全無料**で利用可能。
レート制限はあるが、普通の使い方なら問題なし。

## 認証方式

### 2つの認証方法

| 方式 | 用途 | トークン管理 |
|------|------|-------------|
| **OAuth 2.0** | ユーザー代理でアクセス（個人のメール等） | アクセストークン（1時間で期限切れ）+ リフレッシュトークン |
| **Service Account** | ボット/自動化用（共有スプレッドシート等） | JSONキーファイル、トークン自動更新 |

### 推奨: OAuth 2.0（ユーザー向けアプリ）

```python
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_credentials():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return creds
```

### Service Account（自動化向け）

```python
from google.oauth2 import service_account

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SERVICE_ACCOUNT_FILE = 'service-account.json'

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
```

**注意**: Service Account はスプレッドシートに共有設定が必要

### 必要なライブラリ

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

**非推奨**: `oauth2client` は廃止済み → `google-auth` を使用

---

## Google Sheets API

### 料金・制限

| 項目 | 値 |
|------|-----|
| **料金** | 完全無料 |
| **日次クォータ** | 無制限（レート制限のみ） |
| **プロジェクト/分** | 300リクエスト |
| **ユーザー/分** | 60リクエスト |

### スコープ

| スコープ | 用途 |
|---------|------|
| `spreadsheets.readonly` | 読み取り専用 |
| `spreadsheets` | 読み書き両方 |

### 効率的な使い方

```python
from googleapiclient.discovery import build

service = build('sheets', 'v4', credentials=creds)

# ❌ 悪い例: セルごとにリクエスト
for row in range(100):
    service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f'A{row}',
        body={'values': [[data[row]]]}
    ).execute()  # 100リクエスト消費

# ✅ 良い例: バッチで一括更新
service.spreadsheets().values().update(
    spreadsheetId=SPREADSHEET_ID,
    range='A1:A100',
    valueInputOption='RAW',
    body={'values': [[d] for d in data]}
).execute()  # 1リクエストで済む
```

**ポイント**: 1リクエストで100行×10列を更新しても1回としてカウント

---

## Gmail API

### 料金・制限

| 項目 | 値 |
|------|-----|
| **料金** | 完全無料 |
| **日次クォータ** | 1,000,000,000 ユニット |
| **プロジェクト/分** | 1,200,000 ユニット |
| **ユーザー/分** | 15,000 ユニット |

### 操作ごとの消費ユニット

| 操作 | ユニット | 1分あたり可能回数（ユーザー） |
|------|---------|---------------------------|
| メール取得 | 5 | 約3,000通 |
| メール検索 | 5 | 約3,000回 |
| メール送信 | 100 | 約150通 |
| メール削除 | 10 | 約1,500通 |
| 下書き作成 | 10 | 約1,500件 |

### スコープ（最小権限の原則）

| スコープ | 用途 |
|---------|------|
| `gmail.readonly` | 読み取り専用 |
| `gmail.send` | 送信のみ |
| `gmail.modify` | 読み書き（削除除く） |
| `mail.google.com/` | フルアクセス（非推奨） |

### メール検索例

```python
from googleapiclient.discovery import build

service = build('gmail', 'v1', credentials=creds)

# 特定送信者からのメールを検索
results = service.users().messages().list(
    userId='me',
    q='from:example@gmail.com after:2026/01/01'
).execute()

messages = results.get('messages', [])

# メール本文を取得
for msg in messages:
    message = service.users().messages().get(
        userId='me',
        id=msg['id'],
        format='full'
    ).execute()

    # 件名、本文、添付ファイルすべてアクセス可能
    headers = message['payload']['headers']
    subject = next(h['value'] for h in headers if h['name'] == 'Subject')
```

### メール送信例

```python
import base64
from email.mime.text import MIMEText

def send_email(service, to, subject, body):
    message = MIMEText(body)
    message['to'] = to
    message['subject'] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    service.users().messages().send(
        userId='me',
        body={'raw': raw}
    ).execute()
```

---

## Google Calendar API

### 料金・制限

| 項目 | 値 |
|------|-----|
| **料金** | 完全無料 |
| **日次クォータ** | 1,000,000 クエリ |
| **測定方式** | 分単位（2021年5月以降） |

### 制限超過時の挙動

- 以前: 1日クォータ超過 → その日は全リクエスト失敗
- 現在: 分単位制限 → 待てば回復（403/429エラー）

### ベストプラクティス

1. **ポーリングを避ける** → プッシュ通知を使用
2. **リクエストを分散** → 深夜0時に集中させない
3. **sync token を使用** → 差分同期で効率化
4. **ページサイズを大きく** → `maxResults` パラメータ活用

### イベント作成例

```python
from googleapiclient.discovery import build

service = build('calendar', 'v3', credentials=creds)

event = {
    'summary': 'ミーティング',
    'start': {'dateTime': '2026-02-03T10:00:00+09:00'},
    'end': {'dateTime': '2026-02-03T11:00:00+09:00'},
}

service.events().insert(
    calendarId='primary',
    body=event
).execute()
```

---

## Google Drive API

### 料金・制限

| 項目 | 値 |
|------|-----|
| **料金** | 完全無料 |
| **日次クォータ** | 制限あり（詳細は公式ドキュメント） |

### スコープ

| スコープ | 用途 | セキュリティ |
|---------|------|-------------|
| `drive.file` | アプリが作成したファイルのみ | 推奨 |
| `drive.readonly` | 全ファイル読み取り | - |
| `drive` | 全ファイル読み書き | 要注意 |

### ファイルアップロード例

```python
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

service = build('drive', 'v3', credentials=creds)

file_metadata = {
    'name': 'report.pdf',
    'parents': ['folder_id']  # 保存先フォルダ
}

media = MediaFileUpload('local_file.pdf', mimetype='application/pdf')

file = service.files().create(
    body=file_metadata,
    media_body=media,
    fields='id'
).execute()
```

### 権限設定例

```python
# ファイルを共有
permission = {
    'type': 'user',
    'role': 'writer',  # reader, writer, owner
    'emailAddress': 'user@example.com'
}

service.permissions().create(
    fileId=file_id,
    body=permission
).execute()
```

---

## その他の無料API

### 完全無料（回数制限のみ）

| API | 用途 |
|-----|------|
| Google Docs API | ドキュメント操作 |
| Google Slides API | スライド操作 |

### 無料枠あり（超えると課金）

| API | 無料枠 |
|-----|--------|
| Translation API | 月50万文字 |
| Cloud Vision API | 月1,000リクエスト |
| Gemini API | 無料プランあり |
| Speech-to-Text | 月60分 |
| Natural Language API | 月5,000ユニット |

### 要注意

| API | 注意点 |
|-----|--------|
| Google Maps API | 2025年3月から月$200無償枠廃止 |

---

## セキュリティベストプラクティス

### 1. 最小権限の原則

```python
# ❌ 悪い例: フルアクセス
SCOPES = ['https://mail.google.com/']

# ✅ 良い例: 必要最小限
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
```

### 2. 認証情報の管理

- `credentials.json` は Git にコミットしない
- 本番環境では環境変数 or Secret Manager を使用
- `token.json` も機密情報として扱う

### 3. エラーハンドリング

```python
from googleapiclient.errors import HttpError
import time

def api_call_with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except HttpError as e:
            if e.resp.status in [429, 503]:  # レート制限 or サービス一時停止
                wait_time = 2 ** attempt  # 指数バックオフ
                time.sleep(wait_time)
            else:
                raise
    raise Exception("Max retries exceeded")
```

---

## フライデーでの活用案

| 機能 | 使用API | 用途 |
|------|---------|------|
| メール確認 | Gmail API | 特定送信者のメール内容を読む |
| メール送信 | Gmail API | 自動返信・通知 |
| スケジュール管理 | Calendar API | 予定の確認・作成 |
| データ保存 | Sheets API | ログ・設定の保存 |
| ファイル管理 | Drive API | ドキュメント・画像の保存 |

---

## 参考リンク

- [Google Sheets API Python Quickstart](https://developers.google.com/workspace/sheets/api/quickstart/python)
- [Gmail API Python Quickstart](https://developers.google.com/workspace/gmail/api/quickstart/python)
- [Gmail API Scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Google Calendar API Quota Management](https://developers.google.com/workspace/calendar/api/guides/quota)
- [Google Drive API Python Guide](https://thepythoncode.com/article/using-google-drive--api-in-python)
- [google-auth PyPI](https://pypi.org/project/google-auth/)
- [OAuth 2.0 for Google APIs](https://developers.google.com/identity/protocols/oauth2)

---

**作成日**: 2026-02-02
**更新日**: 2026-02-02
