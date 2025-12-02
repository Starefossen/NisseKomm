/**
 * Sanity Schema: Family Credentials
 *
 * Stores authentication credentials for multi-tenant family sessions.
 * Each family gets two codes:
 * - kidCode: Theme-based, memorable code for kids (e.g., "NISSEKRAFT2024")
 * - parentCode: Secure code for parent guide access (e.g., "NORDPOL-8N4K2")
 *
 * Links to userSession via sessionId for game progress storage.
 */

import { defineType } from "sanity";

/**
 * Calendar Event object type for custom family real-world events
 */
export const calendarEventType = defineType({
  name: "calendarEvent",
  title: "Calendar Event",
  type: "object",
  fields: [
    {
      name: "dag",
      title: "Day",
      type: "number",
      validation: (Rule) => Rule.required().min(1).max(24),
      description: "Calendar day (1-24)",
    },
    {
      name: "hendelse",
      title: "Event",
      type: "string",
      validation: (Rule) => Rule.required().max(50),
      description: "Event description (max 50 characters)",
    },
  ],
});

export const familyCredentials = defineType({
  name: "familyCredentials",
  title: "Family Credentials",
  type: "document",
  fields: [
    // ============================================================
    // Authentication Codes
    // ============================================================
    {
      name: "kidCode",
      title: "Kid Code",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Theme-based code for kids to log in (e.g., NISSEKRAFT2024)",
    },
    {
      name: "parentCode",
      title: "Parent Code",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Secure code for parent guide access (e.g., NORDPOL-8N4K2)",
    },

    // ============================================================
    // Session Link
    // ============================================================
    {
      name: "sessionId",
      title: "Session ID",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "UUID linking to userSession document",
    },

    // ============================================================
    // Family Information
    // ============================================================
    {
      name: "familyName",
      title: "Family Name",
      type: "string",
      validation: (Rule) => Rule.required().max(50),
      description: "Family display name (required, max 50 characters)",
    },
    {
      name: "kidNames",
      title: "Kid Names",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required().min(1).max(4),
      description:
        "Names of children for Nice List personalization (required: 1-4)",
    },
    {
      name: "friendNames",
      title: "Friend Names",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.max(15),
      description: "Friend names for snill_slem_liste.txt padding (0-15)",
    },
    {
      name: "parentEmail",
      title: "Parent Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
      description: "Parent email for recovery (required, valid email format)",
    },
    {
      name: "emailSubscription",
      title: "Email Subscription",
      type: "boolean",
      initialValue: true,
      description: "Subscribe to daily mission reminder emails at 21:00",
    },

    // ============================================================
    // Metadata
    // ============================================================
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (Rule) => Rule.required(),
      description: "Registration timestamp",
    },
    {
      name: "lastRecoveryEmail",
      title: "Last Recovery Email",
      type: "datetime",
      description: "Timestamp of last recovery email sent (for rate limiting)",
    },

    // ============================================================
    // Calendar Events (Custom family real-world events)
    // ============================================================
    {
      name: "calendarEvents",
      title: "Calendar Events",
      type: "array",
      of: [{ type: "calendarEvent" }],
      description:
        "Custom real-world events for the calendar (e.g., birthday, family dinner)",
    },
  ],
  preview: {
    select: {
      title: "familyName",
      subtitle: "kidCode",
      email: "parentEmail",
      description: "createdAt",
    },
    prepare({ title, subtitle, email, description }) {
      return {
        title: title || "Unnamed Family",
        subtitle: `Kid Code: ${subtitle} | ${email || "No email"}`,
        description: description
          ? new Date(description).toLocaleDateString()
          : "",
      };
    },
  },
});
