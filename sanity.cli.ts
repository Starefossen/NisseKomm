/**
 * Sanity CLI Configuration
 *
 * Configuration for Sanity CLI operations like deployment and dataset management.
 */

import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

// Map dataset to studio appId
const appIds = {
  development: "xihpax0331p0f4m84ek0bqjk", // nissekomm-dev.sanity.studio
  production: "plxedqg3xd4ep7n1qyb5zlv2", // nissekomm.sanity.studio (or your prod URL)
};

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  deployment: {
    appId: appIds[dataset as keyof typeof appIds] || appIds.production,
  },
});
