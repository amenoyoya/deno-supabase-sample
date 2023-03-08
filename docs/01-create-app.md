# deno-supabase-sample

## アプリケーション作成

まずは、Deno 向け Web フレームワーク Fresh をセットアップし、Supabase Edge Functions との疎通確認を行う

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
# create a new supabase edge functions: `test-connection`
$ supabase functions new test-connection

## => ./supabase/functions/test-connection/ will be created
```

とりあえず、作成された Edge Functions をそのまま http サーバとして実行する

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

### Fresh から Supabase Edge Functions を呼び出す
`.env` ファイルに Supabase Edge Functions に関する環境変数を設定する

#### `./app/.env`
```conf
SUPABASE_EDGE_FUNCTION_END_POINT=http://localhost:54321/functions/v1/
SUPABASE_ANON_KEY=${supabase anon key}
```

Fresh から `.env` ファイルの環境変数情報を読み込むように、スクリプトを修正する

#### `./app/import_map.json`
```diff
  {
    "imports": {
      "$fresh/": "https://deno.land/x/fresh@1.1.3/",
      "preact": "https://esm.sh/preact@10.11.0",
      "preact/": "https://esm.sh/preact@10.11.0/",
      "preact-render-to-string": "https://esm.sh/*preact-render-to-string@5.2.4",
      "@preact/signals": "https://esm.sh/*@preact/signals@1.0.3",
      "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.0.1",
      "twind": "https://esm.sh/twind@0.16.17",
      "twind/": "https://esm.sh/twind@0.16.17/",
+     "dotenv/": "https://deno.land/std@0.145.0/dotenv/"
    }
  }
```

#### `./app/main.ts`
```diff
  /// <reference no-default-lib="true" />
  /// <reference lib="dom" />
  /// <reference lib="dom.iterable" />
  /// <reference lib="dom.asynciterable" />
  /// <reference lib="deno.ns" />

+ import "dotenv/load.ts"; // for loading .env file
  import { start } from "$fresh/server.ts";
  import manifest from "./fresh.gen.ts";
  
  import twindPlugin from "$fresh/plugins/twind.ts";
  import twindConfig from "./twind.config.ts";
  
  await start(manifest, { plugins: [twindPlugin(twindConfig)] });
```

`.env` から読み込んだ環境変数情報は `Deno.env.get(envKey)` 関数で取得することができる

http://localhost:8000/test/supabase-connection/ ページにて Supabase Edge Functions との疎通確認を行えるように、`routes/test/supabase-connection/index.tsx` を作成する

#### `./app/routes/test/supabase-connection/index.tsx`
```tsx
import { Handlers, PageProps, Context } from "$fresh/server.ts";

/**
 * Response body object of the Supabase Edge Functions API.
 */
interface ResponseBody {
  message: string;
}

/**
 * Custom handlers.
 * Fresh では `Request => Response` | `Request => Promise<Response>` 型の関数がHTTPリクエスト処理ハンドラーとなる
 * HTTPメソッド（GET, POST, PUT, PATCH, DELETE）ごとに処理ハンドラーを定義可能
 *
 * @see [CustomHandlers]{@link https://fresh.deno.dev/docs/getting-started/custom-handlers}
 */
export const handler: Handlers<ResponseBody | null> = {
  /**
   * GET custom handler function.
   * HTTP GET リクエストに対する処理ハンドラーを定義
   *
   * @param {Request} _req - Server request object.
   * @param {Context} ctx - Server context object.
   * @returns {Promise<Response>} It returns a server response object.
   */
  async GET(_req: Request, ctx: Context) {
    const result = await fetch(
      Deno.env.get("SUPABASE_EDGE_FUNCTION_END_POINT"),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Functions" }),
      }
    );

    if (result.status === 404) {
      return ctx.render(null);
    }
    const message: ResponseBody = await result.json(); // => will be { message: 'Hello Functions!' }

    // ctx.render(props) は export default で定義された Page component の描画結果をレスポンスとして返す
    return ctx.render(message);
  },
};

/**
 * Page component.
 *
 * @see [CreateRoute]{@link https://fresh.deno.dev/docs/getting-started/create-a-route}
 * @param {PageProps<ResponseBody>} props - Component properties.
 * @returns {JSXElementConstructor<any>} It returns a JSX object.
 */
export default function Greet(props: PageProps<ResponseBody>) {
  return (
    <div>
      Response <b>'{props.data.message}'</b> from supabase edge functions
    </div>
  );
}
```

⇒ http://localhost:8000/test/supabase-connection/ にアクセスすると、以下のように表示される

```html
<div>
    Response <b>'Hello Functions!'</b> from supabase edge functions
</div>
```

---

## Deno Task の設定

現状、以下の2つのコマンドを並列に実行しなければいけない状態になっている

- Supabase Edge Functions サーバ (`test-connection`) 実行
    - `$ supabase functions serve test-connection`
- Fresh 開発サーバ実行
    - `$ deno task --cwd app start`

この2つのコマンドをまとめて実行するための Deno Task を作成しておく

（起動中の Supabase Edge Functions サーバと Fresh 開発サーバは `Ctrl + C` で停止しておく）

### `./deno.json`
```json
{
    "tasks": {
        // ...既存の Task は省略

        "start": "supabase functions serve test-connection & deno task --cwd app start"
    }
}
```

複数のコマンドを並列実行したい場合は `&` で繋げれば良い

上記のように Deno Task を作成することで `deno task start` コマンド一発で、Supabase Edge Functions サーバと Fresh 開発サーバを起動できるようになる

```bash
$ deno task start
```

---

## ダイナミックルーティング

ここまでで Fresh ⇒ Supabase Edge Functions の疎通は取れたが、現状、固定のレスポンスしか取ることができない

そのため、ダイナミックルーティングを活用して、リクエストパスを変数化 ⇒ Supabase Edge Functions に任意の値でリクエストを送れるようにしてみる

Fresh では `routes/**/[name].tsx` のような形でファイルを作成すると `/**/:name` へのダイナミックルーティングを行うことができる

- 参考: https://fresh.deno.dev/docs/getting-started/dynamic-routes

### `./app/routes/test/supabase-connection/[request_text].tsx`
```tsx
import { Handlers, PageProps, Context } from "$fresh/server.ts";

/**
 * Response body object of the Supabase Edge Functions API.
 */
interface ResponseBody {
  message: string;
}

/**
 * Custom handlers.
 * Fresh では `Request => Response` | `Request => Promise<Response>` 型の関数がHTTPリクエスト処理ハンドラーとなる
 * HTTPメソッド（GET, POST, PUT, PATCH, DELETE）ごとに処理ハンドラーを定義可能
 *
 * @see [CustomHandlers]{@link https://fresh.deno.dev/docs/getting-started/custom-handlers}
 */
export const handler: Handlers<ResponseBody | null> = {
  /**
   * GET custom handler function.
   * HTTP GET リクエストに対する処理ハンドラーを定義
   *
   * @param {Request} _req - Server request object.
   * @param {Context} ctx - Server context object.
   * @returns {Promise<Response>} It returns a server response object.
   */
  async GET(_req: Request, ctx: Context) {
    const result = await fetch(
      Deno.env.get("SUPABASE_EDGE_FUNCTION_END_POINT"),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          "Content-Type": "application/json",
        },
        // ダイナミックルーティングで指定される [request_text] 値をリクエストボディとして設定
        body: JSON.stringify({ name: ctx.params.request_text }),
      }
    );

    if (result.status === 404) {
      return ctx.render(null);
    }
    const message: ResponseBody = await result.json(); // => will be { message: `Hello ${ctx.params.request_text}!` }

    // ctx.render(props) は export default で定義された Page component の描画結果をレスポンスとして返す
    return ctx.render(message);
  },
};

/**
 * Page component.
 *
 * @see [CreateRoute]{@link https://fresh.deno.dev/docs/getting-started/create-a-route}
 * @param {PageProps<ResponseBody>} props - Component properties.
 * @returns {JSXElementConstructor<any>} It returns a JSX object.
 */
export default function Greet(props: PageProps<ResponseBody>) {
  return (
    <div>
      Response <b>'{props.data.message}'</b> from supabase edge functions
    </div>
  );
}
```

⇒ これで、例えば http://localhost:8000/test/supabase-connection/DynamicRouting にアクセスすると、以下のように表示されるようになる

```html
<div>
  Response <b>'Hello DynamicRouting!'</b> from supabase edge functions
</div>
```

---

## HTML 言語設定

Fresh はデフォルトで `html lang="en"` が設定されており、英語用のWebアプリケーションとなっている

これを日本語対応にするため、`html lang="ja"` を設定する

### `./app/main.ts`
```diff
  /// <reference no-default-lib="true" />
  /// <reference lib="dom" />
  /// <reference lib="dom.iterable" />
  /// <reference lib="dom.asynciterable" />
  /// <reference lib="deno.ns" />
  
  import "dotenv/load.ts"; // for loading .env file
- import { start } from "$fresh/server.ts";
+ import { start, RenderFunction } from "$fresh/server.ts";
  import manifest from "./fresh.gen.ts";
  
  import twindPlugin from "$fresh/plugins/twind.ts";
  import twindConfig from "./twind.config.ts";

+ const renderFn: RenderFunction = (ctx, render) => {
+   ctx.lang = "ja";
+   render();
+ };
  
  await start(manifest, {
    plugins: [twindPlugin(twindConfig)],
+   render: renderFn,
  });
```
