/**
 * Cloudflare Access JWT validation (defense-in-depth).
 *
 * Access already enforces sign-in at the Cloudflare edge for this Worker's
 * hostname, so on *.workers.dev a request cannot reach us without a valid Access
 * session. Re-validating the `Cf-Access-Jwt-Assertion` token here is belt-and-
 * suspenders: it matters most if the app ever moves to a custom domain, where an
 * origin could in principle be reached directly.
 *
 * Config (see wrangler.jsonc `vars`):
 *   ACCESS_JWKS_URL  https://<team>.cloudflareaccess.com/cdn-cgi/access/certs
 *   ACCESS_AUD       the Application Audience (aud) tag from the Access app
 *
 * If either var is missing (e.g. local `wrangler dev` without .dev.vars), the
 * check is skipped with a warning. In production both are committed in
 * wrangler.jsonc, so a missing var means a config mistake, not silent bypass —
 * hence the loud console.warn.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AccessEnv {
  ACCESS_JWKS_URL?: string;
  ACCESS_AUD?: string;
}

// Memoize the JWKS so jose caches the signing keys instead of re-fetching
// /cdn-cgi/access/certs on every request. Env isn't available at module scope,
// so build it lazily on first use.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
function getJwks(jwksUrl: string) {
  jwks ??= createRemoteJWKSet(new URL(jwksUrl));
  return jwks;
}

/**
 * True if the request carries a valid Access JWT, or if Access validation is
 * not configured (skipped). False only when configured AND the token is missing
 * or invalid.
 */
export async function isAccessAuthorized(
  request: Request,
  env: AccessEnv,
): Promise<boolean> {
  // No Access sits in front of `wrangler dev` (localhost), and `vars` from
  // wrangler.jsonc ARE loaded there too — so a var-presence check alone would
  // 403 the whole local dev loop. Skip on localhost explicitly.
  const host = new URL(request.url).hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;

  const { ACCESS_JWKS_URL, ACCESS_AUD } = env;
  if (!ACCESS_JWKS_URL || !ACCESS_AUD) {
    console.warn(
      "Access JWT validation skipped: ACCESS_JWKS_URL / ACCESS_AUD not set.",
    );
    return true;
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return false;

  try {
    await jwtVerify(token, getJwks(ACCESS_JWKS_URL), {
      // CF Access `iss` is the team-domain origin with no trailing path; the
      // JWKs URL has the same origin, so we derive it (one fewer var to manage).
      issuer: new URL(ACCESS_JWKS_URL).origin,
      audience: ACCESS_AUD,
    });
    return true;
  } catch (err) {
    console.error("Access JWT validation failed:", err);
    return false;
  }
}
