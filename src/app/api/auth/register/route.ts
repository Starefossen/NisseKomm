/**
 * Family Registration API Endpoint
 *
 * Creates new family credentials with dual codes (kid + parent) and linked session.
 * Parent-only endpoint - not linked from kid UI.
 *
 * POST /api/auth/register
 * Body: { familyName?, kidNames: string[], friendNames: string[], parentEmail? }
 * Returns: { kidCode, parentCode, sessionId }
 */

import { NextRequest } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import { generateKidCode, generateParentCode } from "@/lib/code-generator";
import { v4 as uuidv4 } from "uuid";
import {
  errorResponse,
  createErrorResponse,
  successResponse,
} from "@/lib/api-utils";

interface RegisterRequest {
  familyName?: string;
  kidNames: string[];
  friendNames: string[];
  parentEmail?: string;
  shareKey?: string;
}

interface RegisterResponse {
  kidCode: string;
  parentCode: string;
  sessionId: string;
}

// Validation helpers
function validateKidNames(names: string[]): string[] {
  if (!Array.isArray(names) || names.length === 0 || names.length > 4) {
    throw new Error("Kid names must be an array of 1-4 names");
  }

  const validated = names.map((name) => {
    if (typeof name !== "string") {
      throw new Error("All kid names must be strings");
    }

    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > 20) {
      throw new Error("Each kid name must be 1-20 characters");
    }

    return trimmed;
  });

  // Check for duplicates
  const uniqueNames = new Set(validated.map((n) => n.toLowerCase()));
  if (uniqueNames.size !== validated.length) {
    throw new Error("Kid names must be unique");
  }

  return validated;
}

function validateFriendNames(names: string[]): string[] {
  if (!Array.isArray(names)) {
    throw new Error("Friend names must be an array");
  }

  if (names.length > 15) {
    throw new Error("Maximum 15 friend names allowed");
  }

  const validated = names.map((name) => {
    if (typeof name !== "string") {
      throw new Error("All friend names must be strings");
    }

    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > 20) {
      throw new Error("Each friend name must be 1-20 characters");
    }

    return trimmed;
  });

  // Check for duplicates
  const uniqueNames = new Set(validated.map((n) => n.toLowerCase()));
  if (uniqueNames.size !== validated.length) {
    throw new Error("Friend names must be unique");
  }

  return validated;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequest;

    // Validate share key (basic access control for friend/family distribution)
    const requiredShareKey = process.env.REGISTRATION_SHARE_KEY;
    if (
      requiredShareKey &&
      body.shareKey?.toUpperCase() !== requiredShareKey.toUpperCase()
    ) {
      return errorResponse("Ugyldig registreringsnøkkel", 403);
    }

    // Validate input
    const validatedKidNames = validateKidNames(body.kidNames);
    const validatedFriendNames = validateFriendNames(body.friendNames);

    const familyName = body.familyName?.trim();
    if (familyName && familyName.length > 50) {
      return errorResponse("Family name must be 50 characters or less");
    }

    const parentEmail = body.parentEmail?.trim();
    if (!parentEmail) {
      return errorResponse(
        "Foreldre e-post er påkrevd for kontogjenoppretting",
      );
    }
    if (!parentEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return errorResponse("Ugyldig e-postformat");
    }

    // Fetch existing codes to avoid collisions
    const existingCredentials = await sanityServerClient.fetch<
      Array<{ kidCode: string; parentCode: string }>
    >(`*[_type == "familyCredentials"]{ kidCode, parentCode }`);

    const existingKidCodes = existingCredentials.map((c) => c.kidCode);
    const existingParentCodes = existingCredentials.map((c) => c.parentCode);

    // Generate unique codes
    const kidCode = generateKidCode(undefined, existingKidCodes);
    const parentCode = generateParentCode(existingParentCodes);
    const sessionId = uuidv4();

    // Create familyCredentials document
    await sanityServerClient.create({
      _type: "familyCredentials",
      kidCode,
      parentCode,
      sessionId,
      familyName: familyName || null,
      kidNames: validatedKidNames,
      friendNames: validatedFriendNames,
      parentEmail: parentEmail || null,
      createdAt: new Date().toISOString(),
    });

    // Create linked userSession document
    await sanityServerClient.create({
      _type: "userSession",
      sessionId,
      lastUpdated: new Date().toISOString(),
      authenticated: false, // Client-side only
      soundsEnabled: true,
      musicEnabled: false,
      submittedCodes: [],
      viewedEmails: [],
      viewedBonusOppdragEmails: [],
      bonusOppdragBadges: [],
      eventyrBadges: [],
      earnedBadges: [],
      topicUnlocks: "{}",
      unlockedFiles: [],
      unlockedModules: [],
      collectedSymbols: [],
      solvedDecryptions: [],
      decryptionAttempts: "{}",
      failedAttempts: "{}",
      crisisStatus: { antenna: false, inventory: false },
      santaLetters: [],
      brevfugler: [],
      nissenetLastVisit: 0,
      playerNames: validatedKidNames, // Pre-fill with kid names
      friendNames: validatedFriendNames, // Store friend names
      niceListLastViewed: null,
      dagbokLastRead: 0,
    });

    const response: RegisterResponse = {
      kidCode,
      parentCode,
      sessionId,
    };

    return successResponse(response);
  } catch (error) {
    return createErrorResponse(error, "Registration failed");
  }
}
