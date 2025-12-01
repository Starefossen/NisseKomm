/**
 * Family Login API Endpoint
 *
 * Accepts either kidCode or parentCode and returns sessionId + role.
 * Used by both kids (daily login) and parents (guide access).
 *
 * POST /api/auth/login
 * Body: { code: string }
 * Returns: { sessionId: string, role: 'kid' | 'parent' }
 */

import { NextRequest } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import { getCodeType } from "@/lib/code-generator";
import {
  errorResponse,
  createErrorResponse,
  successResponse,
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
      const response: LoginResponse = {
        sessionId: code, // Use the code itself as sessionId for localStorage mode
        role: codeType,
      };
      return successResponse(response);
    }

    // Sanity backend: Query database for credentials
    console.log("[Login] Backend:", backend, "CodeType:", codeType);
    console.log(
      "[Login] Sanity config:",
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ? "✓" : "✗",
      "project,",
      process.env.SANITY_API_TOKEN ? "✓" : "✗",
      "token",
    );

    const query =
      codeType === "kid"
        ? `*[_type == "familyCredentials" && kidCode == $code][0]`
        : `*[_type == "familyCredentials" && parentCode == $code][0]`;

    console.log("[Login] Query:", query);

    const credentials = await sanityServerClient.fetch<{
      sessionId: string;
      kidCode: string;
      parentCode: string;
    } | null>(query, { code });

    console.log("[Login] Credentials found:", !!credentials);

    if (!credentials) {
      return errorResponse("Ugyldig kode", 401);
    }

    const response: LoginResponse = {
      sessionId: credentials.sessionId,
      role: codeType,
    };

    return successResponse(response);
  } catch (error) {
    console.error("[Login] Error:", error);
    return createErrorResponse(error, "Innlogging mislyktes");
  }
}
