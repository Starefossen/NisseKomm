/**
 * Kid Code API - Get kid code for Day 1 code resolution
 *
 * GET /api/session/kid-code?sessionId=xxx
 * - Returns kidCode from familyCredentials for the session
 */

import { NextRequest } from "next/server";
import {
  requireSessionId,
  requireCredentials,
  createErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET - Retrieve kid code from familyCredentials
 */
export async function GET(request: NextRequest) {
  try {
    const sessionIdResult = requireSessionId(request);
    if ("error" in sessionIdResult) return sessionIdResult.error;
    const { sessionId } = sessionIdResult;

    const credentialsResult = await requireCredentials(sessionId);
    if ("error" in credentialsResult) return credentialsResult.error;
    const { credentials } = credentialsResult;

    return successResponse({ kidCode: credentials.kidCode || null });
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch kid code");
  }
}
