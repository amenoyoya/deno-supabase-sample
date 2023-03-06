# deno-supabase-sample

## 匿名掲示板の作成

以下のような仕様のシンプルな匿名掲示板を作成する

- DB:
    - Table: `掲示板`
        - id: `serial primary key` (掲示板ID)
        - title: `char(100)` (掲示板タイトル)
        - created_at: `TIMESTAMP` (掲示板登録日時)
        - updated_at: `TIMESTAMP` (掲示板更新日時)
- UI:
    - InputBox: `掲示板タイトル`
    - Button: `掲示板登録`
    - List: `登録済み掲示板`
- Event:
    - UI.Button.`掲示板登録`.click:
        - UI.InputBox.`掲示板タイトル`.value を DB.Table.`掲示板` に登録
    - UI.List.`登録済み掲示板`.GET:
        - DB.Table.`掲示板`.select().each を表示

### セッション管理ミドルウェアの実装
まずは Redis を使ったセッション管理をできるようにするため、セッション管理ミドルウェアを実装する

Fresh では、`routes/**/_middleware.ts` に配置されたミドルウェア処理は、同一階層および配下の階層のルートの処理前後で実行されるようになる

- 参考: https://fresh.deno.dev/docs/concepts/middleware

#### `./app/.env`
```conf
# ...既存環境変数は省略

# Redis サーバ接続情報
REDIS_HOST=localhost
REDIS_PORT=6379

# セッション保持時間: 3600秒 = 1時間
SESSION_SECONDS=3600
```

#### `./app/import_map.json`
```json
{
  "imports": {
    // ...既存ライブラリは省略

    "redis/": "https://deno.land/x/redis@v0.25.0/",
    "fresh_session/": "https://deno.land/x/fresh_session@0.2.0/"
  }
}
```

#### `./app/routes/_middleware.ts`
```typescript
import { sessionHandler } from "../middleware/session.ts";

/**
 * Middleware handlers for all routes.
 * routes/ 直下の _middleware.ts の handler は全ルートに対して適用される
 *
 * @see [RouteMiddleware]{@link https://fresh.deno.dev/docs/concepts/middleware}
 */
export const handler = [sessionHandler];
```

`routes/` 直下に置かれた `_middleware.ts` は全ルート処理に対して適用される

セッション管理ミドルウェアは全ルート処理に対して適用したいため、ここで呼び出すようにする

#### `./app/middleware/session.ts`
```typescript
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { WithSession, redisSession } from "fresh_session/mod.ts";
import { connect as connectRedis } from "redis/mod.ts";

export type State = WithSession;

// Connect to the redis server.
const redis = await connectRedis({
  hostname: Deno.env.get("REDIS_HOST"),
  port: Deno.env.get("REDIS_PORT"),
});

// Create a redis session management middleware.
const redisSessionMiddleware = redisSession(redis, {
  maxAge: Deno.env.get("SESSION_SECONDS"),
  path: "/",
  httpOnly: true,
});

/**
 * Middleware handler for session management.
 *
 * @param {Request} req - Request object.
 * @param {MiddlewareHandlerContext} ctx - Middleware handler context object.
 * @returns {Promise<Response>} It returns a response.
 */
export function sessionHandler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>
) {
  return redisSessionMiddleware(req, ctx);
}
```

セッション管理ミドルウェアの実体を上記のように実装する

※ http://localhost:6379 で Redis サーバが実行されていないとエラーになるため、あらかじめ `docker start docker-redis` を実行しておくこと

実装したら、以下の手順でセッション管理ができているか確認する

1. http://localhost:8000 の任意ページにアクセスする
2. `Chrome > DevTools > Application > Storage > Cookies > http://localhost:8000` を確認
   - Name: `sessionId` に任意の値が保存されていれば OK
