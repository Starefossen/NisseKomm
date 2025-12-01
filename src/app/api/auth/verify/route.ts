/**
 * Auth Verification API Endpoint
 *
 * Verifies authentication status and role from session cookie.
 * Used by GuideAuth to check parent access.
 *
 * GET /api/auth/verify
 * Returns: { authenticated: boolean, role: 'kid' | 'parent' | null }
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  requireCredentials,
  successResponse,
  createErrorResponse,
} from "@/lib/api-utils";

interface VerifyResponse {
  authenticated: boolean;
  role: "kid" | "parent" | null;
  sessionId?: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("nissekomm-session")?.value;

    if (!sessionId) {
      return successResponse({
        authenticated: false,
        role: null,
      } as VerifyResponse);
    }

    // Find familyCredentials by sessionId
    const credentialsResult = await requireCredentials(sessionId);
    if ("error" in credentialsResult) {
      return successResponse({
        authenticated: false,
        role: null,
      } as VerifyResponse);
    }

    // Default to kid role, parent verification done separately via POST
    return successResponse({
      authenticated: true,
      role: "kid",
      sessionId: credentialsResult.credentials.sessionId,
    } as VerifyResponse);
  } catch (error) {
    return createErrorResponse(error, "Verify error");
  }
}

/**
 * Verify Parent Access
 * POST /api/auth/verify
 * Body: { code: string }
 * Returns: { isParent: boolean }
 */
interface ParentVerifyRequest {
  code: string;
}

interface ParentVerifyResponse {
  isParent: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ParentVerifyRequest;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("nissekomm-session")?.value;

    if (!sessionId || !body.code) {
      return successResponse({ isParent: false } as ParentVerifyResponse);
    }

    const code = body.code.trim().toUpperCase();

    // Verify that provided code matches parent code for this session
    const credentialsResult = await requireCredentials(sessionId);
    if ("error" in credentialsResult) {
      return successResponse({ isParent: false } as ParentVerifyResponse);
    }

    const { credentials } = credentialsResult;
    const isParent = credentials.parentCode === code;

    return successResponse({ isParent } as ParentVerifyResponse);
  } catch (error) {
    return createErrorResponse(error, "Parent verify error");
  }
}
