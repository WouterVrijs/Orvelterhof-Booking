# Prompt: Dynamische prijzen laden op de marketing website

> Kopieer onderstaande prompt en gebruik hem op de marketing website codebase.

---

## Prompt

Je gaat de marketing website van Het Orvelterhof aanpassen zodat alle prijzen dynamisch worden geladen vanuit het boekingssysteem (SaaS) in plaats van hardcoded in de code te staan.

### Huidige situatie

Prijzen voor de boekingsmodule staan nu hardcoded in de website code. Dit betekent dat bij elke prijswijziging de website code aangepast en opnieuw gedeployed moet worden.

### Doel

Alle prijzen worden opgehaald via een API endpoint van het boekingssysteem. De beheerder past prijzen aan in de SaaS → de marketing website toont automatisch de nieuwe prijzen zonder code-aanpassingen.

### API specificatie

**Endpoint:** `GET {BOOKING_API_URL}/pricing`
(vervang `{BOOKING_API_URL}` door de waarde van je `BOOKING_API_URL` environment variable, bijv. `https://orvelterhof-booking.vercel.app/api/pricing`)

**Authenticatie:** `Authorization: Bearer {BOOKING_API_KEY}`

**Response formaat:**

```json
{
  "basePrice": {
    "perNight": 650,
    "type": "PER_NIGHT"
  },
  "mandatoryCosts": [
    { "id": "uuid", "name": "Eindschoonmaak", "type": "FIXED", "price": 425 },
    { "id": "uuid", "name": "Bedlinnen", "type": "PER_PERSON", "price": 14.50 },
    { "id": "uuid", "name": "Energie", "type": "PER_PERSON_PER_NIGHT", "price": 3.95 },
    { "id": "uuid", "name": "Gem. heffingen", "type": "PER_PERSON_PER_NIGHT", "price": 2.95 }
  ],
  "upgrades": [
    { "id": "uuid", "name": "Keukenlinnen", "type": "PER_UNIT", "price": 5.50 },
    { "id": "uuid", "name": "Barbecue", "type": "PER_UNIT", "price": 35.00 },
    { "id": "uuid", "name": "Badlinnen", "type": "PER_PERSON", "price": 3.75 },
    { "id": "uuid", "name": "Activiteit", "type": "PER_PERSON", "price": 20.00 },
    { "id": "uuid", "name": "Kinderbedden", "type": "PER_UNIT", "price": 7.50 },
    { "id": "uuid", "name": "Ontbijt", "type": "PER_PERSON_PER_NIGHT", "price": 0.00 }
  ]
}
```

### Betekenis van `type` velden

| Type | Berekening | Voorbeeld |
|---|---|---|
| `FIXED` | Vast bedrag per reservering | Eindschoonmaak: €425 |
| `PER_PERSON` | Prijs × aantal personen | Bedlinnen: €14.50 × 8 pers = €116 |
| `PER_NIGHT` | Prijs × aantal nachten | Verblijf: €650 × 3 nachten = €1.950 |
| `PER_PERSON_PER_NIGHT` | Prijs × personen × nachten | Energie: €3.95 × 8 pers × 3 nachten = €94.80 |
| `PER_UNIT` | Prijs × gekozen aantal | Barbecue: €35 × 1 stuk = €35 |

### Wat je moet doen

1. **Server action of utility aanmaken** die de prijzen ophaalt:

```ts
// Voorbeeld: src/lib/pricing/fetchPricing.ts
"use server";

export async function fetchPricing() {
  const res = await fetch(`${process.env.BOOKING_API_URL}/pricing`, {
    headers: {
      Authorization: `Bearer ${process.env.BOOKING_API_KEY}`,
    },
    next: { revalidate: 300 }, // Cache voor 5 minuten
  });

  if (!res.ok) throw new Error("Failed to fetch pricing");
  return res.json();
}
```

2. **Zoek alle plekken waar prijzen hardcoded staan** in de boekingsmodule:
   - Basisprijs per nacht
   - Schoonmaakkosten
   - Energiekosten
   - Gemeentelijke heffingen
   - Bedlinnen
   - Alle upgrade-prijzen (keukenlinnen, barbecue, badlinnen, activiteit, kinderbedden, ontbijt)

3. **Vervang hardcoded waarden** door de API data:
   - Haal de prijzen op via `fetchPricing()` in de boekingspagina (server component)
   - Geef de prijsdata als props door aan de client components
   - Gebruik de `type` velden om de juiste berekening toe te passen

4. **Prijsberekening updaten** zodat het de API data gebruikt:
   - Basisprijs = `basePrice.perNight × nachten`
   - Verplichte kosten = bereken elke `mandatoryCost` op basis van het `type`
   - Upgrades = bereken op basis van gekozen aantal en `type`
   - Totaalprijs = basisprijs + verplichte kosten + gekozen upgrades

5. **Caching**: Gebruik `next: { revalidate: 300 }` (5 minuten) bij de fetch zodat de API niet bij elk pageview wordt aangeroepen. Prijzen veranderen niet per seconde.

6. **Fallback**: Als de API niet bereikbaar is, toon een foutmelding of gebruik gecachte data. Laat de boekingsflow niet crashen bij een tijdelijke API storing.

### Environment variables

Controleer dat deze variabelen zijn ingesteld:

```
BOOKING_API_URL=https://orvelterhof-booking.vercel.app/api
BOOKING_API_KEY=<dezelfde key als in het boekingssysteem>
```

Let op: de `BOOKING_API_URL` moet eindigen op `/api` (zonder trailing slash), zodat je `/pricing` en `/bookings` er achter kunt plakken.

### Bij het insturen van een boeking

Stuur de berekende totaalprijs en de gekozen kostenregels mee in de `POST /api/bookings` call:

```json
{
  "firstName": "Jan",
  "lastName": "de Vries",
  "email": "jan@example.nl",
  "arrivalDate": "2026-08-15",
  "departureDate": "2026-08-18",
  "numberOfGuests": 8,
  "totalPrice": 2845.40,
  "lineItems": [
    { "name": "Verblijf (3 nachten)", "quantity": 3, "unitPrice": 650, "totalPrice": 1950 },
    { "name": "Eindschoonmaak", "quantity": 1, "unitPrice": 425, "totalPrice": 425 },
    { "name": "Bedlinnen", "quantity": 8, "unitPrice": 14.50, "totalPrice": 116 },
    { "name": "Energie", "quantity": 24, "unitPrice": 3.95, "totalPrice": 94.80 },
    { "name": "Gem. heffingen", "quantity": 24, "unitPrice": 2.95, "totalPrice": 70.80 },
    { "name": "Barbecue", "quantity": 1, "unitPrice": 35, "totalPrice": 35 }
  ]
}
```

Het boekingssysteem slaat de totaalprijs en alle kostenregels op bij de reservering.

### Belangrijk

- Doe de API call altijd **server-side** (server action of server component) — stuur de API key nooit naar de browser
- Gebruik caching om onnodige API calls te voorkomen
- De `id` velden in de response zijn optioneel — je kunt ze meesturen als `costItemId` in de lineItems maar het is niet verplicht
- Test na implementatie door een prijs aan te passen in het boekingssysteem en te controleren dat de website de nieuwe prijs toont (na max 5 minuten cache)
