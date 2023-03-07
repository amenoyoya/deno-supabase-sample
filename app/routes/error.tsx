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
