/**
 * API Route: /api/settings/delete-account
 *
 * Permanently delete family account and all associated data.
 * Requires valid session ID from cookie.
 *
 * This is a destructive operation that cannot be undone.
 * Deletes both familyCredentials and userSession documents.
 *
 * POST: Delete account (requires confirmation)
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";

const STORAGE_BACKEND =
  process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";

/**
 * POST /api/settings/delete-account
 * Permanently delete family account
 * Body: { confirm: string } - must be "SLETT" to confirm
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("nissekomm-session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Ikke autentisert. Logg inn først." },
        { status: 401 },
      );
    }

    // localStorage mode: Just clear cookies (data is client-side)
    if (STORAGE_BACKEND === "localStorage") {
      const response = NextResponse.json({
        success: true,
        message:
          "Kontoen er slettet. All data i nettleseren vil bli fjernet når du logger ut.",
      });

      // Clear session cookie
      response.cookies.set("nissekomm-session", "", {
        maxAge: 0,
        path: "/",
      });

      // Clear parent auth cookie if exists
      response.cookies.set("nissekomm-parent-auth", "", {
        maxAge: 0,
        path: "/",
      });

      return response;
    }

    const body = (await request.json()) as { confirm: string };

    // Require explicit confirmation
    if (body.confirm !== "SLETT") {
      return NextResponse.json(
        { error: "Bekreftelse kreves. Skriv 'SLETT' for å bekrefte." },
        { status: 400 },
      );
    }

    // Sanity mode: Delete all documents for this session

    // Find credential document
    const credential = await sanityServerClient.fetch(
      `*[_type == "familyCredentials" && sessionId == $sessionId][0]{
        _id,
        familyName,
        kidCode
      }`,
      { sessionId },
    );

    if (!credential) {
      return NextResponse.json(
        { error: "Session ikke funnet." },
        { status: 404 },
      );
    }

    // Find session document
    const session = await sanityServerClient.fetch(
      `*[_type == "userSession" && sessionId == $sessionId][0]{ _id }`,
      { sessionId },
    );

    console.log(
      `[Delete Account API] Deleting account for family: ${credential.familyName} (kidCode: ${credential.kidCode})`,
    );

    // Delete both documents in a transaction
    const transaction = sanityServerClient.transaction();

    if (credential._id) {
      transaction.delete(credential._id);
    }

    if (session?._id) {
      transaction.delete(session._id);
    }

    await transaction.commit();

    console.log(
      `[Delete Account API] Successfully deleted account for session ${sessionId.substring(0, 8)}...`,
    );

    // Create response with cleared cookies
    const response = NextResponse.json({
      success: true,
      message: "Kontoen er permanent slettet. All data er fjernet.",
    });

    // Clear session cookie
    response.cookies.set("nissekomm-session", "", {
      maxAge: 0,
      path: "/",
    });

    // Clear parent auth cookie if exists
    response.cookies.set("nissekomm-parent-auth", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Delete Account API] Error:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette kontoen. Prøv igjen senere." },
      { status: 500 },
    );
  }
}
