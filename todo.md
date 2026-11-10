# NisseKomm — Prosjektplan Sesong 2 (2026): Operasjon Spøkelseskode

## Arbeidsrekkefølge for sesong 2026

Hvert steg låses før det neste starter. Endringer i et låst steg krever et eksplisitt ja, og vi sjekker hvilke senere steg som påvirkes. Ingen video lages før manuset er låst.

| #   | Steg                                                                                             | Avhenger av                     | Låser                                   | Mål         |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------- | --------------------------------------- | ----------- |
| 0   | Lås historien: storyboard, lukk hull, uavhengig gjennomgang, godkjenning                         | –                               | `docs/historie-2026.md`                 | 12. nov     |
| 1   | Gåter og praktisk: koder, brikke i huset og på skjermen, hvem gjør hva, materialer               | 0                               | Gåtedesign, innkjøps- og utskriftsliste | 15. nov     |
| 2   | All tekst: 24 Julius-manus, 24 Rampenisse-radiomanus, e-post, filer, Kuldes meldinger, språkvask | 1                               | Ferdige manus                           | 18. nov     |
| 3   | App-kode: fjern flerbruker, ett eventyr, tre merker, video i stedet for dagbok, frost, LiveCam   | 0 (dataformat), parallelt med 2 | Fungerende app med plassholdere         | 22. nov     |
| 4   | Media: Julius-videoer, TV-loops, musikk (se `assets/`)                                           | 2 og grafikk                    | Ferdige filer i `public/`               | 25. nov     |
| 5   | Integrasjon og flytting hjem (fase 5)                                                            | 3 og 4                          | –                                       | 28. nov     |
| 6   | Generalprøve alle 24 dager, innkjøp og utskrifter klare                                          | alt                             | –                                       | 29.–30. nov |

- [x] Steg 0: Lås historien (10. nov)
- [x] Steg 1: Gåter og praktisk gjennomgang (10. nov)
- [ ] Steg 1b: Bestill og skriv ut fysisk materiell
- [ ] Steg 1c: Finn nettbutikker for det vi ikke har eller får kjøpt lokalt (budsjett 1000 kr totalt, inkludert frakt; bestill tidlig nok til levering før 25. november)
  - Bare iskrystallet (dag 24) er en mulig nettpost, inntil 250 kr. Let lokalt først. Kandidater: Hadeland Glassverk julepynt (hadeland.com), Hadeland-produkter hos CG.no (frostet glasstre 9,8 cm, 199 kr, 3–5 dager), brukt «Hadeland snøkrystall» på FINN (ca. 100 kr). Siste bestillingsdag 1. desember.
- [x] Steg 2: All tekst låst (10. nov)
- [ ] Steg 3: App-kode
- [ ] Steg 4: Media produsert
- [ ] Steg 5: Integrasjon og flytting hjem
- [ ] Steg 6: Generalprøve

---

## Fase 1: Grunnlag, 2026-historie og CRT-moduler (Fullført i PR #9)

- [x] Arkiver 2025-sesongen under `src/data/archive/2025/`
- [x] 24 daglige oppdrag (`uke1_oppdrag.json` til `uke4_oppdrag.json`) med asymmetriske søskenroller (Hanna 5, Håkon 9, Kristian 12)
- [x] 3 sammenvevde eventyr (`morkets-trussel`, `iqs-oppfinnelser`, `brevfugl-mysteriet`) i `eventyr.json`
- [x] `SnøfallTV`: 4 fotografiske kamerakanaler (`/feed/*.png`), analog CRT RF-multipath spøkelsesbilde fra Kulde, og frekvenssøk (`85.0`–`108.0 MHz`)
- [x] `NisseMusikk`: Ekte HTML5-avspilling av 12 8-bit MP3-spor i `public/music/` med spoling, volumkontroll og Dag 12-ledetråd (`DEL 2: O - D - I`)
- [x] `Brevfugler`: Live radar-animasjon og nordlys-telemetri (Dag 9 `NORDLYS`)
- [x] `NisseKrypto`: 9 fysiske QR-symbolkort knyttet til 3 dekrypteringsutfordringer (Dag 12, 18, 23)
- [x] `/api/home-bridge`: Endepunkt for smarthus-status (`frost_decay`, `normal_warm`, `victory_gold`) og krisehåndtering (`crisis_antenna`, `crisis_lantern`)
- [x] `mise.toml`: Oppgaver for utviklingsserver, datomocking og sjekk (`mise run dev`, `mise run dev:day`, `mise run check`)

---

## Fase 2: Multi-modale utvidelser (Fysisk + Digitalt + Smarthus)

### 2.1 Utskrivbare fysiske rekvisitter (`/nissemor-guide/printout`)

- [ ] **Rød-filter dekoderkort (Dag 1 og utvalgte dager):** Mal for kort med rød støytekst som skjuler blå/cyan kodebokstaver når Hanna (5) ser gjennom et rødt cellofan-filter ("Spøkelses-skanner").
- [ ] **Brett-og-linjer blåkopier (IQs skjemaer):** Utskrivbare ark der halve bokstaver og kretslinjer danner kodeordet først når Håkon (9) bretter arket langs stiplede piler.
- [ ] ** Hullkort / sjablongkort:** Kort med utklippede vinduer som legges over en bestemt side i en fysisk bok i bokhyllen (eller utskrift fra NisseNet) for å isolere passordet.
- [ ] **1:1 Skjerm-kalkeringskart:** Mal tilpasset bakepapir/matpapir med registreringsmerker som holdes direkte mot CRT-skjermen i `SnøfallTV` (CAM 2) for å koble fysiske punkter med lysende skjermkoordinater.

### 2.2 Sanntids smarthus-respons (`varden` / Home Assistant webhook)

- [ ] **Utgående webhook ved kode-innlevering (`KodeTerminal`):** Send umiddelbar POST fra server/klient til lokal `varden`-agent når dagens kode løses, slik at stuelampene blinker gull to ganger og skifter fra kald blå (`4000K`) til varm hvit (`2200K`) innen 2 sekunder.
- [ ] **Utgående webhook ved frekvenslås (`SnøfallTV` på `90.0 MHz`):** Trigger en kort 8-sekunders radioskurring eller lydeffekt på kjøkkenhøyttaleren når Kristian (12) låser inn bærebølgen på `90.0 MHz`.
- [ ] **Morgen-indikator i gangen:** Automatiser i `varden` at én lampe i gangen lyser isblått kl. 06:45 hver morgen frem til dagens kode i NisseKomm er løst (`lightingPreset === "frost_decay"`).

### 2.3 Skjerm- og lyd-interaksjon i appen

- [ ] **Kalibreringsmodus på `SnøfallTV` CAM 2:** Legg til en knapp (`[KALIBRER SKJERMKART]`) som viser faste hjørnekors på CRT-skjermen slik at barna kan legge fysisk matpapir eller hullkort rett på skjermen.
- [ ] **Akustisk rytme-/morse-fyr i `SnøfallTV`:** Bruk Web Audio API (`SoundManager`) til å spille en kort repeterende tone-sekvens når radioen stilles inn på en skjult frekvens, som matcher fysiske banketegn fra Rampenissen.

---

## Fase 3: Fysiske forberedelser før 1. desember (Foreldre-sjekkliste)

- [ ] Skriv ut og klipp til de 9 fysiske QR-symbolkortene (Dag 3, 6, 9, 12, 15, 18, 20, 22, 23) via `/nissemor-guide/printout`.
- [ ] Lag "Spøkelses-skanneren" (rød cellofan i pappramme) og gjør klar lommelykt til mørke morgener.
- [ ] Sett opp et fysisk "Operasjonsbrett" (korktavle eller veggplass ved PC-en) der barna kan henge opp symbolkort, brettede blåkopier og løste koder gjennom hele desember.
- [ ] Kjør en rask generalprøve på Dag 1 med `mise run dev:day 1`.

---

## Fase 4: Opprydding og kvalitetssikring før sesongen

- [ ] **Finn foreldreløs kode:** Kartlegg komponenter, moduler, systemer, generatorer, API-ruter og JSON-felt som ikke lenger brukes etter at historien for 2026 er låst (for eksempel eventyr-logikk for flere parallelle historier, fjernede merker og lys/webhook-delene i `/api/home-bridge` som ikke har motpart i Varden).
- [ ] **Slett det som er dødt:** Fjern ubrukt kode og data i stedet for å kommentere det ut. Oppdater tester og dokumentasjon (AGENTS.md, ARCHITECTURE.md, IMPLEMENTATION.md) så de stemmer med koden.
- [ ] **Verifiser hele sesongen:** Kjør `pnpm check` og gå gjennom alle 24 dager med `mise run dev:day <dag>` for å bekrefte at alt fungerer som forventet.
- [ ] **knip:** Ekskluder `.claude/worktrees/` så agent-worktrees ikke gir falske treff i `pnpm check`.
- [ ] **Next.js-sikkerhetsfiks:** Oppgrader `next` og `eslint-config-next` til 16.4.6 når pakken har passert `minimum-release-age` (worktree og gren `chore/nextjs-security-upgrade` finnes).
- [ ] **Videostørrelse:** Komprimer Julius-videoene hardere (mål: 8–12 MB per innslag; dag 1-testen ble 28 MB for 47 s).

---

## Neste kodeoppgaver (lokalt, 10. november)

- [ ] **Varslingssystem:** et lite system for utgående varsler med kanaler som kan slås av og på (e-post til foreldre, Varden/iMessage, Skjerm-kort, radio). Ingen kanal aktiv nå; e-post kan legges til igjen senere.
- [ ] **MCP-server** (fase 5, T7 og T8) bygges lokalt nå, testet uten Kanidm (lokal nøkkel), og kobles til VKS ved utrulling.
- [ ] **Simulering:** utvid Tidsmaskin til et simuleringspanel i foreldreguiden: hopp til dag og klokkeslett, løs dager automatisk opp til en dag, sett frost, nullstill, og spol en hel uke.
- [ ] **Designrevisjon:** forslag i `docs/design-revisjon-2026.md`, deretter bygging av det som godkjennes.

- [ ] **MCP-API v1 for hjemmet (avtalt med Varden 10. november, Starefossen/homelab#22, bygges når integrasjon gjenopptas):** `get_screen` (Skjerm: dører, dagens tittel og teaser fra 06:00, Frostgrad, Kulde-navn, merker, Rampenissen sett etter 09/10, frost, gråtone, TV-variant og hendelse, `next_change_at`), `get_clips(date)` (radio: lyd-URL, varighet, sha256, ferdig innen 05:30), `get_kid_context` (Varden: alt barna har låst opp, altså fremdrift, dagens og tidligere dagers e-post, transkripsjon når videoen er sett, PS etter løsning, åpne NisseNet-filer og symboler; uopptjente koder sensureres, ingen foreldredata, pluss en fast `guidance` om aldri å gi svaret; Hans 10. november), foreldreverktøy (`give_hint`, `set_frost`, `skip_day`, `reset`, `set_fake_now` som bare gjelder svar til operatøren, utløper etter 24 timer og logges, pluss `preview_screen(as_caller)` for å se Skjerms visning). Alle svar har `schema_version: 1`, tid i Europe/Oslo og er under 16 KB. Medie-URL-er har sterk ETag og Range.
- [ ] **Skjerm-tekster (venter på integrasjon):** skriv `skjerm_teaser` (én linje lore per dag, ingen bokstaver, tall eller steder) for 24 dager, og en `get_screen`-variant i MCP for familieskjermen.

## Fase 5: Flytt til hjemmeklyngen (krav fra Varden, Starefossen/homelab#22)

Varden eier hjemmesiden i `starefossen/home` (Knative-tjeneste, `minScale=maxScale=1` 1. desember–6. januar, 200Mi/512Mi, PostgreSQL (CloudNativePG), CiliumNetworkPolicy, Secret). NisseKomm-repoet er vårt. Varden rører det ikke.

- [ ] **Kjøring:** `output: "standalone"` i `next.config`, lytt på `$PORT` (standard 8080), bind `0.0.0.0`.
- [ ] **Dockerfile:** flertrinns på `node:24-alpine`, ikke-root, multi-arch (amd64 påkrevd). Push til `registry.intern.flaatten.org:5000/nissekomm:<unix-ts>` med en mise-oppgave.
- [ ] **Media i imaget:** `public/` bakes inn (Next støtter Range-forespørsler, som Safari trenger for video).
- [ ] **Lagring:** PostgreSQL i Varden-klyngen (CloudNativePG), tilkobling fra `DATABASE_URL`. Ingen PVC for appen, så den kan skalere til null og skaleres uavhengig av databasen. Bruk en ren JS-klient (`pg`).
  - Egen CNPG-klynge `nissekomm-db` (1 instans, 1Gi, PG 17) i navnerommet `nissekomm`. `DATABASE_URL` kommer fra den genererte hemmeligheten `nissekomm-db-app` (nøkkel `uri`, vert `nissekomm-db-rw.nissekomm.svc`, ingen TLS-krav i klyngen).
  - Migreringer kjøres ved oppstart og må tåle å kjøres flere ganger. Liten tilkoblingspool (maks 5). `/api/health` rører ikke databasen.
- [ ] **Helse:** `GET /api/health` gir 200 uten autentisering og uten tung IO.
- [ ] **Fjern:** `@sanity/*`, Sanity Studio og migreringer, `resend` og e-postskript, Vercel-cron og `vercel.json`, `@vercel/analytics`. Null utgående trafikk i kjøring.
- [ ] **Én familie:** barnekode og foreldrekode fra miljøet (`KID_CODE`, `PARENT_CODE`). Ingen registrering, gjenoppretting eller avmelding.
- [ ] **Hjemmeintegrasjon via MCP** (erstatter REST-endepunktene; bekreftet av Hans 10. november): MCP-server på `/mcp` (Streamable HTTP, `@modelcontextprotocol/sdk`), bare på hjemmenettet. `api/home-bridge` fjernes.
  - Autentisering: `Authorization: Bearer` med Kanidm-JWT, validert med `jose` mot JWKS fra `https://id.flaatten.org/oauth2/openid/mcp`, audience `mcp`, scope `groups`. Ingen token i URL.
  - Nivå `read` (barnesikkert): `get_state`, `get_clips(date)`, `get_today_quest`, `get_progress`. Aldri koder, svar, `hint` eller fremtidige dager; filtreres på serveren, med test som sjekker svarene mot alle 24 koder.
  - Nivå `parent`: `give_hint(day)`, `set_frost(active, until)`, `reset`/`skip_day`. Varden, radio-produsent og Skjerm får bare `read`. `parent` bare for operatør og en egen foreldreidentitet. Ingen verktøy som gir fasit.
  - Lyd serveres med HTTP GET og samme Bearer.
  - Krever adversarial gjennomgang av en annen modell før merge (autentisering).
- [ ] **Bygg:** produksjonsbygg setter ikke `NEXT_PUBLIC_MOCK_*`, `TEST_MODE` eller `STORAGE_BACKEND` (de bakes inn ved bygging).
- [ ] **Sikkerhetshoder:** flytt fra `vercel.json` til `headers()` i `next.config`.
- [ ] **Miljø:** `PORT`, `DATABASE_URL`, `KID_CODE`, `PARENT_CODE`, `HOME_STATE_TOKEN`, `NEXT_PUBLIC_URL=https://nissekomm.nissekomm.fn.flaatten.org`.
- [ ] **Flytt kildekoden til `starefossen/home`:** Etter at `feat/season-2026` er merget og ingen agenter jobber, flyttes repoet inn som `apps/nissekomm` med `git subtree` (historikken beholdes), og dette repoet arkiveres. Hold bygge- og utrullingsoppsett relativt til repoet (ingen absolutte stier), ha `mise.toml` med bygge- og sjekkoppgaver, og hemmeligheter bare fra miljøet.
