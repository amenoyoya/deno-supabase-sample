/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "dotenv/load.ts"; // for loading .env file
import { start, RenderFunction } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

const renderFn: RenderFunction = (ctx, render) => {
  ctx.lang = "ja";
  render();
};

await start(manifest, {
  plugins: [twindPlugin(twindConfig)],
  render: renderFn,
});
