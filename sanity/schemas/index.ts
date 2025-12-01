/**
 * Sanity Schema Index
 *
 * Export all schema types for Sanity Studio configuration
 */

import { familyCredentials } from "./familyCredentials";
import { userSession } from "./userSession";

export const schemaTypes = [familyCredentials, userSession];
