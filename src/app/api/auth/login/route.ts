/**
 * Family Login API Endpoint
 *
 * Accepts either kidCode or parentCode and returns sessionId + role.
 * Used by both kids (daily login) and parents (guide access).
 *
 * Sets session cookie on successful login for server-side auth.
 *
 * POST /api/auth/login
 * Body: { code: string }
 * Returns: { sessionId: string, role: 'kid' | 'parent' }
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import { getCodeType } from "@/lib/code-generator";
import {
  errorResponse,
  createErrorResponse,
  setSessionCookie,
  setParentAuthCookie,
} from "@/lib/api-utils";

interface LoginRequest {
  code: string;
}

interface LoginResponse {
  sessionId: string;
  role: "kid" | "parent";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;

    if (!body.code || typeof body.code !== "string") {
      return errorResponse("Code is required");
    }

    const code = body.code.trim().toUpperCase();

    // Determine code type
    const codeType = getCodeType(code);

    if (codeType === "invalid") {
      return errorResponse("Ugyldig kode", 401);
    }

    const backend = process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";

    // localStorage backend: Accept any valid code format, use code as sessionId
    if (backend === "localStorage") {
      const responseData: LoginResponse = {
        sessionId: code, // Use the code itself as sessionId for localStorage mode
        role: codeType,
      };
      // Set cookies on response - functions mutate and return the response
      const response = NextResponse.json(responseData);
      setSessionCookie(response, code);
      if (codeType === "parent") {
        setParentAuthCookie(response, code);
      }
      return response;
    }

    // Sanity backend: Query database for credentials
    const query =
      codeType === "kid"
        ? `*[_type == "familyCredentials" && kidCode == $code][0]`
        : `*[_type == "familyCredentials" && parentCode == $code][0]`;

    const credentials = await sanityServerClient.fetch<{
      sessionId: string;
      kidCode: string;
      parentCode: string;
    } | null>(query, { code });

    if (!credentials) {
      return errorResponse("Ugyldig kode", 401);
    }

    const responseData: LoginResponse = {
      sessionId: credentials.sessionId,
      role: codeType,
    };

    // Set cookies on response - functions mutate and return the response
    const response = NextResponse.json(responseData);
    setSessionCookie(response, credentials.sessionId);
    if (codeType === "parent") {
      setParentAuthCookie(response, credentials.sessionId);
    }
    return response;
  } catch (error) {
    return createErrorResponse(error, "Innlogging mislyktes");
  }
}
