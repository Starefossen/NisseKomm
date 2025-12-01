/**
 * Sanity Schema: User Session
 *
 * Stores all game progress and user state for cross-device persistence.
 * Maps directly to StorageManager keys from src/lib/storage.ts
 *
 * IMPORTANT: This schema must be deployed to your Sanity project
 * before the storage backend will work.
 *
 * To deploy:
 * 1. Set up Sanity Studio for your project
 * 2. Import this schema in your studio config
 * 3. Run `sanity deploy` to update schema
 */

import { defineType } from "sanity";

// Define reusable object types first
export const submittedCodeType = defineType({
  name: "submittedCode",
  title: "Submitted Code",
  type: "object",
  fields: [
    {
      name: "kode",
      title: "Code",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "dato",
      title: "Date",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "ISO timestamp when code was submitted",
    },
  ],
});

export const bonusOppdragBadgeType = defineType({
  name: "bonusOppdragBadge",
  title: "Bonus Quest Badge",
  type: "object",
  fields: [
    { name: "day", type: "number" },
    { name: "icon", type: "string" },
    { name: "navn", type: "string" },
  ],
});

export const eventyrBadgeType = defineType({
  name: "eventyrBadge",
  title: "Story Arc Badge",
  type: "object",
  fields: [
    { name: "eventyrId", type: "string" },
    { name: "icon", type: "string" },
    { name: "navn", type: "string" },
  ],
});

export const earnedBadgeType = defineType({
  name: "earnedBadge",
  title: "Earned Badge",
  type: "object",
  fields: [
    { name: "badgeId", type: "string" },
    { name: "timestamp", type: "number" },
  ],
});

export const topicUnlockType = defineType({
  name: "topicUnlock",
  title: "Topic Unlock",
  type: "object",
  fields: [
    {
      name: "topic",
      title: "Topic",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Topic keyword (kebab-case)",
    },
    {
      name: "day",
      title: "Day",
      type: "number",
      validation: (Rule) => Rule.required().min(1).max(24),
      description: "Day number when topic was unlocked",
    },
  ],
});

export const collectedSymbolType = defineType({
  name: "collectedSymbol",
  title: "Collected Symbol",
  type: "object",
  fields: [
    { name: "symbolId", type: "string" },
    { name: "symbolIcon", type: "string" },
    { name: "description", type: "string" },
  ],
});

export const decryptionAttemptType = defineType({
  name: "decryptionAttempt",
  title: "Decryption Attempt",
  type: "object",
  fields: [
    {
      name: "challengeId",
      title: "Challenge ID",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Decryption challenge identifier",
    },
    {
      name: "attemptCount",
      title: "Attempt Count",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
      description: "Number of failed attempts",
    },
  ],
});

export const failedAttemptType = defineType({
  name: "failedAttempt",
  title: "Failed Attempt",
  type: "object",
  fields: [
    {
      name: "day",
      title: "Day",
      type: "number",
      validation: (Rule) => Rule.required().min(1).max(24),
      description: "Quest day number",
    },
    {
      name: "attemptCount",
      title: "Attempt Count",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
      description: "Number of failed code submissions",
    },
  ],
});

export const santaLetterType = defineType({
  name: "santaLetter",
  title: "Santa Letter",
  type: "object",
  fields: [
    { name: "day", type: "number" },
    { name: "content", type: "text" },
  ],
});

export const brevfuglType = defineType({
  name: "brevfugl",
  title: "Brevfugl",
  type: "object",
  fields: [
    { name: "dag", type: "number" },
    { name: "innhold", type: "text" },
    { name: "tidspunkt", type: "string" },
  ],
});

export const userSession = defineType({
  name: "userSession",
  title: "User Session",
  type: "document",
  fields: [
    // ============================================================
    // Session Identification (Multi-Tenant)
    // ============================================================
    {
      name: "sessionId",
      title: "Session ID",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Hashed boot password - unique tenant identifier",
    },
    {
      name: "lastUpdated",
      title: "Last Updated",
      type: "datetime",
      validation: (Rule) => Rule.required(),
      description: "Timestamp of last session update",
    },

    // ============================================================
    // Authentication & User Preferences
    // ============================================================
    {
      name: "authenticated",
      title: "Authenticated",
      type: "boolean",
      initialValue: false,
      description: "Boot password authentication status",
    },
    {
      name: "soundsEnabled",
      title: "Sounds Enabled",
      type: "boolean",
      initialValue: true,
      description: "Sound effects toggle",
    },
    {
      name: "musicEnabled",
      title: "Music Enabled",
      type: "boolean",
      initialValue: false,
      description: "Background music toggle",
    },

    // ============================================================
    // Quest Progress
    // ============================================================
    {
      name: "submittedCodes",
      title: "Submitted Codes",
      type: "array",
      of: [{ type: "submittedCode" }],
      description: "Array of successfully submitted quest codes",
    },
    {
      name: "viewedEmails",
      title: "Viewed Emails",
      type: "array",
      of: [{ type: "number" }],
      description: "Array of day numbers for viewed main emails",
    },
    {
      name: "viewedBonusOppdragEmails",
      title: "Viewed Bonus Quest Emails",
      type: "array",
      of: [{ type: "number" }],
      description: "Array of day numbers for viewed bonus quest emails",
    },

    // ============================================================
    // Badges & Achievements
    // ============================================================
    {
      name: "bonusOppdragBadges",
      title: "Bonus Quest Badges",
      type: "array",
      of: [{ type: "bonusOppdragBadge" }],
      description: "Parent-validated crisis resolution badges",
    },
    {
      name: "eventyrBadges",
      title: "Story Arc Badges",
      type: "array",
      of: [{ type: "eventyrBadge" }],
      description: "Eventyr completion badges",
    },
    {
      name: "earnedBadges",
      title: "Earned Badges (Unified System)",
      type: "array",
      of: [{ type: "earnedBadge" }],
      description: "Unified badge system tracking all earned badges",
    },

    // ============================================================
    // Content Unlocks
    // ============================================================
    {
      name: "topicUnlocks",
      title: "Topic Unlocks",
      type: "array",
      of: [{ type: "topicUnlock" }],
      description: "Array of unlocked topics with their unlock days",
    },
    {
      name: "unlockedFiles",
      title: "Unlocked Files",
      type: "array",
      of: [{ type: "string" }],
      description: "Array of file IDs accessible in NisseNet",
    },
    {
      name: "unlockedModules",
      title: "Unlocked Modules",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Array of unlocked module IDs (NISSEKRYPTO, NISSEMUSIKK, etc.)",
    },

    // ============================================================
    // Symbol Collection & Decryption
    // ============================================================
    {
      name: "collectedSymbols",
      title: "Collected Symbols",
      type: "array",
      of: [{ type: "collectedSymbol" }],
      description: "Physical QR symbols collected via scanner",
    },
    {
      name: "solvedDecryptions",
      title: "Solved Decryptions",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Array of solved decryption challenge IDs (frosne-koder, stjernetegn, hjertets-hemmelighet)",
    },
    {
      name: "decryptionAttempts",
      title: "Decryption Attempts",
      type: "array",
      of: [{ type: "decryptionAttempt" }],
      description: "Array of decryption challenges with attempt counts",
    },

    // ============================================================
    // Failed Attempts & Progressive Hints
    // ============================================================
    {
      name: "failedAttempts",
      title: "Failed Code Attempts",
      type: "array",
      of: [{ type: "failedAttempt" }],
      description: "Array of quest days with failed attempt counts",
    },

    // ============================================================
    // Crisis Management
    // ============================================================
    {
      name: "crisisStatus",
      title: "Crisis Resolution Status",
      type: "object",
      fields: [
        {
          name: "antenna",
          type: "boolean",
          initialValue: false,
          description: "Day 11 antenna crisis resolved",
        },
        {
          name: "inventory",
          type: "boolean",
          initialValue: false,
          description: "Day 16 inventory crisis resolved",
        },
      ],
      description: "Bonusoppdrag crisis resolution tracking",
    },

    // ============================================================
    // Letters & Communications
    // ============================================================
    {
      name: "santaLetters",
      title: "Santa Letters (BREVFUGLER)",
      type: "array",
      of: [{ type: "santaLetter" }],
      description: "Legacy santa letters system",
    },
    {
      name: "brevfugler",
      title: "Brevfugler (Parent-transcribed letters)",
      type: "array",
      of: [{ type: "brevfugl" }],
      description: "Parent-transcribed letters from children to Santa",
    },

    // ============================================================
    // UI State & Tracking
    // ============================================================
    {
      name: "nissenetLastVisit",
      title: "NisseNet Last Visit",
      type: "number",
      initialValue: 0,
      description: "Last day NisseNet was visited (for unread badge)",
    },
    {
      name: "playerNames",
      title: "Player Names",
      type: "array",
      of: [{ type: "string" }],
      description: "Children's names for Day 23 Nice List personalization",
    },
    {
      name: "friendNames",
      title: "Friend Names",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.max(15),
      description:
        "Friend names for snill_slem_liste.txt personalization (0-15)",
    },
    {
      name: "niceListLastViewed",
      title: "Nice List Last Viewed",
      type: "string",
      description: "ISO timestamp when Nice List was last opened",
    },
    {
      name: "dagbokLastRead",
      title: "Dagbok Last Read Day",
      type: "number",
      initialValue: 0,
      description: "Last diary entry day that was read (for scroll position)",
    },
  ],
  preview: {
    select: {
      title: "sessionId",
      subtitle: "lastUpdated",
    },
  },
});
