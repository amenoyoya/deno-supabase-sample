# deno-supabase-sample

## アプリケーション作成

まずは、Deno 向け Web フレームワーク Fresh をセットアップし、DB 情報を返す Supabase Edge Functions との疎通確認を行う

### Setup Fresh
```bash
# Create a fresh project to ./app/
$ deno run -A -r https://fresh.deno.dev app

## - Use Tailwind CSS?: y
## - Use VS Code?: y

# Launch fresh development server
## $ cd ./app/ && deno task start
$ deno task --cwd app start

## => http://localhost:8000
```

### Supabase Edge Functions について
- 2022年3月に Supabase が公開した新しい機能
- Deno と Supabase がパートナーシップを結び、Deno Deploy インフラストラクチャ上に構築されている
    - https://supabase.com/edge-functions
- Supabase を扱うためのキー情報などを環境変数で提供しているため、素の Deno Deploy から扱うより楽になる

### Setup Supabase Edge Functions
```bash
# create a new supabase edge function: `test-connection`
$ supabase functions new test-connection

## => ./supabase/functions/test-connection/ will be created
```

とりあえず、作成された Edge Function をそのまま http サーバとして実行する

```bash
$ supabase functions serve test-connection
```

Edge Functions Server が起動したら、curl コマンドで疎通確認を行ってみる

この時、Supabase 起動時に出力されていた `anon key` が必要になる（メモしていなかった場合は `supabase status` コマンドから確認可能）

```bash
$ curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
    --header 'Authorization: Bearer ${supabase anon key}' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

## => HTTP/1.1 200 OK
### {"message":"Hello Functions!"}
```
