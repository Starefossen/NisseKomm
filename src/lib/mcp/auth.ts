/**
 * MCP caller auth (fase5-plan «Avgjort 10. november», from Varden).
 * Kanidm access token: iss + aud `mcp` + scope `groups`, ES256, typ at+jwt.
 * The caller is identified by `sub` via MCP_CALLERS; an unknown sub is 401.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";

export type Level = "read" | "parent";
export type Caller = { name: string; level: Level };

const DEFAULT_ISSUER = "https://id.flaatten.org/oauth2/openid/mcp";

// jose fetches on the first verify (a cold start waits for it), caches the
// keys and refetches when a token names an unknown kid.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
function jwks() {
  const url = process.env.MCP_JWKS_URL ?? `${DEFAULT_ISSUER}/public_key.jwk`;
  let set = jwksCache.get(url);
  if (!set) jwksCache.set(url, (set = createRemoteJWKSet(new URL(url))));
  return set;
}

const isLevel = (l: unknown): l is Level => l === "read" || l === "parent";

/** MCP_CALLERS = {"<uuid>": {"name": "...", "level": "read"|"parent"}} */
function callerFor(sub: string): Caller | null {
  try {
    const c = JSON.parse(process.env.MCP_CALLERS ?? "{}")[sub];
    return c && isLevel(c.level)
      ? { name: String(c.name), level: c.level }
      : null;
  } catch {
    return null;
  }
}

/** MCP_DEV_TOKEN="read:<token>,parent:<token>". Never honoured in production. */
function devCaller(token: string): Caller | null {
  if (process.env.NODE_ENV === "production") return null;
  for (const pair of (process.env.MCP_DEV_TOKEN ?? "").split(",")) {
    const i = pair.indexOf(":");
    const level = pair.slice(0, i).trim();
    const tok = pair.slice(i + 1).trim();
    if (i > 0 && tok.length >= 8 && tok === token && isLevel(level)) {
      return { name: `dev-${level}`, level };
    }
  }
  return null;
}

export async function authenticate(req: Request): Promise<Caller | null> {
  const m = /^Bearer (\S+)$/.exec(req.headers.get("authorization") ?? "");
  if (!m) return null;
  const dev = devCaller(m[1]);
  if (dev) return dev;
  try {
    const { payload } = await jwtVerify(m[1], jwks(), {
      issuer: process.env.MCP_ISSUER ?? DEFAULT_ISSUER,
      audience: "mcp",
      algorithms: ["ES256"],
      typ: "at+jwt",
      clockTolerance: 60,
    });
    const scope = payload.scope;
    const scopes = Array.isArray(scope)
      ? scope
      : typeof scope === "string"
        ? scope.split(" ")
        : [];
    if (!scopes.includes("groups") || !payload.sub) return null;
    return callerFor(payload.sub);
  } catch {
    return null;
  }
}
