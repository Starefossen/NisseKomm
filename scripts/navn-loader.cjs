/**
 * Turbopack loader for browser bundles: swaps the family's names for tokens,
 * so /_next/static (public before login) never names the kids or their home.
 * src/lib/navn.ts fills the tokens back in after login.
 */
const TOKEN = {
  Kristian: "{{B1}}",
  KRISTIAN: "{{B1^}}",
  Håkon: "{{B2}}",
  HÅKON: "{{B2^}}",
  Hanna: "{{B3}}",
  HANNA: "{{B3^}}",
  Landås: "{{HJEM}}",
  LANDÅS: "{{HJEM^}}",
};
const RE = new RegExp(Object.keys(TOKEN).join("|"), "g");
module.exports = function navnLoader(src) {
  return src.replace(RE, (m) => TOKEN[m]);
};
module.exports.TOKEN = TOKEN;
