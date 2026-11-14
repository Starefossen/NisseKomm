/**
 * Turbopack loader for browser bundles: swaps the family's names (any case)
 * for tokens, so /_next/static (public before login) never names the kids or
 * their home. src/lib/navn.ts fills them in after login.
 */
const NAVN = { kristian: "B1", håkon: "B2", hanna: "B3", landås: "HJEM" };
const RE = /kristian|håkon|hanna|landås/gi;
module.exports = function navnLoader(src) {
  return src.replace(RE, (m) => {
    const k = NAVN[m.toLowerCase()];
    if (m === m.toLowerCase()) return `{{${k.toLowerCase()}}}`;
    if (m === m.toUpperCase()) return `{{${k}^}}`;
    return `{{${k}}}`;
  });
};
