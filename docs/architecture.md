# Architectuur: Orvelterhof Booking SaaS

> Technisch overzicht van hoe de applicatie is opgebouwd.

---

## Tech stack

| Laag | Technologie | Versie |
|---|---|---|
| Framework | Next.js (App Router) | 16.1 |
| Taal | TypeScript | 5.9 |
| UI library | React | 19.2 |
| Styling | Tailwind CSS | 4.2 |
| UI componenten | shadcn/ui + Radix UI | — |
| Iconen | Lucide React | 0.577 |
| Database | PostgreSQL | 14+ |
| ORM | Drizzle ORM | 0.45 |
| Validatie | Zod | 4.3 |
| Authenticatie | Custom JWT (jose) | 6.2 |
| Wachtwoord hashing | bcryptjs | 3.0 |
| Datum utilities | date-fns | 4.1 |

---

## Hosting en deployment

| Onderdeel | Platform | Toelichting |
|---|---|---|
| Applicatie | **Vercel** | Automatische deployment bij push naar `main` |
| Database | **Neon** | Serverless PostgreSQL met connection pooling |
| Domein | Vercel | `orvelterhof-booking.vercel.app` (of eigen domein) |

### Vercel environment variables

| Variable | Beschrijving |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing secret |
| `BOOKING_API_KEY` | API key voor de marketing website |

---

## Mappenstructuur

```
src/
├── app/                            Next.js App Router
│   ├── (auth)/                     Auth pagina's (geen sidebar)
│   │   ├── login/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/                Beveiligde pagina's (met sidebar)
│   │   ├── page.tsx                Dashboard
│   │   ├── reservations/
│   │   │   ├── page.tsx            Overzicht
│   │   │   ├── new/                Nieuwe reservering
│   │   │   └── [id]/              Detail + bewerken
│   │   ├── calendar/               Kalender + geblokkeerde periodes
│   │   ├── pricing/                Prijsinstellingen
│   │   └── settings/               Accommodatie-instellingen
│   └── api/
│       └── bookings/               API voor marketing website
│
├── components/
│   ├── ui/                         Basis UI (Button, Card, Input, etc.)
│   ├── layout/                     Header, Sidebar
│   ├── shared/                     PageHeader, EmptyState, StatusBadge
│   ├── auth/                       Login, Logout, Password forms
│   ├── reservations/               Reservation forms, detail, table
│   ├── calendar/                   CalendarView, BlockedPeriods
│   ├── pricing/                    PricingForm
│   └── settings/                   SettingsForm
│
├── lib/
│   ├── db/
│   │   ├── index.ts                Database connectie (postgres.js)
│   │   └── schema.ts              Drizzle schema (alle tabellen)
│   ├── auth.ts                     JWT sessies, login, logout
│   ├── types/index.ts             Enums, status config, labels
│   ├── validations/                Zod schema's per module
│   ├── actions/                    Server actions per module
│   ├── services/                   Business logica
│   └── utils/                      Helpers (dates, format, etc.)
│
├── middleware.ts                    Route protection
│
docs/
├── roadmap.md                      MVP roadmap met epics en user stories
├── integration-guide.md            Koppeling marketing website
└── architecture.md                 Dit document

scripts/
└── seed.ts                         Database seeding (admin user + testdata)
```

---

## Database schema

### Tabellen

**users** — Beheerders van de applicatie
- `id`, `name`, `email`, `passwordHash`, `isActive`, `createdAt`, `updatedAt`

**password_reset_tokens** — Wachtwoord reset tokens
- `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`

**reservations** — Alle reserveringen
- `id`, `reservationNumber`, `firstName`, `lastName`, `email`, `phone`
- `arrivalDate`, `departureDate`, `numberOfGuests`
- `status` (NEW, IN_PROGRESS, CONFIRMED, CANCELLED)
- `totalPrice`, `guestNote`, `internalNote`
- `source` (WEBSITE, MANUAL, PHONE, EMAIL)
- `statusChangedAt`, `createdAt`, `updatedAt`

**blocked_periods** — Geblokkeerde datums
- `id`, `startDate`, `endDate`, `reason`
- `blockType` (MANUAL, MAINTENANCE, OWNER, OTHER)
- `createdAt`, `updatedAt`

**pricing_settings** — Prijsconfiguratie (singleton)
- `id`, `strategy` (PER_NIGHT, FIXED_PER_STAY)
- `basePrice`, `cleaningFee`, `depositAmount`
- `updatedAt`

**accommodation_settings** — Accommodatie-instellingen (singleton)
- `id`, `accommodationName`, `contactEmail`, `contactPhone`
- `checkInTime`, `checkOutTime`, `maxGuests`, `minStayNights`
- `defaultCleaningFee`, `defaultDeposit`
- `updatedAt`

**audit_logs** — Actielogging
- `id`, `action`, `entityType`, `entityId`
- `description`, `metadata` (JSON), `userId`
- `createdAt`

---

## Authenticatie

De app gebruikt **custom JWT sessies** (geen NextAuth):

1. Gebruiker logt in via server action → credentials worden gecheckt tegen de database
2. Bij succes wordt een JWT token aangemaakt (HS256, 7 dagen geldig)
3. Token wordt opgeslagen in een `HttpOnly` cookie (`session`)
4. Middleware valideert het token op elke request naar beveiligde routes
5. Bij uitloggen wordt de cookie verwijderd

### Route protection (middleware)

| Route | Gedrag |
|---|---|
| `/login`, `/forgot-password`, `/reset-password` | Publiek (redirect naar `/` als ingelogd) |
| `/api/*` | Geen sessie-check (API key auth) |
| Alle overige routes | Redirect naar `/login` zonder geldige sessie |

Beveiligde pagina's krijgen `Cache-Control: no-store` headers om te voorkomen dat de browser gecachte pagina's toont na uitloggen.

---

## API endpoints

### `GET /api/bookings?from=...&to=...`
- **Doel:** Beschikbaarheid ophalen voor de marketing website
- **Auth:** Bearer token (`BOOKING_API_KEY`)
- **Response:** Lijst van bevestigde reserveringen en geblokkeerde periodes

### `POST /api/bookings`
- **Doel:** Boekingsaanvraag insturen vanaf de marketing website
- **Auth:** Bearer token (`BOOKING_API_KEY`)
- **Body:** `firstName`, `lastName`, `email`, `phone?`, `arrivalDate`, `departureDate`, `numberOfGuests`, `guestNote?`
- **Resultaat:** Reservering aangemaakt (status NEW, bron WEBSITE), prijs berekend, e-mails verstuurd

Zie [integration-guide.md](integration-guide.md) voor volledige API documentatie.

---

## Services (business logica)

| Service | Bestand | Verantwoordelijkheid |
|---|---|---|
| Availability | `services/availability.ts` | Overlap checks tegen reserveringen en geblokkeerde periodes |
| Booking Intake | `services/booking-intake.ts` | Verwerking van inkomende boekingsaanvragen |
| Pricing | `services/pricing.ts` | Prijsberekening (nachten × basisprijs + schoonmaakkosten) |
| Mail | `services/mail.ts` | E-mail templates en verzending (console in dev) |
| Audit | `services/audit.ts` | Actielogging voor alle kritische operaties |
| Dashboard | `services/dashboard.ts` | Statistieken en queries voor het dashboard |
| Password Reset | `services/password-reset.ts` | Token generatie en validatie |

---

## Server actions

Alle mutaties verlopen via Next.js server actions (`"use server"`):

| Bestand | Acties |
|---|---|
| `actions/auth-actions.ts` | Login, logout |
| `actions/reservation-actions.ts` | Aanmaken, bewerken, status wijzigen, annuleren |
| `actions/blocked-period-actions.ts` | Aanmaken, bewerken, verwijderen |
| `actions/pricing-actions.ts` | Prijsinstellingen opslaan |
| `actions/settings-actions.ts` | Accommodatie-instellingen opslaan |
| `actions/password-actions.ts` | Wachtwoord vergeten, resetten |

---

## Validatie

Elke module heeft een Zod schema in `lib/validations/`:

| Bestand | Schema's |
|---|---|
| `reservation.ts` | Create, update, status update |
| `calendar.ts` | Create/update geblokkeerde periode |
| `pricing.ts` | Prijsinstellingen |
| `settings.ts` | Accommodatie-instellingen |

Validatie wordt zowel **client-side** (formulier) als **server-side** (server action) uitgevoerd.

---

## E-mails

E-mails worden in development naar de **console** gelogd. Voor productie moet een e-mailprovider geconfigureerd worden (bijv. Resend).

| Trigger | Ontvanger | Template |
|---|---|---|
| Boekingsaanvraag via website | Gast | Aanvraag ontvangen |
| Boekingsaanvraag via website | Beheerder | Nieuwe aanvraag + link |
| Status → Bevestigd | Gast | Reservering bevestigd |
| Annulering | Gast | Reservering geannuleerd |
| Wachtwoord vergeten | Gebruiker | Reset link |

---

## Lokaal ontwikkelen

```bash
# Installeren
npm install

# Database opzetten (lokale PostgreSQL)
createdb orvelterhof
npx drizzle-kit push
npm run db:seed

# Starten
npm run dev -- -p 3005

# Inloggen
# admin@orvelterhof.nl / admin123
```

### Vereisten
- Node.js 18+
- PostgreSQL 14+
- npm
