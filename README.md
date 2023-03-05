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
- VS Code: 1.75.1
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
# Launch docker-redis container (image: redis@latest)
$ docker run -d -p 6379:6379 --name docker-redis redis
## => docker://docker-redis:6379

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
