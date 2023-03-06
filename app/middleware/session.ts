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
