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
