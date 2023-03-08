import { Head } from "$fresh/runtime.ts";

export const handler: Handlers = {
  async POST(req: Request, ctx: Context) {
    return await ctx.render({
      // Request#formData などの2回以上呼ぶと Body already consumed エラーになるメソッドは
      //   基本的に clone() してから呼ぶようにした方が安全
      form: await req.clone().formData(),
    });
  },
};

export default function ValidForm(props: PageProps) {
  return (
    <>
      <Head>
        <title>Form submit result</title>
      </Head>
      <main class="container mx-auto my-4">
        <h1 class="text-3xl font-bold my-2">フォームは正しく送信されました</h1>
        <dl class="flex flex-wrap mx-2 my-2">
          <dt class="font-bold">CSRF Token</dt>
          <dd class="overflow-auto">{props.data.form.get("csrfToken")}</dd>
        </dl>
      </main>
    </>
  );
}
