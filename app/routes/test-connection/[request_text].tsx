import { Handlers, PageProps, Context } from "$fresh/server.ts";

/**
 * Response body object of the Supabase Edge Functions API.
 */
interface ResponseBody {
  message: string;
}

/**
 * Custom handlers.
 * Fresh では `Request => Response` | `Request => Promise<Response>` 型の関数を定義すると、
 *   ルートへのリクエストが発生するたびに呼ばれるイベントを作成することができる
 *
 * @see [CustomHandlers]{@link https://fresh.deno.dev/docs/getting-started/custom-handlers}
 */
export const handler: Handlers<ResponseBody | null> = {
  /**
   * GET custom handler function.
   * ページコンポーネントの描画前に呼び出されるハンドラー
   * 戻り値として Context#render(props: PageProps<ResponseBody>) の結果を返すことでページコンポーネントを描画することができる
   *
   * @param {Request} _req - Server request object.
   * @param ctx - Server context object.
   * @returns {Promise<Response>} It returns a server response object.
   */
  async GET(_req, ctx: Context) {
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
    return ctx.render(message);
  },
};

/**
 * Page component.
 * default export した関数／クラス型コンポーネントで定義された JSX がレンダリングされる
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
