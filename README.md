# deno-supabase-sample

Sample project for Deno Fresh + Supabase

- [Deno](https://deno.land)
    - V8 JavaScript エンジンおよび Rust プログラミング言語に基づいた、JavaScript/TypeScript のランタイム環境
    - Node.js の作者であるライアン・ダールによって作成され、セキュリティと生産性に焦点を当てている
- [Fresh](https://fresh.deno.dev)
    - Deno 製の Web フレームワーク
    - ベースライブラリに [preact](https://preactjs.com) と [twind](https://twind.dev) が使われている
        - **preact**:
            - 軽量な [React](https://reactjs.org) サブセットライブラリ
        - **twind**:
            - [Tailwind CSS](https://tailwindcss.com) を CSS-in-JavaScript として使いやすくしたライブラリ
    - 以下のような特徴がある
        - デフォルトではクライアントに JavaScript を送信しない
        - Islands Architecture という仕組みで必要な分だけ JavaScript を送信する
        - ビルドステップ不要、設定も不要
        - 標準で TypeScript をサポート
- [Supabase](https://supabase.com)
    - Google Firebase の代替サービスを謳っている、オープンソース BaaS (Backend as a Service) の一つ
    - Supabase サービス上でホスティングしてもらう以外に、完全無料で利用できるセルフホスティングも選択可能
    - 提供している機能は以下の通り
        - Database (エンジン: Postgres)
        - Authentication
        - Storage
        - Edge Functions

## Environment

- OS: Ubuntu 20.04 (on Windows Subsystem for Linux)
- Docker: 23.0.1
- Homebrew: 4.0.4
- Browser: Chrome
- Editor: VS Code
    - Extensions:
        - `Code Spell Checker`
        - `Prettier - Code formatter`
        - `Deno`

### Setup
- Deno: 1.31.1
- Supabase CLI: 1.41.6

```bash
# Install deno, supabase-cli
$ brew install deno supabase/tap/supabase
```

### Docker containers
- Redis:
    - docker://docker-redis:6379
- Supabase:
    - API: http://localhost:54321
    - DB: postgresql://postgres:postgres@localhost:54322/postgres
    - Studio (Admin panel): http://localhost:54323
    - Inbucket (Mocked SMTP server): http://localhost:54324

```bash
# Create and launch docker-redis container (image: redis@latest)
$ docker run -d -p 6379:6379 --name docker-redis redis
## => docker://docker-redis:6379

# If docker-redis container is already created, execute the following command (start docker-redis container)
$ docker start docker-redis

# Initialize supabase project
$ supabase init
## => ./supabase/ will be created

# Launch supabase docker containers
$ supabase start

## => Start supabase docker containers
## - API: http://localhost:54321
## - DB: postgresql://postgres:postgres@localhost:54322/postgres
## - Studio: http://localhost:54323
## - Inbucket: http://localhost:54324

# If you want to stop supabase docker containers, execute the following command
$ supabase stop
```

※ Supabase 起動時に出力される `anon key` は、アプリケーションから Supabase サービスを実行するために必要なためメモしておくこと

---

## Deno Task の設定

Redis サーバコンテナと Supabase サービスコンテナは、OS再起動時に毎回起動し直す必要がある

毎回複数のコマンドを打つのは面倒であるため、Deno Task を作成してコマンドをまとめる

Deno Task は、`deno.json` の `tasks` キー配下にコマンドを記述することで作成することができる

- 参考:
    - https://deno.land/manual@v1.31.1/tools/task_runner
    - https://deno.land/manual@v1.31.1/getting_started/configuration_file

ここでは、以下の3つの Deno Task を作成する

1. `docker:create`
    - Docker コンテナの作成と起動を行う
    - プロジェクト作成時に1回だけ実行する以下のコマンドを順次実行
        - `docker run -d -p 6379:6379 --name docker-redis redis`
        - `supabase init`
2. `docker:start`
    - 作成済みの Docker コンテナを起動する
    - Docker コンテナを起動したい場合に実行する以下のコマンドを順次実行
        - `docker start docker-redis`
        - `supabase start`
3. `docker:stop`
    - 起動中の Docker コンテナを停止する
    - Docker コンテナを停止したい場合に実行する以下のコマンドを順次実行
        - `docker stop docker-redis`
        - `supabase stop`

### `./deno.json`
```json
{
    "tasks": {
        "docker:create": "docker run -d -p 6379:6379 --name docker-redis && supabase init",
        "docker:start": "docker start docker-redis && supabase start",
        "docker:stop": "docker stop docker-redis && supabase stop"
    }
}
```

### Usage
```bash
# Create docker containers
$ deno task docker:create

# Launch docker containers
$ deno task docker:start

# Terminate docker containers
$ deno task docker:stop
```

---

## Create Application

[01-create-app.md](./docs/create-app.md)
