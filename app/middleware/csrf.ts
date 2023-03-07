import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { Cookie, getCookies, setCookie } from "std_cookie";
import {
  computeHmacTokenPair,
  computeVerifyHmacTokenPair,
} from "deno_csrf/mod.ts";
import { type State } from "./session.ts";

/**
 * @typedef {Object} TokenPair
 * @property {boolean} isSuccess - Flag to determine if the token pair is successfully generated.
 * @property {string} tokenStr - Generated token.
 * @property {string} cookieStr - Cookie string.
 */

/**
 * Generate token pair.
 *
 * @private
 * @returns {TokenPair} It returns a generated TokenPair object.
 */
function computeTokenPair() {
  return computeHmacTokenPair(
    Deno.env.get("HMAC_SECRET"),
    Deno.env.get("HMAC_SALT")
  );
}

/**
 * Verify token pair.
 *
 * @private
 * @param {string} tokenStr - Token to be verified.
 * @param {string} cookieStr - Cookie string to be verified.
 * @returns {boolean}
 * It returns true if the specified token pair is valid.
 * Otherwise, it returns false.
 */
function verifyTokenPair(tokenStr: string, cookieStr: string): boolean {
  return computeVerifyHmacTokenPair(
    Deno.env.get("HMAC_SECRET"),
    tokenStr,
    cookieStr
  );
}

/**
 * Middleware handler to generate a CSRF token.
 *
 * @param {Request} req - Request object.
 * @param {MiddlewareHandlerContext<State>} ctx - Middleware handler context object.
 * @returns {Promise<Response>} It returns a response.
 */
export async function generateCsrfHandler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>
) {
  const { session } = ctx.state;
  const tokenPair = computeTokenPair();

  session.set("csrf", {
    tokenStr: tokenPair.tokenStr,
    cookieStr: tokenPair.cookieStr,
  });

  const response = await ctx.next();

  // Append cookie token to the response.
  if (session.has("csrf")) {
    const cookie: Cookie = {
      name: "_cookie_token",
      value: session.get("csrf").cookieStr,
      path: "/",
    };
    setCookie(response.headers, cookie);
  }
  return response;
}

/**
 * Middleware handler to verify a CSRF token.
 *
 * @param {Request} req - Request object.
 * @param {MiddlewareHandlerContext<State>} ctx - Middleware handler context object.
 * @returns {Promise<Response>} It returns a response.
 */
export async function verifyCsrfHandler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>
) {
  // If the current route method is not POST, do nothing.
  if (req.method !== "POST") {
    return await ctx.next();
  }

  // Get CSRF token from formData.csrfToken.
  const form = await req.formData();
  const formToken = form.get("csrfToken");
  const cookie = getCookies(req.headers);
  const cookieToken = cookie._cookie_token;

  const isCsrfTokenVerified = verifyTokenPair(formToken, cookieToken);
  if (isCsrfTokenVerified()) {
    return await ctx.next();
  }
  // If the requested CSRF token is invalid,
  //   set a flash message to display error message and redirect to /error.
  session.flash("Error", "不適切なリクエスト");
  return new Response("", {
    status: 303,
    headers: { Location: "/error" },
  });
}
