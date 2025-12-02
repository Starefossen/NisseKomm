/**
 * Sanity Migration: Enable Email Subscriptions
 *
 * Sets emailSubscription=true for all existing familyCredentials documents
 * that don't have this field set. New registrations already default to true.
 *
 * Run with:
 *   # Dry run (preview changes)
 *   pnpm sanity migration run enable-email-subscriptions --dry-run
 *
 *   # Execute migration
 *   pnpm sanity migration run enable-email-subscriptions
 *
 * Created: December 2025
 * Reason: Email subscription feature launch - opt-in existing families
 */

import { defineMigration, set, at } from "@sanity/migrate";

export default defineMigration({
  title: "Enable email subscriptions for all existing families",
  documentTypes: ["familyCredentials"],

  migrate: {
    document(doc) {
      // Only process familyCredentials documents
      if (doc._type !== "familyCredentials") {
        return;
      }

      // Skip if emailSubscription is already explicitly set to true
      if (doc.emailSubscription === true) {
        return;
      }

      // Set emailSubscription to true for documents where it's missing or false
      return at("emailSubscription", set(true));
    },
  },
});
