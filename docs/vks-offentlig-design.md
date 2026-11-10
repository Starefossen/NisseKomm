# NisseKomm on VKS: public design (proposal from home, 2026-11-10)

Hans approved the direction: nissekomm.no is public via gate. This design keeps
the public part small and leaves everything else on the LAN.

## Facts about home's edge (checked in the code)

- Gate is an L4 SNI filter with no TLS termination. It cannot see paths or
  headers in HTTPS, so it can't block `/mcp` or `/nissemor-guide`.
- Gate exposes a DomainMapping only if the DomainMapping itself has
  `gate.flaatten.org/expose: "true"`. Exposing the domain does not expose the
  ksvc's `*.fn.flaatten.org` name. Precedent: varden-blog
  (`apps/varden-blog/config/domainmapping.yaml`: ClusterDomainClaim +
  Certificate + DomainMapping).
- Gate does not send PROXY protocol. Behind gate, every internet client looks
  like the gate pod, so per-client-IP rate limiting in the app is not possible.
  Gate itself caps connections per IP (50 concurrent).
- Domain fronting is unverified: a client could send SNI `nissekomm.no` but
  `Host: <lan-only name>` and Kourier may route on Host. Home checks this
  separately. The design below doesn't depend on the answer.
- Certificates: cert-manager `letsencrypt-prod` uses DNS-01 via Namecheap.
  Where is nissekomm.no's DNS hosted? HTTP-01 does not work through gate (it
  redirects HTTP to HTTPS). Hans: confirm registrar/DNS for nissekomm.no.

## Shape: one image, two Knative services

|                  | `nissekomm` (public)                          | `nissekomm-lan` (LAN only)                                            |
| ---------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Hostname         | nissekomm.no (DomainMapping, exposed)         | nissekomm-lan.nissekomm.fn.flaatten.org                               |
| `NISSEKOMM_MODE` | `public`                                      | `lan`                                                                 |
| Routes           | Kid UI, kid login, kid game API, static media | `/mcp`, clip audio, parent guide (`/nissemor-guide`), dev/test panels |
| Auth             | Kid session cookie                            | MCP: Kanidm JWT. Parent guide: parent code (LAN only)                 |
| Scaling          | minScale 1 in Dec 1–Jan 6, else 0             | minScale 0 (MCP pulls tolerate a cold start)                          |

Mode enforcement lives in the app, not in the network: in `public` mode, the
`lan` routes are not registered (Next.js middleware returns 404 before any
handler, and the MCP module is not imported). This holds even if domain
fronting works, because the public pods never serve those routes.

Both services use the same Postgres (`nissekomm-db`). The DB is only reachable
from pods in namespace `nissekomm` (CiliumNetworkPolicy).

## Kid login (the only internet-facing auth surface)

- **Pairing, not passwords.** A parent pairs a kid device once: in the
  parent guide (LAN), generate a one-time pairing code (6 words or a QR code,
  valid 15 min, single use). The kid device redeems it on nissekomm.no and gets
  a long-lived session. Kids never type a static secret, and a code
  can't be guessed from the internet in its 15-minute window.
- **Fallback family code** (if pairing is too much work for v1): 4 random
  Norwegian words from a list of at least 2048 (about 44 bits), e.g.
  `snø-lykt-elg-bjelle`. Hash it with scrypt (node:crypto), never store it in
  plaintext, and compare in constant time.
- **Sessions:** a 256-bit random opaque token in a cookie named
  `__Host-nissekomm` with Secure, HttpOnly, SameSite=Lax, Path=/. Store
  `sha256(token)` in a Postgres `sessions` table with expiry (kid: 45 days,
  covering the season). Logout and revoke: delete the row. "Log out all
  devices" lives in the parent guide (LAN).
- **Rate limiting with no client IP:** keep counters in Postgres (works across
  pods and survives scale-to-zero):
  - global: max 20 failed logins per 10 min; after that, every login attempt
    gets 429 for 10 min (fails closed for attackers, and a kid can retry later)
  - per pairing code: 5 attempts, then the code is burned
  - log failures; at 20 or more failures in an hour, notify parents (home can
    provide ntfy; ask)
- **No account enumeration:** one generic error message.

## Parent access

- Parent guide, hints, frost controls, pairing and test panels exist only in
  `lan` mode. Parents use them at home.
- Parent auth in the LAN UI: a parent code (scrypt-hashed) or later Kanidm
  OIDC (home has `libs/kanidm-oidc` in Go; for Next.js, use a standard OIDC
  client against https://id.flaatten.org). v1: parent code is fine, since it's
  LAN only.
- MCP `parent` level: Kanidm JWT callers only (operator + future parent
  account). MCP `read` level: varden, radio-producer, skjerm.

## Hardening for the public service

- Security headers (in next.config `headers()`):
  - `Content-Security-Policy: default-src 'self'; img-src 'self' data:; media-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`
    (Next.js needs nonces or hashes for inline scripts; use the
    nonce-in-middleware pattern)
  - `Strict-Transport-Security: max-age=31536000`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy: camera=(self)` (QR scanner), everything else off
- CSRF: SameSite=Lax plus an Origin header check on every POST
  (`https://nissekomm.no` only).
- Errors: generic JSON with no stack traces (`NODE_ENV=production`).
- Request bodies: cap at 16 KB on API routes.
- No runtime egress (network policy allows DNS + Postgres only; the `lan`
  service also gets kanidm:8443 for JWKS).
- `NEXT_PUBLIC_URL=https://nissekomm.no`. Strip all `NEXT_PUBLIC_MOCK_*` and
  test flags from the prod build. Dev and test panels only in `lan` mode.
- Dependencies: `pnpm audit` in check, pinned lockfile, Node 24 LTS base
  image, non-root, read-only root filesystem.

## Review gate

The public service doesn't get the gate annotation until a second model has
reviewed, adversarially, NisseKomm's auth, session, rate-limit and mode-split
code. Home reviews its side (DomainMapping, network policies, the
domain-fronting check) the same way.

## Home side (for reference)

- ClusterDomainClaim + Certificate + DomainMapping for nissekomm.no (exposed),
  copied from varden-blog
- Pi-hole: nissekomm.no → 192.168.40.40 on the LAN
- Two ksvcs, CNPG cluster, network policies, Kanidm callers for MCP
- Gate: test domain fronting; consider PROXY protocol for real client IPs
  (separate home issue)

## Avgjort av Hans 10. november

- **Barnas kode:** tre korte ord er nok. Det finnes ingen personopplysninger i appen og eksponeringen er liten. Paring av enheter med engangskoder bygges ikke. Koden lagres som scrypt-hash, med begrensning globalt og per kode i Postgres.
