/**
 * API Route: /api/settings/email-subscription
 *
 * Manage email subscription for daily mission reminders.
 * Requires valid session ID from cookie.
 *
 * GET: Check current subscription status
 * POST: Update subscription status (subscribe/unsubscribe)
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";

const STORAGE_BACKEND =
  process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";

/**
 * GET /api/settings/email-subscription
 * Returns current email subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("nissekomm-session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Ikke autentisert. Logg inn først." },
        { status: 401 },
      );
    }

    // localStorage mode: No backend storage available
    if (STORAGE_BACKEND === "localStorage") {
      return NextResponse.json(
        {
          error: "E-postabonnement er kun tilgjengelig med Sanity backend.",
          subscribed: false,
        },
        { status: 400 },
      );
    }

    // Sanity mode: Fetch subscription status
    const credentials = await sanityServerClient.fetch(
      `*[_type == "familyCredentials" && sessionId == $sessionId][0]{
        emailSubscription,
        parentEmail
      }`,
      { sessionId },
    );

    if (!credentials) {
      return NextResponse.json(
        { error: "Session ikke funnet." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      subscribed: credentials.emailSubscription ?? true, // Default to true
      email: credentials.parentEmail,
    });
  } catch (error) {
    console.error("[Email Subscription API] GET error:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente abonnementsstatus." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/settings/email-subscription
 * Update email subscription status
 * Body: { subscribed: boolean }
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

    // localStorage mode: No backend storage available
    if (STORAGE_BACKEND === "localStorage") {
      return NextResponse.json(
        { error: "E-postabonnement er kun tilgjengelig med Sanity backend." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as { subscribed: boolean };

    if (typeof body.subscribed !== "boolean") {
      return NextResponse.json(
        {
          error: "Ugyldig forespørsel. 'subscribed' må være true eller false.",
        },
        { status: 400 },
      );
    }

    // Sanity mode: Update subscription status

    // Find the credential document
    const credential = await sanityServerClient.fetch(
      `*[_type == "familyCredentials" && sessionId == $sessionId][0]{ _id }`,
      { sessionId },
    );

    if (!credential) {
      return NextResponse.json(
        { error: "Session ikke funnet." },
        { status: 404 },
      );
    }

    // Update subscription status
    await sanityServerClient
      .patch(credential._id)
      .set({ emailSubscription: body.subscribed })
      .commit();

    console.log(
      `[Email Subscription API] Updated subscription for session ${sessionId.substring(0, 8)}... to ${body.subscribed}`,
    );

    return NextResponse.json({
      success: true,
      subscribed: body.subscribed,
      message: body.subscribed
        ? "Abonnement aktivert! Du vil motta daglige påminnelser kl. 21:00."
        : "Abonnement avsluttet. Du vil ikke motta flere e-poster.",
    });
  } catch (error) {
    console.error("[Email Subscription API] POST error:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere abonnement." },
      { status: 500 },
    );
  }
}
