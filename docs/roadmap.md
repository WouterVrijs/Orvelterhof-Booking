# Orvelterhof SaaS — MVP Roadmap

> Laatste update: 2026-03-19

---

## Module 1 — Authenticatie en accounttoegang

### Epic 1 – Inloggen met e-mailadres en wachtwoord ✅

- [x] **US 1.1** Inlogformulier gebruiken
  - Aparte loginpagina met e-mailadres, wachtwoord, inlogknop en "Wachtwoord vergeten?" link
  - Responsive, duidelijke labels en foutmeldingen, gemaskeerd wachtwoordveld
- [x] **US 1.2** Inloggen met geldige gegevens
  - Succesvolle login met correct e-mailadres en wachtwoord
  - Redirect naar dashboard, sessie direct actief en behouden zolang geldig
- [x] **US 1.3** Foutmelding bij onjuiste inloggegevens
  - Generieke foutmelding "Ongeldige inloggegevens" zonder informatielekkage
  - Formulier blijft zichtbaar voor herpoging
- [x] **US 1.4** Validatie van invoervelden
  - Client-side + server-side validatie op verplicht e-mailadres (geldig formaat) en verplicht wachtwoord
  - Formulier wordt niet verzonden bij ongeldige input

### Epic 2 – Uitloggen ✅

- [x] **US 2.1** Handmatig uitloggen
  - Zichtbare logout-actie in de sidebar
  - Sessie wordt beëindigd, redirect naar loginpagina
- [x] **US 2.2** Geen toegang meer na uitloggen
  - Beveiligde pagina's ontoegankelijk na uitloggen (ook via browser back)
  - Sessiecookies worden verwijderd, no-cache headers op protected routes

### Epic 3 – Wachtwoord vergeten en resetten ✅

- [x] **US 3.1** Wachtwoord reset aanvragen
  - Forgot-password pagina met e-mailadresinvoer
  - Neutrale bevestiging ongeacht of account bestaat (geen account enumeration)
- [x] **US 3.2** Resetlink ontvangen en gebruiken
  - Unieke, tijdelijke resetlink (60 min geldig, eenmalig bruikbaar)
  - Nieuw wachtwoord instellen met minimale eisen (8+ karakters, bevestiging)
  - Na reset: bevestiging + link naar login
- [x] **US 3.3** Ongeldige of verlopen resetlink afhandelen
  - Duidelijke foutmelding bij verlopen/ongeldige/gebruikte token
  - Link naar opnieuw aanvragen, geen technische foutpagina

### Epic 3b – Accountbeheer

- [ ] **US 3b.1** Nieuwe gebruiker aanmaken
  - Beheerder kan via de instellingen een nieuwe gebruiker aanmaken
  - Formulier met naam, e-mailadres en initieel wachtwoord
  - E-mailadres moet uniek zijn, wachtwoord moet voldoen aan minimale eisen (8+ karakters)
  - Wachtwoord wordt veilig gehasht opgeslagen
- [ ] **US 3b.2** Gebruikersoverzicht bekijken
  - Lijst van alle gebruikers met naam, e-mailadres, status (actief/inactief) en aanmaakdatum
  - Duidelijk zichtbaar welke gebruikers actief zijn
- [ ] **US 3b.3** Gebruiker deactiveren en activeren
  - Beheerder kan een gebruiker deactiveren (niet verwijderen)
  - Gedeactiveerde gebruiker kan niet meer inloggen
  - Beheerder kan een gedeactiveerde gebruiker opnieuw activeren
- [ ] **US 3b.4** Wachtwoord van gebruiker resetten
  - Beheerder kan het wachtwoord van een andere gebruiker resetten
  - Nieuw wachtwoord moet voldoen aan minimale eisen
  - Gebruiker kan daarna inloggen met het nieuwe wachtwoord

---

## Module 2 — Dashboard

### Epic 4 – Dashboardoverzicht met kernstatistieken ✅

- [x] **US 4.1** Statistieken op het dashboard bekijken
  - Aantal nieuwe boekingsaanvragen, bevestigde reserveringen, aankomsten en vertrekken (komende 7 dagen)
  - Realtime data uit de database (niet hardcoded)
- [x] **US 4.2** Aankomende aankomsten en vertrekken bekijken
  - Lijsten met bevestigde reserveringen gesorteerd op datum
  - Klikbaar naar reserveringsdetail
- [x] **US 4.3** Snelle acties gebruiken
  - Knoppen naar reserveringen, kalender, prijzen en instellingen
  - Direct navigeerbaar vanuit het dashboard

---

## Module 3 — Reserveringenbeheer

### Epic 5 – Reserveringen overzicht en zoeken ✅

- [x] **US 5.1** Reserveringen overzicht bekijken
  - Tabel/lijst met alle reserveringen (naam, datums, status, aanmaakdatum)
  - Standaard gesorteerd op aanmaakdatum (nieuwste eerst)
- [x] **US 5.2** Reserveringen filteren op status
  - Filters voor: nieuw, in behandeling, bevestigd, geannuleerd
  - Meerdere filters tegelijk mogelijk
- [x] **US 5.3** Reserveringen zoeken
  - Zoeken op gastnaam, e-mailadres of reserveringsnummer
  - Zoekresultaten direct zichtbaar
- [x] **US 5.4** Reserveringen sorteren
  - Sorteeropties: aankomstdatum, vertrekdatum, aanmaakdatum
  - Oplopend en aflopend

### Epic 6 – Reservering handmatig aanmaken ✅

- [x] **US 6.1** Nieuwe reservering aanmaken via formulier
  - Formulier met: voornaam, achternaam, e-mail, telefoon, aankomst- en vertrekdatum, aantal gasten, notities
  - Validatie op alle verplichte velden en datumlogica
- [x] **US 6.2** Overlapcontrole bij aanmaken
  - Server-side check op overlappende bevestigde reserveringen en geblokkeerde periodes
  - Duidelijke foutmelding bij overlap
- [x] **US 6.3** Reserveringsnummer automatisch toewijzen
  - Uniek reserveringsnummer bij aanmaken
  - Zichtbaar op detail en in overzicht

### Epic 7 – Reservering bewerken

- [x] **US 7.1** Reserveringsgegevens bewerken
  - Gastnaam, contactgegevens, datums, aantal gasten, notities aanpassen
  - Validatie bij opslaan, overlapcontrole op gewijzigde datums
- [x] **US 7.2** Interne notities toevoegen
  - Vrij tekstveld voor interne opmerkingen
  - Alleen zichtbaar voor beheerders, niet voor gasten

---

## Module 4 — Beschikbaarheid en kalender

### Epic 8 – Kalenderweergave

- [x] **US 8.1** Maandoverzicht in de kalender bekijken
  - Kalenderweergave per maand met navigatie (vorige/volgende maand, vandaag)
  - Bevestigde reserveringen zichtbaar als gekleurde blokken
- [x] **US 8.2** Geblokkeerde periodes in de kalender zien
  - Handmatig geblokkeerde periodes zichtbaar in de kalender (andere kleur dan reserveringen)
  - Legenda met kleurcodering

### Epic 9 – Geblokkeerde periodes beheren

- [x] **US 9.1** Geblokkeerde periode aanmaken
  - Formulier met startdatum, einddatum, reden en type (handmatig, onderhoud, eigen gebruik, overig)
  - Validatie op datumlogica en overlap met bevestigde reserveringen
- [x] **US 9.2** Geblokkeerde periode bewerken
  - Datums, reden en type aanpassen
  - Overlapcontrole bij opslaan
- [x] **US 9.3** Geblokkeerde periode verwijderen
  - Verwijderen met bevestigingsdialoog
  - Datums worden weer beschikbaar

---

## Module 5 — Aanvragen vanuit de website ontvangen

### Epic 10 – Boekingsaanvraag API

- [x] **US 10.1** Boekingsaanvraag ontvangen via API
  - API endpoint voor externe website om boekingsaanvragen in te sturen
  - Authenticatie via API key
- [x] **US 10.2** Aanvraag valideren
  - Verplichte velden valideren (naam, e-mail, datums, gasten)
  - Datumlogica controleren (vertrek na aankomst, maximaal aantal gasten)
  - Beschikbaarheid server-side checken
- [x] **US 10.3** Reservering aanmaken bij geldige aanvraag
  - Reservering met status "nieuw" en bron "website" aanmaken
  - Reserveringsnummer automatisch toewijzen
  - E-mailworkflows triggeren (bevestiging naar gast, notificatie naar beheerder)

---

## Module 6 — Reserveringsdetail en opvolging

### Epic 11 – Reserveringsdetailpagina

- [x] **US 11.1** Reserveringsdetails bekijken
  - Overzicht van alle reserveringsgegevens (gastnaam, datums, gasten, prijs, status, notities)
  - Reserveringsnummer, bron en tijdstempels zichtbaar
- [x] **US 11.2** Reserveringsstatus bijwerken
  - Status wijzigen: nieuw → in behandeling → bevestigd of geannuleerd
  - Gecontroleerde overgangen (niet willekeurig van status wisselen)

### Epic 12 – Reservering bevestigen en annuleren

- [x] **US 12.1** Reservering bevestigen
  - Bevestigen maakt de geselecteerde periode onbeschikbaar
  - Server-side overlapcontrole bij bevestigen
  - Bevestigingsmail naar gast triggeren
- [x] **US 12.2** Reservering annuleren
  - Annulering met optionele reden
  - Beschikbaarheid wordt vrijgegeven
  - Annuleringsmail naar gast triggeren

---

## Module 7 — E-mails en notificaties

### Epic 13 – Transactionele e-mails

- [x] **US 13.1** Bevestigingsmail naar gast bij boekingsaanvraag
  - Automatische e-mail na ontvangst van boekingsaanvraag
  - Bevat: naam, datums, reserveringsnummer
- [x] **US 13.2** Notificatiemail naar beheerder bij nieuwe aanvraag
  - Automatische e-mail naar beheerder bij nieuwe boekingsaanvraag
  - Bevat: gastgegevens, datums, link naar reservering
- [x] **US 13.3** Bevestigingsmail bij reserveringsbevestiging
  - E-mail naar gast bij statuswijziging naar "bevestigd"
  - Bevat: bevestigde datums, eventuele aanvullende informatie
- [x] **US 13.4** Annuleringsmail bij annulering
  - E-mail naar gast bij annulering
  - Neutrale, nette toon
- [x] **US 13.5** E-mailprovider koppelen (Resend)
  - Resend SDK geïntegreerd in mail service
  - Werkt met `RESEND_API_KEY` environment variable
  - Fallback naar console logging zonder API key
- [ ] **TODO** Resend account en domein instellen
  - [ ] Resend account aanmaken op resend.com
  - [ ] API key genereren
  - [ ] Domein `orvelterhof.nl` toevoegen en DNS records instellen (SPF, DKIM)
  - [ ] `RESEND_API_KEY` toevoegen aan Vercel environment variables
  - [ ] `EMAIL_FROM` instellen op geverifieerd domein-adres

### Epic 14 – E-mail logging

- [ ] **US 14.1** Verstuurde e-mails loggen
  - Alle verstuurde e-mails opslaan met: type, ontvanger, onderwerp, status, tijdstempel
  - Overzicht van e-maillogs per reservering

---

## Module 8 — Prijsbeheer

### Epic 15 – Prijsinstellingen beheren

- [x] **US 15.1** Basisprijs instellen
  - Basisprijs configureren (per nacht of vast per verblijf)
  - Eén prijsstrategie voor de MVP
- [x] **US 15.2** Schoonmaakkosten en borgsom instellen
  - Schoonmaakkosten en borgsom configureerbaar
  - Worden meegenomen in totaalberekening van reserveringen
- [x] **US 15.3** Totaalprijs berekenen bij reservering
  - Automatische berekening op basis van nachten × basisprijs + schoonmaakkosten
  - Borgsom apart zichtbaar

---

## Module 9 — Instellingen

### Epic 16 – Accommodatie-instellingen beheren

- [x] **US 16.1** Algemene accommodatiegegevens beheren
  - Accommodatienaam, contacte-mail en contacttelefoonnummer instellen
- [x] **US 16.2** Boekingsregels instellen
  - Standaard inchecktijd en uitchecktijd (HH:MM formaat)
  - Maximaal aantal gasten
  - Minimum verblijfsduur (nachten)
- [x] **US 16.3** Standaard kosten instellen
  - Standaard schoonmaakkosten en borgsom
  - Worden gebruikt als default bij nieuwe reserveringen

---

## Module 10 — Basis audit en historie

### Epic 17 – Actielogging

- [x] **US 17.1** Belangrijke acties loggen
  - Logging van: reservering aangemaakt, bevestigd, geannuleerd, geblokkeerde periode aangemaakt/verwijderd
  - Per actie: wat, wanneer, door wie
- [x] **US 17.2** Statuswijzigingen bijhouden
  - Tijdstempel van laatste statuswijziging per reservering
  - Overzicht van statushistorie per reservering

---

## Module 11 — Gebruikersbeheer

### Epic 18 – Rollen en toegangsbeheer ✅

- [x] **US 18.1** Rolgebaseerde toegang
  - Twee rollen: ADMIN (volledig beheer) en USER (regulier gebruik)
  - Rol opgeslagen in database en meegenomen in JWT sessie
- [x] **US 18.2** Gebruikersbeheer afschermen voor niet-admins
  - Alleen ADMIN kan de gebruikersbeheerpagina openen
  - Server-side autorisatiecheck op alle user management acties
  - Sidebar toont "Gebruikers" link alleen voor ADMIN

### Epic 19 – Gebruikersbeheer door admin ✅

- [x] **US 19.1** Overzicht van alle gebruikers
  - Lijst met naam, e-mail, rol, actief/inactief status
  - Bereikbaar via /settings/users (alleen ADMIN)
- [x] **US 19.2** Nieuwe gebruiker toevoegen
  - Formulier met naam, e-mailadres, wachtwoord (min. 8 tekens) en rol
  - E-mailadres moet uniek zijn
  - Validatie op alle velden
- [x] **US 19.3** Gebruiker deactiveren en activeren
  - Account deactiveren (soft delete) zodat gebruiker niet meer kan inloggen
  - Account weer activeren
  - Beveiliging: eigen account niet deactiveren
- [x] **US 19.4** Wachtwoord resetten door admin
  - Admin kan nieuw wachtwoord instellen voor een gebruiker
  - Wachtwoord minimaal 8 tekens
- [x] **US 19.5** Zelfbescherming voor admin
  - Admin kan eigen admin-rol niet verwijderen
  - Admin kan eigen account niet deactiveren

---

## Module 12 — Betalingen en facturatie

### Epic 20 – Betalingsstatus en registratie ✅

- [x] **US 20.1** Betalingsstatus per reservering
  - Status bijhouden: onbetaald, aanbetaald, volledig betaald, terugbetaald
  - Betalingsstatus zichtbaar op reserveringsdetail en in overzichtslijst
- [x] **US 20.2** Handmatige betaling registreren
  - Beheerder kan een ontvangen betaling registreren (bedrag, datum, methode, opmerking)
  - Meerdere deelbetalingen per reservering mogelijk
  - Betalingsstatus wordt automatisch bijgewerkt op basis van totaal ontvangen vs totaalprijs
- [x] **US 20.3** Betalingsoverzicht
  - Overzicht van alle betalingen per reservering
  - Betalingsstatus kolom in reserveringslijst

### Epic 21 – Online betalen via Mollie ✅

- [x] **US 21.1** Mollie integratie opzetten
  - Mollie SDK geïnstalleerd en service gebouwd
  - Webhook endpoint op /api/webhooks/mollie
- [x] **US 21.2** Betaallink genereren per reservering
  - Beheerder kan betaallink aanmaken vanuit reserveringsdetail
  - Link kan gekopieerd en gedeeld worden
- [x] **US 21.3** Betaallink versturen naar gast
  - E-mail met betaallink en reserveringsdetails
  - "Nu betalen" knop in e-mail naar Mollie checkout
- [x] **US 21.4** Betalingsstatus automatisch bijwerken via webhook
  - Mollie webhook verwerkt statusupdates (betaald, mislukt, terugbetaald)
  - Betalingsstatus en bedrag automatisch bijgewerkt
  - Audit log bij elke wijziging
- [x] **US 21.5** Terugbetaling via Mollie
  - (Deel)terugbetaling initiëren vanuit de app
  - Verwerking via Mollie Refunds API
- [ ] **TODO** Mollie account en API key instellen
  - [ ] Mollie account aanmaken op mollie.com
  - [ ] API key genereren (test + live)
  - [ ] `MOLLIE_API_KEY` toevoegen aan Vercel environment variables
  - [ ] Webhook URL instellen in Mollie dashboard

### Epic 22 – Facturen genereren ✅

- [x] **US 22.1** Factuur genereren per reservering
  - Factuur aanmaken vanuit reserveringsdetail met alle gegevens
  - BTW-berekening (21%) apart zichtbaar
  - Factuurnummer automatisch oplopend per jaar (F2026-0001)
- [x] **US 22.2** Factuur als PDF downloaden
  - Professionele HTML factuur via /api/invoices/[id]/pdf
  - Browser print → PDF opslaan
  - Bevat: accommodatiegegevens, gastgegevens, factuurregels, BTW, totaal
- [x] **US 22.3** Factuur per e-mail versturen
  - E-mail met factuurlink naar gast
  - Status wordt bijgewerkt naar "Verstuurd"
- [x] **US 22.4** Factuurstatus bijhouden
  - Statussen: concept, verstuurd, betaald
  - Factuurkaart op reserveringsdetail met acties

### Epic 23 – Borgsom administratie ✅

- [x] **US 23.1** Borgsom ontvangst registreren
  - Borgsom registreren met bedrag, datum en methode
  - Borgsom kaart zichtbaar op reserveringsdetail met status
- [x] **US 23.2** Borgsom terugbetaling registreren
  - Terugbetaling (volledig of gedeeltelijk) met datum
  - Optionele reden voor inhouding (schade, extra kosten)
  - Statussen: verwacht, ontvangen, terugbetaald, deels terugbetaald, ingehouden
- [x] **US 23.3** Borgsom tracking per reservering
  - Borgsom velden op reserveringen (bedrag, status, data, reden)
  - Audit logging van alle borgsomwijzigingen

---

## Post-MVP functionaliteiten

> Onderstaande functionaliteiten zijn bewust buiten scope voor de MVP. De architectuur houdt er waar mogelijk rekening mee.

- Kortingscodes
- Channel manager (Airbnb, Booking.com)
- iCal synchronisatie
- Multi-property ondersteuning
- Uitgebreide permissies per module (fijnmaziger dan ADMIN/USER)
- Huishoudelijke workflows
- Analytics dashboards
- Meertaligheid
- Gastportaal
- Dynamische / seizoensgebonden prijzen

---

## Voortgangsoverzicht

| Module | Epics | Afgerond | Status |
|--------|-------|----------|--------|
| 1. Authenticatie | 3 | 3 | ✅ Compleet |
| 2. Dashboard | 1 | 1 | ✅ Compleet |
| 3. Reserveringenbeheer | 3 | 3 | ✅ Compleet |
| 4. Kalender | 2 | 2 | ✅ Compleet |
| 5. Website-aanvragen | 1 | 1 | ✅ Compleet |
| 6. Reserveringsdetail | 2 | 2 | ✅ Compleet |
| 7. E-mails | 2 | 2 | ✅ Compleet |
| 8. Prijsbeheer | 1 | 1 | ✅ Compleet |
| 9. Instellingen | 1 | 1 | ✅ Compleet |
| 10. Audit | 1 | 1 | ✅ Compleet |
| 11. Gebruikersbeheer | 2 | 2 | ✅ Compleet |
| 12. Betalingen & facturatie | 4 | 4 | ✅ Compleet |
| **Totaal** | **23** | **23** | **100%** |



## inlog codes
E-mail: admin@orvelterhof.nl
Wachtwoord: admin123