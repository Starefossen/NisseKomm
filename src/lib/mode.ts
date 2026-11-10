/**
 * NISSEKOMM_MODE=public|lan. Public (nissekomm.no) serves only the kid app;
 * parent guide, dev pages, /mcp and test panels exist only on the LAN service.
 * Unset means lan in dev and public in production, so a missing env var fails closed.
 */
export function isLanMode(): boolean {
  const mode = process.env.NISSEKOMM_MODE;
  if (mode) return mode === "lan";
  return process.env.NODE_ENV !== "production";
}

const LAN_ONLY_PREFIXES = ["/nissemor-guide", "/dev", "/mcp"];

export function isLanOnlyPath(pathname: string): boolean {
  return LAN_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}
