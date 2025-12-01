/**
 * Sanity Schema Index
 *
 * Export all schema types for Sanity Studio configuration
 */

import { familyCredentials } from "./familyCredentials";
import {
  userSession,
  submittedCodeType,
  bonusOppdragBadgeType,
  eventyrBadgeType,
  earnedBadgeType,
  topicUnlockType,
  collectedSymbolType,
  decryptionAttemptType,
  failedAttemptType,
  santaLetterType,
  brevfuglType,
} from "./userSession";

export const schemaTypes = [
  familyCredentials,
  userSession,
  // Object types used in arrays (must be registered)
  submittedCodeType,
  bonusOppdragBadgeType,
  eventyrBadgeType,
  earnedBadgeType,
  topicUnlockType,
  collectedSymbolType,
  decryptionAttemptType,
  failedAttemptType,
  santaLetterType,
  brevfuglType,
];
