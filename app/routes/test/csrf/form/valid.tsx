import { Head } from "$fresh/runtime.ts";

export const handler: Handlers = {
  GET(_req: Request, ctx: Context<WithSession>) {
    return ctx.render({
      csrfToken: ctx.state.session.get("csrf").tokenStr,
    });
  },
};

export default function ValidForm(props: PageProps) {
  return (
    <>
      <Head>
        <title>Valid CSRF form test</title>
      </Head>
      <main class="container mx-auto my-4">
        <h1 class="text-3xl font-bold my-2">CSRFトークン付きフォーム</h1>
        <form method="POST" action="/test/csrf/result">
          <input type="hidden" name="csrfToken" value={props.data.csrfToken} />
          <input
            type="submit"
            value="送信"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          />
        </form>
      </main>
    </>
  );
}
