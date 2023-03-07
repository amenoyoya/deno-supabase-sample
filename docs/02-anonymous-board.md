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

---

## ミドルウェア実装

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

### CSRFチェックミドルウェアの実装
セッション管理ができるようになったため、掲示板登録時にCSRFチェックを行うためのミドルウェアを実装する

- **CSRF (クロスサイトリクエストフォージェリ)**
    - Webアプリケーションに存在する脆弱性、もしくはその脆弱性を利用した攻撃方法のこと
    - 掲示板や問い合わせフォームなどを処理するWebアプリケーションが、本来拒否すべき他サイトからのリクエストを受信し処理してしまうことで発生する脆弱性
    - 攻撃方法：
        1. 攻撃者は攻撃用Webページを準備し、ユーザがアクセスするよう誘導する
        2. ユーザが攻撃用Webページにアクセスすると、攻撃用Webページ内にあらかじめ用意されていた不正なリクエストが攻撃対象サーバに送られる
        3. 攻撃対象サーバ上のWebアプリケーションは不正なリクエストを処理し、ユーザが意図していない処理が行われる
    - 影響と被害：
        - いたずら的書き込み、不正サイトへの誘導、犯罪予告といった掲示板やアンケートフォームへの不正な書き込み
        - 不正な書き込みを大量に行うことによるDoS攻撃
        - ...etc
    - 対策：
        - 外部サイトからのリクエストを処理しないようにシステムを構築する
        - 一般的なCSRF対策は以下のように行われる
            1. ユーザがフォーム入力ページにアクセスしたときに、ランダムな値（CSRFトークン）をセッションに保存する
                - このとき、セッションの保持期間が長すぎるとセキュリティリスクが高くなるため、ある程度短い時間でセッションが切れるようにする
                    - ※ 今回は1時間（`SESSION_SECONDS=3600`）としている
                - ランダムな値は十分な強度のある暗号化アルゴリズムを使って生成する必要がある
                    - ※ 今回は `deno_csrf#computeHmacTokenPair` を使うことにする
            2. リクエストにはCSRFトークンを含めるようにし、送られてきたリクエストのCSRFトークンをセッションと照合する
            3. CSRFトークンの値が異なる場合は、外部サイトから送られてきた不正なリクエストであるとみなし、処理を行わないようにする

#### `./app/.env`
```conf
# ...既存環境変数は省略

# HMAC ハッシュ生成用の鍵とソルト
# ※ 暗号化強度を高めるため、鍵とソルト情報はランダムに設定して非公開にすること
HMAC_SECRET=hmac0123456789key
HMAC_SALT=123
```

#### `./app/import_map.json`
```json
{
  "imports": {
    // ...既存ライブラリは省略

    "deno_csrf/": "https://deno.land/x/deno_csrf@0.0.5/",
    "std_cookie": "https://deno.land/std@0.159.0/http/cookie.ts"
  }
}
```

#### `./app/middleware/csrf.ts`
```typescript
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { Cookie, getCookies, setCookie } from "std_cookie";
import {
  computeHmacTokenPair,
  computeVerifyHmacTokenPair,
} from "deno_csrf/mod.ts";
import { type State } from "./session.ts";

/**
 * @typedef {Object} TokenPair
 * @property {boolean} isSuccess - Flag to determine if the token pair is successfully generated.
 * @property {string} tokenStr - Generated token.
 * @property {string} cookieStr - Cookie string.
 */

/**
 * Generate token pair.
 *
 * @private
 * @returns {TokenPair} It returns a generated TokenPair object.
 */
function computeTokenPair() {
  return computeHmacTokenPair(
    Deno.env.get("HMAC_SECRET"),
    Deno.env.get("HMAC_SALT")
  );
}

/**
 * Verify token pair.
 *
 * @private
 * @param {string} tokenStr - Token to be verified.
 * @param {string} cookieStr - Cookie string to be verified.
 * @returns {boolean}
 * It returns true if the specified token pair is valid.
 * Otherwise, it returns false.
 */
function verifyTokenPair(tokenStr: string, cookieStr: string): boolean {
  return computeVerifyHmacTokenPair(
    Deno.env.get("HMAC_SECRET"),
    tokenStr,
    cookieStr
  );
}

/**
 * Middleware handler to generate a CSRF token.
 *
 * @param {Request} req - Request object.
 * @param {MiddlewareHandlerContext<State>} ctx - Middleware handler context object.
 * @returns {Promise<Response>} It returns a response.
 */
export async function generateCsrfHandler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>
) {
  const { session } = ctx.state;
  const tokenPair = computeTokenPair();

  session.set("csrf", {
    tokenStr: tokenPair.tokenStr,
    cookieStr: tokenPair.cookieStr,
  });

  const response = await ctx.next();

  // Append cookie token to the response.
  if (session.has("csrf")) {
    const cookie: Cookie = {
      name: "_cookie_token",
      value: session.get("csrf").cookieStr,
      path: "/",
    };
    setCookie(response.headers, cookie);
  }
  return response;
}

/**
 * Middleware handler to verify a CSRF token.
 *
 * @param {Request} req - Request object.
 * @param {MiddlewareHandlerContext<State>} ctx - Middleware handler context object.
 * @returns {Promise<Response>} It returns a response.
 */
export async function verifyCsrfHandler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>
) {
  // If the current route method is not POST, do nothing.
  if (req.method !== "POST") {
    return await ctx.next();
  }

  // Get CSRF token from formData.csrfToken.
  const form = await req.formData();
  const formToken = form.get("csrfToken");
  const cookie = getCookies(req.headers);
  const cookieToken = cookie._cookie_token;

  const isCsrfTokenVerified = verifyTokenPair(formToken, cookieToken);
  if (isCsrfTokenVerified()) {
    return await ctx.next();
  }
  // If the requested CSRF token is invalid,
  //   set a flash message to display error message and redirect to /error.
  session.flash("Error", "不適切なリクエスト");
  return new Response("", {
    status: 303,
    headers: { Location: "/error" },
  });
}
```

CSRFチェックミドルウェアは、以下の2つのハンドラーで構成している

- `generateCsrfHandler`:
    - CSRF トークンを作成し、セッションに保存する
        - Cookie に CSRF トークンを設定するようにレスポンス指定する
    - フォームを描画するルートに適用する
- `verifyCsrfHandler`:
    - フォームリクエストに含まれる CSRF トークンを検証する
    - フォームの送信先ルートに適用する

CSRF トークンの検証エラーが発生した場合は `/error` ページへリダイレクトさせるため、エラーページも実装しておく

#### `./app/routes/error.tsx`
```tsx
import { Head } from "$fresh/runtime.ts";
import { Context, Handlers, PageProps } from "$fresh/server.ts";
import { WithSession } from "fresh_session/mod.ts";

export const handler: Handlers = {
  /**
   * GET custom handler function.
   * Set an error message from session before rendering the page component.
   *
   * @param {Request} _req - Server request object.
   * @param ctx - Server context object.
   * @returns {Promise<Response>} It returns a server response object.
   */
  async GET(_req: Request, ctx: Context<WithSession>) {
    const { session } = ctx.state;
    return await ctx.render({
      errorMessage: session.flash("Error") || "Unknown error",
    });
  },
};

/**
 * Page component.
 *
 * @param {PageProps<ResponseBody>} props - Component properties.
 * @returns {JSXElementConstructor<any>} It returns a JSX object.
 */
export default function ErrorPage(props: PageProps<ResponseBody>) {
  return (
    <>
      <Head>
        <title>Error</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-3xl font-bold">System Error</h1>
        <p class="mx-6 my-6">{props.data.errorMessage}</p>
      </div>
    </>
  );
}
```
