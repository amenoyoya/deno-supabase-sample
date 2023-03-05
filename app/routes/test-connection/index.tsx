import { Handlers, PageProps, Context } from "$fresh/server.ts";

interface ResponseBody {
  message: string;
}

export const handler: Handlers<ResponseBody | null> = {
  async GET(_, ctx: Context) {
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
    const message: ResponseBody = await result.json();
    return ctx.render(message);
  },
};

export default function Greet(props: PageProps<ResponseBody>) {
  return (
    <div>
      Response <b>'{props.data.message}'</b> from supabase edge functions
    </div>
  );
}
