type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

// In development: log email to console
// In production: replace with a real provider (e.g. Resend, Postmark, SES)
export async function sendMail({ to, subject, html }: SendMailOptions) {
  if (process.env.NODE_ENV === "production" && process.env.RESEND_API_KEY) {
    // Production: send via Resend (or any provider)
    // This is a placeholder — swap in your provider's SDK here
    throw new Error(
      "Production mail sending not configured. Add RESEND_API_KEY and implement."
    );
  }

  // Development: log to console
  console.log("\n========================================");
  console.log("DEV EMAIL");
  console.log("========================================");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("----------------------------------------");
  console.log(html.replace(/<[^>]*>/g, "")); // Strip HTML for readability
  console.log("========================================\n");
}

export function buildPasswordResetEmail(
  userName: string,
  resetUrl: string
): { subject: string; html: string } {
  const subject = "Wachtwoord herstellen — Orvelterhof Beheer";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #171717;">Wachtwoord herstellen</h2>
      <p>Hallo ${userName},</p>
      <p>Je hebt een verzoek ingediend om je wachtwoord te herstellen voor Orvelterhof Beheer.</p>
      <p>Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background-color: #171717; color: #ffffff; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; font-weight: 500;">
          Nieuw wachtwoord instellen
        </a>
      </p>
      <p style="color: #737373; font-size: 14px;">
        Deze link is 1 uur geldig. Als je geen wachtwoord reset hebt aangevraagd,
        kun je deze e-mail negeren.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="color: #a3a3a3; font-size: 12px;">Orvelterhof Beheer</p>
    </div>
  `.trim();

  return { subject, html };
}
