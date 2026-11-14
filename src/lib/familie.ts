/**
 * The family's names, server only. Browser bundles carry tokens instead
 * (scripts/navn-loader.cjs); FamilieNavn fills them after login from
 * GET /api/familie, so nothing served before login names the kids.
 */
import "server-only";

export const FAMILIE = {
  barn: ["Kristian", "Håkon", "Hanna"],
  hjem: "Landås",
};
