/**
 * API Route: /api/unsubscribe
 *
 * One-click email unsubscribe endpoint (no authentication required).
 * Uses signed token to verify unsubscribe requests.
 *
 * GET: Unsubscribe user via token parameter
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import crypto from "crypto";

const STORAGE_BACKEND =
  process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";
const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET ||
  "nissekomm-unsubscribe-secret-change-in-production";

/**
 * Generate unsubscribe token for a session
 * Token = HMAC(sessionId, secret)
 */
export function generateUnsubscribeToken(sessionId: string): string {
  const hmac = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET);
  hmac.update(sessionId);
  return hmac.digest("hex");
}

/**
 * Verify unsubscribe token matches sessionId
 */
function verifyUnsubscribeToken(sessionId: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(sessionId);
  return crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expectedToken, "hex"),
  );
}

/**
 * GET /api/unsubscribe?session={sessionId}&token={token}
 * Unsubscribe user from email notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session");
    const token = searchParams.get("token");

    if (!sessionId || !token) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ugyldig lenke - NisseKomm</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #000;
      color: #00ff00;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 4px solid #ff0000;
      padding: 40px;
      background: #050a05;
    }
    h1 { color: #ff0000; font-size: 28px; margin-bottom: 20px; }
    p { line-height: 1.6; }
    a { color: #00ddff; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ UGYLDIG LENKE</h1>
    <p>Denne avmeldingslenken er ikke gyldig.</p>
    <p>For å administrere e-postinnstillinger, logg inn på <a href="https://nissekomm.no/nissemor-guide/innstillinger">Nissemor-guiden</a>.</p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // Verify token
    if (!verifyUnsubscribeToken(sessionId, token)) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ugyldig token - NisseKomm</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #000;
      color: #00ff00;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 4px solid #ff0000;
      padding: 40px;
      background: #050a05;
    }
    h1 { color: #ff0000; font-size: 28px; margin-bottom: 20px; }
    p { line-height: 1.6; }
    a { color: #00ddff; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ UGYLDIG TOKEN</h1>
    <p>Sikkerhetstokenet er ikke gyldig. Denne lenken kan være utdatert eller manipulert.</p>
    <p>For å administrere e-postinnstillinger, logg inn på <a href="https://nissekomm.no/nissemor-guide/innstillinger">Nissemor-guiden</a>.</p>
  </div>
</body>
</html>
        `,
        {
          status: 403,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // localStorage mode: No backend storage
    if (STORAGE_BACKEND === "localStorage") {
      return new NextResponse(
        `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ikke tilgjengelig - NisseKomm</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #000;
      color: #00ff00;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 4px solid #ffa500;
      padding: 40px;
      background: #050a05;
    }
    h1 { color: #ffa500; font-size: 28px; margin-bottom: 20px; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ IKKE TILGJENGELIG</h1>
    <p>E-postabonnement krever Sanity backend.</p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // Sanity mode: Update subscription
    const credential = await sanityServerClient.fetch(
      `*[_type == "familyCredentials" && sessionId == $sessionId][0]{
        _id,
        familyName,
        emailSubscription
      }`,
      { sessionId },
    );

    if (!credential) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ikke funnet - NisseKomm</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #000;
      color: #00ff00;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 4px solid #ff0000;
      padding: 40px;
      background: #050a05;
    }
    h1 { color: #ff0000; font-size: 28px; margin-bottom: 20px; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ FAMILIE IKKE FUNNET</h1>
    <p>Kunne ikke finne familieregistrering.</p>
  </div>
</body>
</html>
        `,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // Check if already unsubscribed
    if (credential.emailSubscription === false) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Allerede avmeldt - NisseKomm</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #000;
      color: #00ff00;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 4px solid #00ff00;
      padding: 40px;
      background: #050a05;
    }
    h1 { color: #ffd700; font-size: 28px; margin-bottom: 20px; }
    p { line-height: 1.6; }
    a { color: #00ddff; text-decoration: underline; }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 15px 30px;
      background: #00ff00;
      color: #000;
      text-decoration: none;
      border: 2px solid #00aa00;
      font-weight: bold;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ ALLEREDE AVMELDT</h1>
    <p>Du er allerede avmeldt fra e-postpåminnelser.</p>
    <p>Du vil ikke motta flere daglige oppdragsmeldinger fra Rampenissen.</p>
    <a href="https://nissekomm.no/nissemor-guide/innstillinger" class="button">GÅ TIL INNSTILLINGER</a>
  </div>
</body>
</html>
        `,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // Unsubscribe user
    await sanityServerClient
      .patch(credential._id)
      .set({ emailSubscription: false })
      .commit();

    console.log(
      `[Unsubscribe] Family "${credential.familyName}" unsubscribed via email link`,
    );

    // Success page
    return new NextResponse(
      `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Avmeldt - NisseKomm</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #000;
      color: #00ff00;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 4px solid #ffd700;
      padding: 40px;
      background: #050a05;
    }
    h1 { color: #ffd700; font-size: 28px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
    p { line-height: 1.6; margin-bottom: 15px; }
    a { color: #00ddff; text-decoration: underline; }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 15px 30px;
      background: #00ff00;
      color: #000;
      text-decoration: none;
      border: 2px solid #00aa00;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .button:hover {
      background: #00dd00;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ AVMELDT!</h1>
    <p>Du er nå avmeldt fra e-postpåminnelser fra NisseKomm.</p>
    <p>Du vil ikke motta flere daglige oppdragsmeldinger fra Rampenissen.</p>
    <p style="margin-top: 30px; font-size: 14px; color: #00aa00;">
      Ønsker du å melde deg på igjen? Logg inn på Nissemor-guiden og aktiver abonnementet i innstillingene.
    </p>
    <a href="https://nissekomm.no/nissemor-guide/innstillinger" class="button">GÅ TIL INNSTILLINGER</a>
  </div>
</body>
</html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    return new NextResponse(
      `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feil - NisseKomm</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #000;
      color: #00ff00;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 4px solid #ff0000;
      padding: 40px;
      background: #050a05;
    }
    h1 { color: #ff0000; font-size: 28px; margin-bottom: 20px; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ SERVERFEIL</h1>
    <p>Noe gikk galt. Prøv igjen senere.</p>
  </div>
</body>
</html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}
