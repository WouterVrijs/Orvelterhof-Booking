type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@orvelterhof.nl";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

// --- Mail transport ---

// In development: log email to console
// In production: replace with a real provider (e.g. Resend, Postmark, SES)
export async function sendMail({ to, subject, html }: SendMailOptions) {
  if (process.env.NODE_ENV === "production" && process.env.RESEND_API_KEY) {
    // Production: send via Resend (or any provider)
    // Swap in your provider's SDK here
    throw new Error(
      "Production mail sending not configured. Add RESEND_API_KEY and implement."
    );
  }

  // Development: log to console
  console.log("\n========================================");
  console.log("DEV EMAIL");
  console.log("========================================");
  console.log(`From:    ${EMAIL_FROM}`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("----------------------------------------");
  console.log(html.replace(/<[^>]*>/g, "")); // Strip HTML for readability
  console.log("========================================\n");
}

// --- Shared layout ---

function emailLayout(content: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #171717;">
      ${content}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
      <p style="color: #a3a3a3; font-size: 12px;">Orvelterhof Beheer</p>
    </div>
  `.trim();
}

// --- Password reset ---

export function buildPasswordResetEmail(
  userName: string,
  resetUrl: string
): { subject: string; html: string } {
  const subject = "Wachtwoord herstellen — Orvelterhof Beheer";
  const html = emailLayout(`
    <h2>Wachtwoord herstellen</h2>
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
  `);
  return { subject, html };
}

// --- US 13.1: Booking request received (to guest) ---

interface BookingRequestEmailData {
  firstName: string;
  reservationNumber: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
}

export function buildBookingRequestEmail(
  data: BookingRequestEmailData
): { subject: string; html: string } {
  const subject = `Boekingsaanvraag ontvangen — ${data.reservationNumber}`;
  const html = emailLayout(`
    <h2>Bedankt voor uw aanvraag</h2>
    <p>Beste ${data.firstName},</p>
    <p>We hebben uw boekingsaanvraag in goede orde ontvangen. Hieronder vindt u een overzicht:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #737373; width: 140px;">Reserveringsnr.</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.reservationNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Aankomst</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.arrivalDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Vertrek</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.departureDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Aantal gasten</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.numberOfGuests}</td>
      </tr>
    </table>
    <p>We nemen zo snel mogelijk contact met u op om uw aanvraag te bevestigen.</p>
    <p>Met vriendelijke groet,<br/>Het Orvelterhof team</p>
  `);
  return { subject, html };
}

// --- US 13.2: New booking notification (to manager) ---

interface ManagerNotificationData {
  firstName: string;
  lastName: string;
  email: string;
  reservationNumber: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  reservationId: string;
}

export function buildManagerNotificationEmail(
  data: ManagerNotificationData
): { subject: string; html: string } {
  const reservationUrl = `${APP_URL}/reservations/${data.reservationId}`;
  const subject = `Nieuwe boekingsaanvraag: ${data.reservationNumber}`;
  const html = emailLayout(`
    <h2>Nieuwe boekingsaanvraag</h2>
    <p>Er is een nieuwe boekingsaanvraag binnengekomen via de website:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #737373; width: 140px;">Reserveringsnr.</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.reservationNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Gast</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.firstName} ${data.lastName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">E-mail</td>
        <td style="padding: 8px 0;">${data.email}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Aankomst</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.arrivalDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Vertrek</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.departureDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Gasten</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.numberOfGuests}</td>
      </tr>
    </table>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${reservationUrl}"
         style="background-color: #171717; color: #ffffff; padding: 12px 24px;
                border-radius: 6px; text-decoration: none; font-weight: 500;">
        Bekijk reservering
      </a>
    </p>
  `);
  return { subject, html };
}

// --- US 13.3: Reservation confirmed (to guest) ---

interface ConfirmationEmailData {
  firstName: string;
  reservationNumber: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
}

export function buildConfirmationEmail(
  data: ConfirmationEmailData
): { subject: string; html: string } {
  const subject = `Reservering bevestigd — ${data.reservationNumber}`;
  const html = emailLayout(`
    <h2>Uw reservering is bevestigd</h2>
    <p>Beste ${data.firstName},</p>
    <p>Goed nieuws! Uw reservering bij Orvelterhof is bevestigd.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #737373; width: 140px;">Reserveringsnr.</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.reservationNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Aankomst</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.arrivalDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Vertrek</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.departureDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Aantal gasten</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.numberOfGuests}</td>
      </tr>
    </table>
    <p>We kijken ernaar uit u te verwelkomen!</p>
    <p>Met vriendelijke groet,<br/>Het Orvelterhof team</p>
  `);
  return { subject, html };
}

// --- US 13.4: Reservation cancelled (to guest) ---

interface CancellationEmailData {
  firstName: string;
  reservationNumber: string;
  arrivalDate: string;
  departureDate: string;
}

export function buildCancellationEmail(
  data: CancellationEmailData
): { subject: string; html: string } {
  const subject = `Reservering geannuleerd — ${data.reservationNumber}`;
  const html = emailLayout(`
    <h2>Reservering geannuleerd</h2>
    <p>Beste ${data.firstName},</p>
    <p>Uw reservering bij Orvelterhof is geannuleerd.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #737373; width: 140px;">Reserveringsnr.</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.reservationNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Aankomst</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.arrivalDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #737373;">Vertrek</td>
        <td style="padding: 8px 0; font-weight: 500;">${data.departureDate}</td>
      </tr>
    </table>
    <p>Heeft u vragen? Neem gerust contact met ons op.</p>
    <p>Met vriendelijke groet,<br/>Het Orvelterhof team</p>
  `);
  return { subject, html };
}
