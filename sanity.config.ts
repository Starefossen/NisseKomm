/**
 * Sanity Studio Configuration
 *
 * This configuration sets up the Sanity Studio dashboard for managing
 * NisseKomm game sessions across development and production datasets.
 *
 * Deploy with: pnpm sanity deploy
 */

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";

// Sanity Studio uses SANITY_STUDIO_* prefix, Next.js uses NEXT_PUBLIC_* prefix
// For Sanity CLI commands (dev, deploy), use SANITY_STUDIO_* variables
// For Next.js runtime, use NEXT_PUBLIC_* variables
const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  "";
const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  "production";

if (!projectId) {
  throw new Error(
    "Missing required environment variable: SANITY_STUDIO_PROJECT_ID\n\n" +
      "For Sanity Studio (dev/deploy), add to .env.local:\n" +
      "  SANITY_STUDIO_PROJECT_ID=your-project-id\n" +
      "  SANITY_STUDIO_DATASET=production\n\n" +
      "For Next.js (runtime), also add:\n" +
      "  NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id\n" +
      "  NEXT_PUBLIC_SANITY_DATASET=production\n",
  );
}

// Single workspace configuration that works with CLI validation
export default defineConfig({
  name: "default",
  title: `NisseKomm (${dataset})`,
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title(
            `NisseKomm ${dataset === "development" ? "Development" : "Production"}`,
          )
          .items([
            S.listItem()
              .title("Familier")
              .child(
                S.documentTypeList("familyCredentials")
                  .title("Familier")
                  .filter('_type == "familyCredentials"')
                  .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
              ),
            S.listItem()
              .title("Spillsesjoner")
              .child(
                S.documentTypeList("userSession")
                  .title("Spillsesjoner")
                  .filter('_type == "userSession"')
                  .defaultOrdering([
                    { field: "lastUpdated", direction: "desc" },
                  ]),
              ),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
