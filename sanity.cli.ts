/**
 * Sanity CLI Configuration
 *
 * Configuration for Sanity CLI operations like deployment and dataset management.
 */

import { defineCliConfig } from "sanity/cli";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";

export default defineCliConfig({
  api: {
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  },
  deployment: {
    appId: "xihpax0331p0f4m84ek0bqjk",
  },
});
