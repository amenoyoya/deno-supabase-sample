import { sessionHandler } from "../middleware/session.ts";

/**
 * Middleware handlers for all routes.
 * routes/ 直下の _middleware.ts の handler は全ルートに対して適用される
 *
 * @see [RouteMiddleware]{@link https://fresh.deno.dev/docs/concepts/middleware}
 */
export const handler = [sessionHandler];
