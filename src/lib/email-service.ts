/**
 * Email Service for NisseKomm
 *
 * Sends CRT-themed welcome emails with family access codes via Resend.
 * Used during registration and password recovery.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Rampenissen <rampenissen@nissekomm.no>";
const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://nissekomm.no";

interface WelcomeEmailParams {
  to: string;
  familyName?: string;
  kidCode: string;
  parentCode: string;
  kidNames: string[];
}

/**
 * Generate CRT-themed HTML email matching NisseKomm's retro terminal aesthetic
 */
function createWelcomeEmailHtml({
  familyName,
  kidCode,
  parentCode,
  kidNames,
}: Omit<WelcomeEmailParams, "to">): string {
  const familyGreeting = familyName
    ? `Familien ${familyName}`
    : "Kjære familie";
  const kidNamesFormatted = kidNames.join(", ");

  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Velkommen til NisseKomm</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: 'Courier New', Courier, monospace !important;}
  </style>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: #000000 !important; }
      .dark-bezel { background-color: #1a1a1a !important; }
      .dark-screen { background-color: #050a05 !important; }
      .dark-green-box { background-color: #1a3a1a !important; }
      .dark-blue-box { background-color: #1a2a3a !important; }
      .green-text { color: #00ff00 !important; }
      .gold-text { color: #ffd700 !important; }
      .cyan-text { color: #00ddff !important; }
    }
  </style>
</head>
<body class="dark-bg" style="margin: 0; padding: 0; background-color: #000000; font-family: 'Courier New', Courier, monospace;">
  <!-- Dark wrapper for email clients -->
  <div class="dark-bg" style="background-color: #000000; width: 100%; margin: 0; padding: 0;">
  <table role="presentation" class="dark-bg" style="width: 100%; border-collapse: collapse; background-color: #000000;" bgcolor="#000000">
    <tr>
      <td align="center" class="dark-bg" style="padding: 40px 20px; background-color: #000000;" bgcolor="#000000">
        <!-- CRT Monitor Frame -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Outer bezel -->
          <tr>
            <td class="dark-bezel" style="background-color: #1a1a1a; border-radius: 20px; padding: 20px;" bgcolor="#1a1a1a">
              <!-- Inner screen with scanline effect -->
              <table role="presentation" class="dark-screen" style="width: 100%; border-collapse: collapse; background-color: #050a05; border: 4px solid #00ff00;" bgcolor="#050a05">
                <tr>
                  <td class="dark-screen" style="padding: 30px; background-color: #050a05;" bgcolor="#050a05">
                    <!-- Header -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <tr>
                        <td style="border-bottom: 2px solid #00ff00; padding-bottom: 15px;">
                          <h1 style="margin: 0; color: #00ff00; font-size: 28px; font-weight: normal; text-transform: uppercase; letter-spacing: 2px;">
                            ⚡ NISSEKOMM ⚡
                          </h1>
                          <p style="margin: 5px 0 0 0; color: #00aa00; font-size: 14px;">
                            &gt; SNØFALL OPERASJONS-SENTER
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Welcome message -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                      <tr>
                        <td style="color: #00ff00; font-size: 16px; line-height: 1.6;">
                          <p style="margin: 0 0 15px 0;">
                            &gt; INNKOMMENDE MELDING FRA NORDPOLEN_
                          </p>
                          <p style="margin: 0 0 15px 0; color: #00dd00;">
                            Hei ${familyGreeting}!
                          </p>
                          <p style="margin: 0 0 15px 0; color: #00dd00;">
                            Dette er Rampenissen! Jeg har fått beskjed fra Julius (ja, SELVESTE julenissen!) om at ${kidNamesFormatted} skal hjelpe meg med hemmelige oppdrag i desember!
                          </p>
                          <p style="margin: 0; color: #00dd00;">
                            Her er kodene dere trenger for å koble til NisseKomm - vårt superhemmelige kommunikasjonssystem:
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Kid Code Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                      <tr>
                        <td>
                          <table role="presentation" class="dark-green-box" width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#1a3a1a" style="border: 2px solid #00ff00; background: #1a3a1a; background-color: #1a3a1a;">
                            <tr>
                              <td class="dark-green-box" bgcolor="#1a3a1a" style="background: #1a3a1a; background-color: #1a3a1a;">
                                <p style="margin: 0 0 10px 0; color: #00ff00; font-size: 14px; text-transform: uppercase;">
                                  🎄 BARNEKODE (for ${kidNamesFormatted}):
                                </p>
                                <p style="margin: 0; color: #ffd700; font-size: 28px; font-weight: bold; letter-spacing: 3px; text-align: center; padding: 10px 0;">
                                  ${kidCode}
                                </p>
                                <p style="margin: 10px 0 0 0; color: #00aa00; font-size: 12px;">
                                  &gt; Bruk denne koden for å starte NisseKomm hver dag!
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Parent Code Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                      <tr>
                        <td>
                          <table role="presentation" class="dark-blue-box" width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#1a2a3a" style="border: 2px solid #00ddff; background: #1a2a3a; background-color: #1a2a3a;">
                            <tr>
                              <td class="dark-blue-box" bgcolor="#1a2a3a" style="background: #1a2a3a; background-color: #1a2a3a;">
                                <p style="margin: 0 0 10px 0; color: #00ddff; font-size: 14px; text-transform: uppercase;">
                                  🔐 FORELDREKODE (kun for voksne):
                                </p>
                                <p style="margin: 0; color: #ffd700; font-size: 22px; font-weight: bold; letter-spacing: 2px; text-align: center; padding: 10px 0;">
                                  ${parentCode}
                                </p>
                                <p style="margin: 10px 0 0 0; color: #00aadd; font-size: 12px;">
                                  &gt; Gir tilgang til <a href="${BASE_URL}/nissemor-guide" style="color: #00ddff;">Nissemor sin Foreldreveiledning</a> med fasit og tips!
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Instructions -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                      <tr>
                        <td style="color: #00ff00; font-size: 14px; line-height: 1.8;">
                          <p style="margin: 0 0 10px 0; color: #00ff00; text-transform: uppercase;">
                            &gt; INSTRUKSJONER:
                          </p>
                          <p style="margin: 0 0 8px 0; color: #00dd00; padding-left: 15px;">
                            1. Gå til <a href="${BASE_URL}" style="color: #ffd700; text-decoration: underline;">${BASE_URL.replace(/^https?:\/\//, "")}</a>
                          </p>
                          <p style="margin: 0 0 8px 0; color: #00dd00; padding-left: 15px;">
                            2. Skriv inn BARNEKODEN for å starte
                          </p>
                          <p style="margin: 0 0 8px 0; color: #00dd00; padding-left: 15px;">
                            3. Les dagens e-post fra meg (Rampenissen!)
                          </p>
                          <p style="margin: 0; color: #00dd00; padding-left: 15px;">
                            4. Løs gåten og skriv inn svarkoden
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                      <tr>
                        <td align="center">
                          <a href="${BASE_URL}" style="display: inline-block; background-color: #00ff00; color: #000000; font-size: 18px; font-weight: bold; text-decoration: none; padding: 15px 40px; border: 3px solid #00aa00; text-transform: uppercase; letter-spacing: 2px;">
                            ▶ START NISSEKOMM
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Footer message -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; border-top: 2px solid #00ff00; padding-top: 15px;">
                      <tr>
                        <td style="padding-top: 15px;">
                          <p style="margin: 0 0 10px 0; color: #00dd00; font-size: 14px;">
                            Ta vare på disse kodene - dere trenger dem hver dag i desember!
                          </p>
                          <p style="margin: 0; color: #00ff00; font-size: 14px;">
                            🎅 Hilsen Rampenissen
                          </p>
                          <p style="margin: 10px 0 0 0; color: #666666; font-size: 12px;">
                            &gt; MELDING KRYPTERT MED NISSEKRYPTO v2.4_
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Power LED -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td align="right" style="padding-right: 10px;">
                    <span style="display: inline-block; width: 10px; height: 10px; background-color: #00ff00; border-radius: 50%; box-shadow: 0 0 10px #00ff00;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </div>
</body>
</html>
`;
}

/**
 * Generate plain text version of welcome email
 */
function createWelcomeEmailText({
  familyName,
  kidCode,
  parentCode,
  kidNames,
}: Omit<WelcomeEmailParams, "to">): string {
  const familyGreeting = familyName
    ? `Familien ${familyName}`
    : "Kjære familie";
  const kidNamesFormatted = kidNames.join(", ");

  return `
═══════════════════════════════════════
⚡ NISSEKOMM - SNØFALL OPERASJONS-SENTER ⚡
═══════════════════════════════════════

> INNKOMMENDE MELDING FRA NORDPOLEN

Hei ${familyGreeting}!

Dette er Rampenissen! Jeg har fått beskjed fra Julius
(ja, SELVESTE julenissen!) om at ${kidNamesFormatted}
skal hjelpe meg med hemmelige oppdrag i desember!

Her er kodene dere trenger:

───────────────────────────────────────
🎄 BARNEKODE (for ${kidNamesFormatted}):

    ${kidCode}

> Bruk denne koden for å starte NisseKomm hver dag!
───────────────────────────────────────

───────────────────────────────────────
🔐 FORELDREKODE (kun for voksne):

    ${parentCode}

> Gir tilgang til Foreldreveiledning med fasit og tips!
───────────────────────────────────────

> INSTRUKSJONER:
  1. Gå til ${BASE_URL}
  2. Skriv inn BARNEKODEN for å starte
  3. Les dagens e-post fra meg (Rampenissen!)
  4. Løs gåten og skriv inn svarkoden

Ta vare på disse kodene - dere trenger dem hver dag i desember!

🎅 Hilsen Rampenissen

───────────────────────────────────────
> MELDING KRYPTERT MED NISSEKRYPTO v2.4
═══════════════════════════════════════
`;
}

/**
 * Send welcome email with family access codes
 *
 * @returns true if email sent successfully, false otherwise
 */
export async function sendWelcomeEmail(
  params: WelcomeEmailParams,
): Promise<boolean> {
  try {
    const { to, ...contentParams } = params;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🎄 Velkommen til NisseKomm - Dine hemmelige koder!",
      html: createWelcomeEmailHtml(contentParams),
      text: createWelcomeEmailText(contentParams),
    });

    if (error) {
      console.error("[Email Service] Failed to send welcome email:", error);
      return false;
    }

    console.log(`[Email Service] Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[Email Service] Error sending welcome email:", error);
    return false;
  }
}
