import { Head } from "$fresh/runtime.ts";

export default function InvalidForm() {
  return (
    <>
      <Head>
        <title>Invalid CSRF form test</title>
      </Head>
      <main class="container mx-auto my-4">
        <h1 class="text-3xl font-bold my-2">CSRFトークンなしフォーム</h1>
        <form method="POST" action="/test/csrf/result">
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
