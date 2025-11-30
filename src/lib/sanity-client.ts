/**
 * Sanity CMS Client Configuration
 *
 * Provides both server-side and client-side Sanity clients for session persistence.
 * Server-side client uses write token for mutations, client-side is read-only.
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_SANITY_PROJECT_ID: Sanity project ID
 * - NEXT_PUBLIC_SANITY_DATASET: Dataset name (production/development)
 * - NEXT_PUBLIC_SANITY_API_VERSION: API version (e.g., "2024-11-01")
 * - SANITY_API_TOKEN: Write token (server-side only)
 */

import { createClient, type SanityClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-11-01";
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.warn(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Sanity storage backend will not work.",
  );
}

/**
 * Server-side Sanity client with write permissions
 * Only use this in API routes (never in client components)
 */
export const sanityServerClient: SanityClient = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  token, // Write token for mutations
  useCdn: false, // Always get fresh data on server
  perspective: "published",
});
