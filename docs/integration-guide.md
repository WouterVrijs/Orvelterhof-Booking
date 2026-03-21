# Integratiegids: Marketing website ↔ Boekingssysteem

> Handleiding voor het koppelen van de Orvelterhof marketing website aan het boekingssysteem (SaaS).

---

## Overzicht

Het boekingssysteem biedt twee API endpoints die de marketing website gebruikt:

| Endpoint | Methode | Doel |
|---|---|---|
| `/api/bookings` | GET | Beschikbaarheid ophalen (kalenderdata) |
| `/api/bookings` | POST | Boekingsaanvraag insturen |

Alle requests worden geauthenticeerd met een API key via een Bearer token.

---

## Authenticatie

Elke API request moet een `Authorization` header bevatten:

```
Authorization: Bearer {BOOKING_API_KEY}
```

De API key is geconfigureerd als environment variable op zowel het boekingssysteem als de marketing website. Zonder geldige key retourneert de API `401 Unauthorized`.

> **Belangrijk:** Stuur de API key nooit vanuit de browser. Gebruik altijd een server action of API route op de marketing website als proxy.

---

## Environment variables (marketing website)

Voeg toe aan de `.env` van de marketing website:

```bash
BOOKING_API_URL=https://<jouw-saas-domein>/api/bookings
BOOKING_API_KEY=<dezelfde-key-als-in-het-boekingssysteem>
```

Op Vercel: stel deze in onder **Settings > Environment Variables**.

---

## Endpoint 1: Beschikbaarheid ophalen

### Request

```
GET /api/bookings?from=2026-08-01&to=2026-08-31
Authorization: Bearer {API_KEY}
```

| Parameter | Type | Verplicht | Beschrijving |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | Ja | Startdatum van het bereik |
| `to` | `YYYY-MM-DD` | Ja | Einddatum van het bereik |

### Response (200 OK)

```json
{
  "bookings": [
    {
      "id": "uuid",
      "startDate": "2026-08-10",
      "endDate": "2026-08-15",
      "status": "confirmed"
    },
    {
      "id": "uuid",
      "startDate": "2026-08-20",
      "endDate": "2026-08-25",
      "status": "blocked"
    }
  ]
}
```

- `status: "confirmed"` — bevestigde reservering (niet beschikbaar)
- `status: "blocked"` — geblokkeerde periode (niet beschikbaar)
- Periodes die niet in de response staan zijn **beschikbaar**

### Foutresponses

| Status | Betekenis |
|---|---|
| 400 | `from` of `to` parameter ontbreekt |
| 401 | Ongeldige of ontbrekende API key |
| 500 | Server error |

### Implementatievoorbeeld (Next.js server action)

```ts
"use server";

export async function getAvailability(from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(
    `${process.env.BOOKING_API_URL}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.BOOKING_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Availability check failed: ${res.status}`);

  return res.json();
}
```

---

## Endpoint 2: Boekingsaanvraag insturen

### Request

```
POST /api/bookings
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

### Request body

```json
{
  "firstName": "Jan",
  "lastName": "de Vries",
  "email": "jan@example.nl",
  "phone": "+31612345678",
  "arrivalDate": "2026-08-15",
  "departureDate": "2026-08-22",
  "numberOfGuests": 8,
  "guestNote": "We nemen een hond mee"
}
```

| Veld | Type | Verplicht | Beschrijving |
|---|---|---|---|
| `firstName` | string | Ja | Voornaam gast |
| `lastName` | string | Ja | Achternaam gast |
| `email` | string | Ja | E-mailadres (geldig formaat) |
| `phone` | string | Nee | Telefoonnummer |
| `arrivalDate` | string | Ja | Aankomstdatum (`YYYY-MM-DD`) |
| `departureDate` | string | Ja | Vertrekdatum (`YYYY-MM-DD`, na aankomst) |
| `numberOfGuests` | integer | Ja | Aantal gasten (minimaal 1) |
| `guestNote` | string | Nee | Opmerking van de gast |

### Response (201 Created)

```json
{
  "message": "Booking request received",
  "reservationId": "cfeb2cfd-0c67-479a-ba2e-dd19a6c4a2d8",
  "reservationNumber": "ORV-20260815-S6AD"
}
```

### Foutresponses

| Status | Betekenis | Response |
|---|---|---|
| 400 | Validatiefout | `{ "error": "Validation failed", "details": { "email": ["Invalid email"] } }` |
| 401 | Ongeldige API key | `{ "error": "Unauthorized" }` |
| 409 | Datums niet beschikbaar | `{ "error": "Er is al een bevestigde reservering in deze periode." }` |
| 500 | Server error | `{ "error": "Internal server error" }` |

### Implementatievoorbeeld (Next.js server action)

```ts
"use server";

export type BookingState = {
  success: boolean;
  reservationNumber?: string;
  error?: string;
  details?: Record<string, string[]>;
} | null;

export async function submitBooking(
  _prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  const res = await fetch(process.env.BOOKING_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.BOOKING_API_KEY}`,
    },
    body: JSON.stringify({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      arrivalDate: formData.get("arrivalDate"),
      departureDate: formData.get("departureDate"),
      numberOfGuests: Number(formData.get("numberOfGuests")),
      guestNote: formData.get("guestNote") || undefined,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: data.error,
      details: data.details,
    };
  }

  return {
    success: true,
    reservationNumber: data.reservationNumber,
  };
}
```

---

## Wat gebeurt er na een boekingsaanvraag?

Wanneer de marketing website een boekingsaanvraag instuurt via `POST /api/bookings`:

1. **Validatie** — Alle velden worden server-side gevalideerd
2. **Beschikbaarheidscheck** — Controle op overlap met bevestigde reserveringen en geblokkeerde periodes
3. **Reservering aangemaakt** — Status "Nieuw", bron "Website", reserveringsnummer toegewezen
4. **Prijs berekend** — Automatisch op basis van de geconfigureerde prijsinstellingen
5. **E-mail naar gast** — Bevestiging van ontvangst met reserveringsdetails
6. **E-mail naar beheerder** — Notificatie met gastgegevens en link naar de reservering
7. **Audit log** — Actie wordt gelogd in het systeem

De beheerder kan vervolgens in het dashboard de reservering bekijken, bevestigen of annuleren.

---

## Deployment checklist

### Boekingssysteem (SaaS)

- [ ] Deploy naar Vercel
- [ ] `DATABASE_URL` instellen (Neon/Supabase PostgreSQL)
- [ ] `AUTH_SECRET` instellen (genereer met `openssl rand -base64 32`)
- [ ] `BOOKING_API_KEY` instellen (genereer met `openssl rand -base64 32`)
- [ ] Database schema pushen: `DATABASE_URL="..." npx drizzle-kit push`
- [ ] Seed data laden: `DATABASE_URL="..." npx tsx scripts/seed.ts`
- [ ] Testen: inloggen op de SaaS met `admin@orvelterhof.nl` / `admin123`

### Marketing website

- [ ] `BOOKING_API_URL` instellen (bijv. `https://booking.orvelterhof.nl/api/bookings`)
- [ ] `BOOKING_API_KEY` instellen (dezelfde key als in het boekingssysteem)
- [ ] Server action implementeren voor beschikbaarheidscheck
- [ ] Server action implementeren voor boekingsaanvraag
- [ ] Deploy naar Vercel
- [ ] Testen: boekingsformulier invullen → reservering verschijnt in de SaaS

---

## Veelgestelde vragen

**Moet ik CORS configureren?**
Nee. De marketing website gebruikt server actions die server-to-server communiceren. Er is geen browser-naar-SaaS verkeer.

**Kan ik de API key roteren?**
Ja. Wijzig `BOOKING_API_KEY` op beide Vercel projecten tegelijk en redeploy beiden.

**Hoe test ik lokaal?**
Start het boekingssysteem op `localhost:3005` en stel `BOOKING_API_URL=http://localhost:3005/api/bookings` in op de marketing website. Of gebruik de Vercel URL als het boekingssysteem al gedeployed is.

**Worden e-mails verstuurd in development?**
In development worden e-mails naar de console gelogd. Voor productie: configureer een e-mailprovider (bijv. Resend) in het boekingssysteem.
