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

## Prioritert liste (oppdateres fortløpende)

Øverst er det som gjøres nå. Ingen frister; rekkefølgen er prioriteten. Nye ideer går til «Senere forbedringer» med mindre de retter noe som er ødelagt.

1. **Julius-manus i ny stemme:** Fable skriver om alle 24 dager; Hans godkjenner dag 1–3, så resten.
2. **Julius dag 1–5 fra `ref-v3`:** venter (se punkt 9).
3. **Feil fra byggelista:** navnevinduet over finalen (dag 22–24) og runelinjen dag 23 i NisseNet (pågår).
4. **Utvidet gjennomspilling:** dekke Julius dag 1, TV-hendelser, musikken dag 12, NisseKrypto, Brevfugler, nordlys, navn, runer og finalen.
5. **Emoji til symboler** (pågår).
6. **Rampenissen-stemme:** nordnorsk, Fenrir, +4 halvtoner (`dag-01-nordnorsk-pitch4.mp3`). Dag 1–3 er laget. Resten venter til Hans har lest manus og hørt det som finnes (gjøres til slutt).
7. **Etterbehandling av media:** musikk og stillbilder (pågår), resten av seksjonen under.
8. **Next.js 16.4.6** når pakken har passert `minimum-release-age`.
9. **Julius-videoer (dag 1–24) til slutt:** Hans leser manus og ser det som finnes før vi lager resten, inkludert brev-innslaget.
10. **Fysisk (Hans):** testutskrifter, sidetall dag 12/15/18, innkjøp, Rampenissens 15 lapper.
11. **Flytting hjem (fase 5)** når Hans opphever pausen.
12. **Generalprøve** på iPad over hjemmenettet, og en siste nullstilling.

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

## Fase 2: Multi-modale utvidelser (avgrenset til det gåtene bruker)

- [x] **Rød-filter dekoderkort:** brukes på dag 10 (SPEKTER, `docs/gaater-2026.md`).
- [x] **Brettede ark:** brukes på dag 14 (ORIGAMI, `docs/gaater-2026.md`).

De andre ideene fra denne fasen er flyttet til «Senere forbedringer (etter sesongen)».

---

## Fase 3: Fysiske forberedelser før 1. desember (Foreldre-sjekkliste)

- [ ] Skriv ut og klipp til de 9 fysiske QR-symbolkortene (Dag 3, 6, 9, 12, 15, 18, 20, 22, 23) via `/nissemor-guide/printout`.
- [ ] Lag "Spøkelses-skanneren" (rød cellofan i pappramme) og gjør klar lommelykt til mørke morgener.
- [ ] Sett opp et fysisk "Operasjonsbrett" (korktavle eller veggplass ved PC-en) der barna kan henge opp symbolkort, brettede blåkopier og løste koder gjennom hele desember.
- [ ] Kjør en rask generalprøve på Dag 1 med `mise run dev:day 1`.

---

## Fase 4: Opprydding og kvalitetssikring før sesongen

- [x] **Bytt ut emoji med ordentlige symboler:** finn all bruk av emoji i appen, foreldreguiden, utskriftene og tekstdataene (`src/`, `src/data/*.json`), og bytt til symboler som passer CRT-stilen (pixel-ikoner/SVG i samme stil eller Unicode-tegn som VT323 kan vise). Gjelder også ❄ på bokstavkortene. Test på iPad.
- [ ] **Finn foreldreløs kode:** Kartlegg komponenter, moduler, systemer, generatorer, API-ruter og JSON-felt som ikke lenger brukes etter at historien for 2026 er låst (for eksempel eventyr-logikk for flere parallelle historier, fjernede merker og lys/webhook-delene i `/api/home-bridge` som ikke har motpart i Varden).
- [ ] **Slett det som er dødt:** Fjern ubrukt kode og data i stedet for å kommentere det ut. Oppdater tester og dokumentasjon (AGENTS.md, ARCHITECTURE.md, IMPLEMENTATION.md) så de stemmer med koden.
- [ ] **Verifiser hele sesongen:** Kjør `pnpm check` og gå gjennom alle 24 dager med `mise run dev:day <dag>` for å bekrefte at alt fungerer som forventet.
- [x] **knip:** Ekskluder `.claude/` så agent-worktrees ikke gir falske treff i `pnpm check`.
- [x] **Next.js-sikkerhetsfiks:** Oppgrader `next` og `eslint-config-next` til 16.4.6 når pakken har passert `minimum-release-age` (worktree og gren `chore/nextjs-security-upgrade` finnes).
- [ ] **Videostørrelse:** Komprimer Julius-videoene hardere (mål: 8–12 MB per innslag; dag 1-testen ble 28 MB for 47 s).

---

## Neste kodeoppgaver (lokalt, 10. november)

- [x] **Varslingssystem** (`src/lib/notify`, `/api/varsler`): et lite system for utgående varsler med kanaler som kan slås av og på (e-post til foreldre, Varden/iMessage, Skjerm-kort, radio). Ingen kanal aktiv nå; e-post kan legges til igjen senere.
- [x] **MCP-server** på `/mcp` (`src/lib/mcp`), testet uten Kanidm (lokal nøkkel). Kobling til Kanidm og VKS gjenstår ved utrulling (se fase 5).
- [x] **Simulering** (`window.nissekomm.sim`, `src/lib/simulation.ts`): utvid Tidsmaskin til et simuleringspanel i foreldreguiden: hopp til dag og klokkeslett, løs dager automatisk opp til en dag, sett frost, nullstill, og spol en hel uke.
- [x] **Designrevisjon:** alternativ B «Kontrollrommet i Snøfall», P0–P2 bygget (`docs/design-revisjon-2026.md`).

- [ ] **MCP-API v1 for hjemmet (avtalt med Varden 10. november, Starefossen/homelab#22, bygges når integrasjon gjenopptas):** `get_screen` (Skjerm: dører, dagens tittel og teaser fra 06:00, Frostgrad, Kulde-navn, merker, Rampenissen sett etter 09/10, frost, gråtone, TV-variant og hendelse; `events[]` er tom når tilstanden ikke er `rolig`, `next_change_at`), `get_clips(date)` (radio: lyd-URL, varighet, sha256, ferdig innen 05:30), `get_kid_context` (Varden: alt barna har låst opp, altså fremdrift, e-post, transkripsjon og PS for løste dager (dagens e-post og transkripsjon, og alle filer og symboler dagens gåte bruker uansett når de ble åpnet, først når dagens kode er løst; filene merkes med hvilke dager de er gåtebiter for; det samme gjelder eldre e-post, transkripsjoner og PS som er biter i dagens gåte; en test sjekker hver dag 1–24 mot bitlisten i `docs/gaater-2026.md`), åpne NisseNet-filer og symboler; uopptjente koder sensureres, ingen foreldredata, pluss en fast `guidance` om aldri å gi svaret, returnert ordrett; sensurerte biter vises som «[skjult]» (dagens kode bruker «[…]», byttes); Varden kjører adversariale barneprompter med krav om null lekkasjer før skillen slås på; Hans 10. november), foreldreverktøy (`give_hint`, `set_frost`, `skip_day`, `reset`, `set_fake_now` som bare gjelder svar til operatøren, utløper etter 24 timer og logges, pluss `preview_screen(as_caller)` for å se Skjerms visning). Alle svar har `schema_version: 1`, tid i Europe/Oslo og er under 16 KB. Medie-URL-er har sterk ETag og Range.
- [ ] **`get_letters` i MCP (når MCP-API-et bygges):** lesetilgang for foreldretoken til barnas brev til Julius (navn, dato, tekst). Ingen tilgang for Varden eller lesetoken.
- [ ] **Skjerm-tekster (venter på integrasjon):** skriv `skjerm_teaser` (én linje lore per dag, ingen bokstaver, tall eller steder) for 24 dager, og en `get_screen`-variant i MCP for familieskjermen.

## Systematisk kvalitetsgjennomgang (ikke nye funksjoner)

Hvert delsystem gjennomgås for seg: integrasjon med resten, design, kodekvalitet og tester. Fremgangsmåte per delsystem: gjennomgang med funn (fil:linje) → rettinger → tester → `pnpm check` og gjennomspilling av alle 24 dager. Ingen nye funksjoner; bare det vi har, skal virke som en helhet.

- [x] Symbolskanner og symbolkort (10. november)
- [x] GameEngine og spilltilstand (10. november)
- [x] Lagring og synk (StorageManager, ServerSyncAdapter, /api/state, Postgres) (10. november)
- [x] Dato og tid (date-utils, Tidsmaskin, simulering, `day-offset`) (10. november)
- [x] Innlogging og moduser (auth, `NISSEKOMM_MODE`, proxy) (10. november)
- [x] KodeTerminal og bonuskoder
- [x] NisseMail og varsler
- [x] Dagbok og Julius-video (JuliusVideo, sett-status, transkripsjon, PS)
- [x] Kalender
- [x] Snøfall TV og LiveCam (kanaler, loops, effekter, hendelser)
- [x] NisseMusikk (10. november)
- [x] Brevfugler og brev til Julius (10. november)
- [x] NisseKrypto og dekrypteringene
- [x] NisseNet-utforsker og filer
- [x] Eventyr, milepæler, merker og finale (10. november)
- [x] Frost, Frostgrad og frostmodus
- [x] Frostrunene og runetavla (10. november)
- [x] Dag 1-oppstart og 85,0-halen
- [x] Foreldreguiden (I kveld, Forberedelser, Dag for dag, Innstillinger, simulering)
- [x] Utskrifter
- [x] Mediebibliotek og opplasting (10. november)
- [x] Varslingssystem (10. november)
- [x] MCP-server
- [x] Testoppsett og gjennomspilling

- [ ] **Småfeil i medieverktøyene (fra agy-gjennomgang 10. november):** `rampenissen-tts.sh` tåler ikke `--force` først; `tv-loops.sh` ser bare `--force` som første argument; `inventar.py --media` uten verdi krasjer; `medie.py` lagrer hash av tom tekst når en manusdel mangler (bør feile); override-nøkkelen treffer ikke når filen ligger utenfor `public/`; `tv-loops.sh:9` lager aldri utdaterte loops på nytt (`pipefail` + `!` snur statusen); `medie.py` uten argumenter krasjer; `medie.py:62` (dag 24) stopper ikke før filslutt, bør stoppe ved neste `## `; `julius-dag.py` behandler dagsgrensen hos Gemini («200 requests per day») som en kort 429 og venter i timevis, bør avbryte med en tydelig melding; `scripts/oppdrag-innhold.py` skriver over `statisk_innhold.json` og mister runelinjene (`ᚱ:`), så den filen redigeres for hånd til skriptet er rettet. Rettes når genereringen av dag 1–5 er ferdig.

## Senere forbedringer (etter sesongen)

- [ ] **Hullkort / sjablongkort:** kort med utklippede vinduer som legges over en side i en fysisk bok.
- [ ] **1:1 skjermkalkeringskart:** bakepapir med registreringsmerker som holdes mot CRT-skjermen i Snøfall TV, med en kalibreringsknapp (`[KALIBRER SKJERMKART]`) som viser hjørnekors.
- [ ] **Utgående webhook ved kodeinnlevering og frekvenslås (90,0 MHz):** lamper som blinker gull, og en kort radioskurring på kjøkkenhøyttaleren. Hører til Varden-integrasjonen.
- [ ] **Morgenindikator i gangen:** én lampe lyser isblått kl. 06:45 til dagens kode er løst. Hører til Varden-integrasjonen.
- [ ] **Akustisk morsefyr i Snøfall TV:** kort tonesekvens (Web Audio) på en skjult frekvens, som matcher fysiske banketegn.
- [ ] **Portkamera for figurer:** et eget, nærmere kamera i gateplan ved porten, så Julius, IQ, Nissemor, Winter og reinsdyrene kan gjøre entré i riktig størrelse. Krever nytt referansebilde og et kamerabytte i Snøfall TV.
- [ ] **Lengre hendelser:** når videomodellen tillater mer enn 10 sekunder med låst første og siste bilde, kan figurene gå helt inn på torget.
- [ ] **Flere tilfeldige hendelser og tid på døgnet** for Skjerm (morgen, dag, Lucia, blå brevfugl), jf. avtalen med Varden.
- [ ] **TypeScript 7** når typescript-eslint støtter det.

## Brevfugler (besluttet 10. november)

- [ ] **Julius leser et brev:** Hans velger et av barnas brev i foreldreguiden. Innslaget (sitat og Julius' svar) skrives inn i én av videoene for dag 20–23 og lages med `assets/bin/julius-dag.py` sammen med dag 13–24. Barna får en oppfordring tidlig i desember om å skrive (Rampenissen eller Julius), så brevene finnes før ca. 18. desember.
- [ ] **Visuell oppfriskning av Brevfugler:** plan for radar og oppsett som gjør vinduet lettere å forstå og bruke for barna (Kristian 12, Håkon 9, Hanna 5). Plan først, så bygging etter godkjenning.

## Etterbehandling av media før publisering

- [ ] **Julius-videoer (pågår, annen agent komprimerer nå):** komprimer til 8–12 MB per innslag (H.264, faststart) og sjekk at lyd og bilde er i synk. Lag plakatbilde `dag-NN.jpg` (bilde ved 3 s) ved siden av hver mp4. Plakatbildet lages på nytt når en video byttes, også i `assets/bin/julius-dag.py --upload`.
- [ ] **Snøfall TV-loops og hendelser:** komprimer uten å ødelegge loopen (samme lengde, første og siste bilde med SSIM ≥ 0,97 mot `nokkelramme-rolig.jpg`). Ingen lydspor.
- [ ] **Rampenissen-lyd:** normaliser lydstyrken (EBU R128, -16 LUFS), samme tonehøyde og dialekt på alle 24, MP3 128k mono.
- [x] **Musikk (NisseMusikk):** normaliser lydstyrken og sjekk at alle spor i manifestet finnes.
- [x] **Stillbilder og bilder i `public/`:** komprimer (JPEG/WebP), bruk riktig størrelse for visning og fjern ubrukte filer. Gjort: logo.png 1024 til 512 px. Feed-PNG-ene (1,5-3 MB) er fullskjermsbakgrunner og beholdt; JPEG ville gitt ca. 10x, men krever endret sti i kode og manifest. Ubrukte kandidater: `assets/out/ubrukte-bilder-public.txt`.
- [ ] **Utskrifter:** testskriv ut dag 10, 12 og 14 (rødfilter, tosidig, brettark). Bekreft sidetallet mot tabellen i `docs/gaater-2026.md` (dag 12 er tredelt, dag 15 og 18 gir 2 sider). Hans avgjør etter test-printen om det skal være 1 eller 2 ark.
- [ ] **Mediebiblioteket:** last alt opp til PVC-en (`MEDIA_DIR`) med riktige stier. Kontroller manifestet, at hver fil svarer 200/206 med Range, og at ingen mediefil ligger i git.
- [ ] **Sluttsjekk:** gjennomspilling på iPad (Safari) over hjemmenettet med de komprimerte filene.

## Fase 5: Flytt til hjemmeklyngen (krav fra Varden, Starefossen/homelab#22)

Varden eier hjemmesiden i `starefossen/home` (Knative-tjeneste, `minScale=maxScale=1` 1. desember–6. januar, 200Mi/512Mi, PostgreSQL (CloudNativePG), CiliumNetworkPolicy, Secret). NisseKomm-repoet er vårt. Varden rører det ikke.

- [x] **Kjøring:** `output: "standalone"` i `next.config`, lytt på `$PORT` (standard 8080), bind `0.0.0.0`.
- [x] **Dockerfile:** flertrinns på `node:24-alpine`, ikke-root, multi-arch (amd64 påkrevd). Push til `registry.intern.flaatten.org:5000/nissekomm:<unix-ts>` med en mise-oppgave.
- [ ] **Media i imaget:** `public/` bakes inn (Next støtter Range-forespørsler, som Safari trenger for video).
- [x] **Lagring:** PostgreSQL i Varden-klyngen (CloudNativePG), tilkobling fra `DATABASE_URL`. Ingen PVC for appen, så den kan skalere til null og skaleres uavhengig av databasen. Bruk en ren JS-klient (`pg`).
  - Egen CNPG-klynge `nissekomm-db` (1 instans, 1Gi, PG 17) i navnerommet `nissekomm`. `DATABASE_URL` kommer fra den genererte hemmeligheten `nissekomm-db-app` (nøkkel `uri`, vert `nissekomm-db-rw.nissekomm.svc`, ingen TLS-krav i klyngen).
  - Migreringer kjøres ved oppstart og må tåle å kjøres flere ganger. Liten tilkoblingspool (maks 5). `/api/health` rører ikke databasen.
- [x] **Helse:** `GET /api/health` gir 200 uten autentisering og uten tung IO.
- [x] **Fjern:** `@sanity/*`, Sanity Studio og migreringer, `resend` og e-postskript, Vercel-cron og `vercel.json`, `@vercel/analytics`. Null utgående trafikk i kjøring.
- [x] **Én familie:** barnekode og foreldrekode fra miljøet (`KID_CODE`, `PARENT_CODE`). Ingen registrering, gjenoppretting eller avmelding.
- [x] **Hjemmeintegrasjon via MCP** (koden er ferdig; Kanidm-oppsett mot VKS gjenstår ved utrulling) (erstatter REST-endepunktene; bekreftet av Hans 10. november): MCP-server på `/mcp` (Streamable HTTP, `@modelcontextprotocol/sdk`), bare på hjemmenettet. `api/home-bridge` fjernes.
  - Autentisering: `Authorization: Bearer` med Kanidm-JWT, validert med `jose` mot JWKS fra `https://id.flaatten.org/oauth2/openid/mcp`, audience `mcp`, scope `groups`. Ingen token i URL.
  - Nivå `read` (barnesikkert): `get_state`, `get_clips(date)`, `get_today_quest`, `get_progress`. Aldri koder, svar, `hint` eller fremtidige dager; filtreres på serveren, med test som sjekker svarene mot alle 24 koder.
  - Nivå `parent`: `give_hint(day)`, `set_frost(active, until)`, `reset`/`skip_day`. Varden, radio-produsent og Skjerm får bare `read`. `parent` bare for operatør og en egen foreldreidentitet. Ingen verktøy som gir fasit.
  - Lyd serveres med HTTP GET og samme Bearer.
  - Krever adversarial gjennomgang av en annen modell før merge (autentisering).
- [ ] **Bygg:** produksjonsbygg setter ikke `NEXT_PUBLIC_MOCK_*`, `TEST_MODE` eller `STORAGE_BACKEND` (de bakes inn ved bygging).
- [x] **Sikkerhetshoder:** ta med `Permissions-Policy: camera=(self)` så symbolskanneren virker.
- [x] **Sikkerhetshoder (opprinnelig punkt):** flytt fra `vercel.json` til `headers()` i `next.config`.
- [ ] **Miljø:** `PORT`, `DATABASE_URL`, `KID_CODE`, `PARENT_CODE`, `HOME_STATE_TOKEN`, `NEXT_PUBLIC_URL=https://nissekomm.nissekomm.fn.flaatten.org`.
- [ ] **Flytt kildekoden til `starefossen/home`:** Etter at `feat/season-2026` er merget og ingen agenter jobber, flyttes repoet inn som `apps/nissekomm` med `git subtree` (historikken beholdes), og dette repoet arkiveres. Hold bygge- og utrullingsoppsett relativt til repoet (ingen absolutte stier), ha `mise.toml` med bygge- og sjekkoppgaver, og hemmeligheter bare fra miljøet.
