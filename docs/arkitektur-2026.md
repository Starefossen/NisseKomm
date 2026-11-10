# NisseKomm 2026 – arkitektur og kodeinventar

Kartlagt 10. november 2026 på `feat/season-2026` (f134f2d): uke 1, frost/runer og Snøfall TV er merget. `feat/kode-innhold` (dag 8–24, ett eventyr, tre merker, finale) er ikke merget. Det som står under «venter på kode-innhold» kan derfor endre seg. Kilder: `docs/historie-2026.md`, `docs/storyboard-2026.md` (§1 flateoversikt, §5 byggeliste), `docs/gaater-2026.md`, `docs/manus/`, `todo.md`, `AGENTS.md`, `ARCHITECTURE.md`. Ingen kode er endret.

Status: **behold**, **endre**, **fjern**, **ny**.

---

## 1. Kart over systemet slik det er nå

### Lag

| Lag             | Filer                                                                                                                                               | Rolle                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App-skall       | `src/app/layout.tsx`, `src/app/page.tsx` (549 linjer)                                                                                               | Boot → passord → skrivebord. Ikoner, ett åpent vindu om gangen (`openWindow`), sidepanel, frostmodus, autoåpning av Dagbok, finale og navneregistrering.                          |
| Vinduer         | `src/components/windows/*` (14 stk.) og `snofall-tv/`                                                                                               | NisseMail, KodeTerminal, NisseNet, Kalender, Dagbok, Snøfall TV, RuneTavle, EventyrOversikt, og de låsbare NisseKrypto, SymbolScanner, NisseMusikk, Brevfugler, NisseStats.       |
| Moduler         | `src/components/modules/`                                                                                                                           | `JuliusVideo`, `SystemStatus` (Frostgraden), `VarselKonsoll` (dagsvarsler).                                                                                                       |
| UI              | `src/components/ui/`                                                                                                                                | `RetroWindow`, `BootSequence`, `PasswordPrompt`, `Tidsmaskin`, `GrandFinaleModal`, `NameEntryModal`, `BadgeRow`, `Frostrune` m.fl.                                                |
| Fasade          | `src/lib/game-engine.ts` (1 813 linjer)                                                                                                             | Eneste inngang til spilltilstand. Pakker inn `StorageManager`, `frost.ts`, `badge-system.ts`, `systems/symbol-system.ts`, `eventyr.ts`, `oppdrag.ts`, generatorer og validatorer. |
| Rene regler     | `src/lib/frost.ts`, `src/lib/date-utils.ts`                                                                                                         | Frosttabell og frostmodus; dato med Tidsmaskin og `NEXT_PUBLIC_MOCK_*`.                                                                                                           |
| Lagring         | `src/lib/storage.ts` (`StorageManager`), `src/lib/storage-adapter.ts` (`LocalStorageAdapter`, `SanityStorageAdapter`), `src/lib/session-manager.ts` | Nøkkel/verdi med minnebuffer; backend velges av `NEXT_PUBLIC_STORAGE_BACKEND`.                                                                                                    |
| Data            | `src/data/uke1–4_oppdrag.json`, `eventyr.json`, `merker.json`, `statisk_innhold.json`, `julius_videoer.json`, `archive/2025/`                       | Innhold. `oppdrag.ts`/`data-loader.ts` laster og validerer.                                                                                                                       |
| Generatorer     | `src/lib/generators/alert-generator.ts`, `utils/metric-calculator.ts`, `template-resolver.ts`, `code-generator.ts`                                  | Varsler, metrikker, maler i tekst, familiekoder.                                                                                                                                  |
| API             | `src/app/api/{auth,family,session,settings,unsubscribe,cron,home-bridge}`                                                                           | Flerbruker (Sanity, Resend) og ett hjemmeendepunkt.                                                                                                                               |
| Nissemor-guiden | `src/app/nissemor-guide/*` (14 sider), `src/components/nissemor/*`                                                                                  | Foreldreside: dagplan, bonus, merker, symboler, eventyr, handleliste, utskrifter (`printout`, `printout/runer`), innstillinger, utvikling.                                        |
| Andre sider     | `src/app/snill-liste/page.tsx`, `src/app/dev/livecam/page.tsx`                                                                                      | Familieregistrering og gjenoppretting; utviklerside for LiveCam.                                                                                                                  |
| Media og skript | `assets/` (kilde), `public/video/julius/dag-NN.mp4`, `public/video/tv/`, `public/music/`, `scripts/`                                                | `julius-transcripts.py`, `manus-check.py` (2026); `send-*-emails.ts`, `leaderboard.ts`, `cleanup-test-sessions.ts` (2025/Sanity).                                                 |
| Drift           | `vercel.json` (cron og sikkerhetshoder), `sanity.config.ts`, `sanity/`, `migrations/`, `mise.toml`, `knip.json`                                     | Vercel- og Sanity-oppsett.                                                                                                                                                        |

### Avhengigheter

```mermaid
flowchart TD
  Page[app/page.tsx] --> Win[windows/*]
  Page --> Side[SystemStatus · VarselKonsoll]
  Page --> Ctx[app-context.tsx]
  Win --> GE[GameEngine]
  Side --> GE
  Guide[nissemor-guide/*] --> GE
  Guide --> SM
  GE --> Frost[frost.ts]
  GE --> Badge[badge-system.ts]
  GE --> Sym[symbol-system.ts]
  GE --> Ev[eventyr.ts]
  GE --> Gen[alert-generator · metric-calculator]
  GE --> SM[StorageManager]
  GE --> Data[(src/data/*.json)]
  SM --> LS[LocalStorageAdapter]
  SM -.-> SA[SanityStorageAdapter]
  SA -.-> ApiS[/api/session/*]
  Ctx -.-> ApiF[/api/family]
  Prompt[PasswordPrompt · GuideAuth] -.-> ApiA[/api/auth/*]
  ApiA -.-> Sanity[(Sanity)]
  ApiS -.-> Sanity
  Snill[/snill-liste] -.-> ApiA
  Cron[/api/cron] -.-> Resend[(Resend)]
  KT[KodeTerminal] -.-> HB[/api/home-bridge POST] -.-> Hooks[SKJERM/FLEET webhooks]
  Dates[date-utils + Tidsmaskin] --> GE
```

Stiplede linjer er flerbruker- eller utgående trafikk som fase 5 fjerner.

---

## 2. Del for del: i dag, behov i 2026, status

| Del                                  | I dag (bevis)                                                                                                                                                                                                           | 2026 trenger                                                                                                                     | Status                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Skrivebord og vindusmodell           | Ett vindu om gangen, `openWindow` (`page.tsx:79`). Faste ikoner + låsbare i rekkefølge (`page.tsx:345–410`).                                                                                                            | Samme.                                                                                                                           | behold                                |
| Modulopplåsing                       | `reveals.modules` låses opp når dagen løses (`game-engine.ts:573–600`) eller dagen etter (`game-engine.ts:477–491`, `quest.dag < currentDay`).                                                                          | Datoåpning: NisseMusikk dag 7, NisseKrypto dag 4, SymbolScanner dag 3, Brevfugler dag 14, NisseStats dag 16 (storyboard §1, S1). | endre (se gap 1)                      |
| Dagbok/JuliusVideo                   | Videoarkiv, dagens video øverst (`Dagbok.tsx:15–50`), sett-flagg i GameEngine (`game-engine.ts:371–378`), autoåpning (`page.tsx:193–203`), rød prikk (`app-context.tsx:117`).                                           | V4–V6.                                                                                                                           | behold (ferdig)                       |
| Snøfall TV                           | 187 linjer + `channels.ts`, `LiveCam.tsx`, `MiniGames.tsx`. K3 = `JuliusVideo` (`SnøfallTV.tsx:98`), frost leses én gang ved montering (`SnøfallTV.tsx:49`).                                                            | T1–T14. Frost må følge Frostgraden når koden løses mens TV er åpen.                                                              | behold, liten endring                 |
| Frost                                | `frost.ts`: tabell dag 7–24, modus 1/2 dag 10/21, nødstopp 20:00, åpne vinduer på nivå 2 (`frost.ts:89–93`). «Frost av» i `GuideSettings.tsx`.                                                                          | H1, H2. GET-endepunkt for Skjerm (H3) mangler.                                                                                   | behold; endepunkt **ny**              |
| Sidepanel                            | `SystemStatus.tsx:13–16` bare Frostgraden. `VarselKonsoll` viser `daily_alerts`.                                                                                                                                        | Bare Frostgraden; varsler uten kodeord (D4).                                                                                     | endre (varsler)                       |
| KodeTerminal                         | Validerer, kaller `POST /api/home-bridge` med koden i klartekst (`KodeTerminal.tsx:137–145`).                                                                                                                           | Ingen utgående kall (H3).                                                                                                        | endre                                 |
| NisseNet                             | Filtre i `statisk_innhold.json:173`. Fortsatt 2025-filer med fasit (se gap 4).                                                                                                                                          | N1–N6.                                                                                                                           | endre (venter delvis på kode-innhold) |
| NisseMusikk                          | Hardkodet «DEL 2: O - D - I» (`NisseMusikk.tsx:412`).                                                                                                                                                                   | M1.                                                                                                                              | endre                                 |
| Brevfugler                           | «KRYPTERING: O-R-I-G-A-M-I» (`Brevfugler.tsx:236`), faseliste fra `getBrevfuglerFremdrift` (`game-engine.ts:1344`).                                                                                                     | B1, B2.                                                                                                                          | endre                                 |
| NisseKrypto + symboler               | `validateDecryptionSequence` (`game-engine.ts:604`), `decryption_challenge` dag 12/18/23, `symbol_clue` dag 3, 6, 9, 12, 15, 18, 20, 22, 23.                                                                            | Uendret mekanikk; Varmebærer ved krypto 1 (K1), betinget PS (K2).                                                                | behold + endre                        |
| EventyrOversikt, Kalender, NisseMail | Ni eventyr-ID-er (`eventyr.json`), kamerametadata per ID (`eventyr.ts:254–329`) brukt i `Kalender.tsx:225`, `NisseMail.tsx:616`, `EventyrOversikt.tsx:144`.                                                             | Én ID `spokelseskoden`, seks milepæler (D1, O1).                                                                                 | endre (venter på kode-innhold)        |
| Merker                               | Sju merker (`merker.json`), vilkår bonus/eventyr/alle-krypto/alle-symboler/alle-dager (`badge-system.ts:109–133`).                                                                                                      | Tre merker, `decryptionSolved`, `dayCompleted` (D2, D2b).                                                                        | endre (venter på kode-innhold)        |
| Finale                               | `GrandFinaleModal` itererer eventyr (`getCompletedEventyr`, `getTotalEventyr`).                                                                                                                                         | G1.                                                                                                                              | endre (venter på kode-innhold)        |
| Tid                                  | `date-utils.ts:59–85`: Tidsmaskin (localStorage) før `NEXT_PUBLIC_MOCK_*`. Tidsmaskin av i produksjon uten `TEST_MODE` (`date-utils.ts:29–34`).                                                                         | Samme. Prod-bygg uten `MOCK_*`/`TEST_MODE` (fase 5).                                                                             | behold                                |
| StorageManager                       | Fasade over adapter; Sanity-gren (`storage.ts:118`, `storage-adapter.ts:114–690`).                                                                                                                                      | Postgres på server for løste dager, bonus og video-sett (fase 5, H3b). localStorage kan være klientbuffer.                       | endre                                 |
| Innlogging                           | `PasswordPrompt` → `/api/auth/login` (Sanity-oppslag `login/route.ts:67–73`). `GuideAuth` → `/api/auth/verify`.                                                                                                         | Passordskjerm som fiksjon; `KID_CODE`/`PARENT_CODE` fra miljøet.                                                                 | endre                                 |
| Flerbruker-API                       | `auth/{family,login,recover,register,share-key-required,verify}`, `family`, `session/{,friends,kid-code,sync}`, `settings/*`, `unsubscribe`, `cron`.                                                                    | Ingenting.                                                                                                                       | fjern                                 |
| `home-bridge`                        | Bare POST, videresender kode til `SKJERM_WEBHOOK_URL`/`FLEET_WEBHOOK_URL` (`home-bridge/route.ts:10–30`). Utviklersiden lenker til GET som ikke finnes (`utvikling/page.tsx:145–158`).                                  | Erstattes av MCP på `/mcp` (fase 5).                                                                                             | fjern                                 |
| Helse                                | Finnes ikke.                                                                                                                                                                                                            | `GET /api/health`.                                                                                                               | ny                                    |
| MCP                                  | Finnes ikke.                                                                                                                                                                                                            | `/mcp`, Kanidm-JWT, nivå `read`/`parent`.                                                                                        | ny                                    |
| Nissemor-guiden                      | 14 sider. `innstillinger` og `snill-liste` er familiekonto; `eventyr` og `merker` er 2025-modell; `utvikling` låser opp `SNØFALL_TV` og `EVENTYR_OVERSIKT` som ikke finnes i ikonlisten (`utvikling/page.tsx:182–187`). | Frost av (finnes), scenariovelger, «marker video som sett», diplom «Snøfalls venn», rampestrek-felt.                             | endre                                 |
| Utskrifter                           | `printout/page.tsx` (677), `printout/runer/page.tsx`.                                                                                                                                                                   | F2, F4, F6–F8.                                                                                                                   | endre                                 |
| Analyse                              | `@vercel/analytics` i `layout.tsx`, `lib/analytics.ts`.                                                                                                                                                                 | Null utgående trafikk.                                                                                                           | fjern                                 |
| Drift                                | `vercel.json`, Sanity Studio, `migrations/`.                                                                                                                                                                            | Dockerfile, `output: "standalone"`, hoder i `next.config`.                                                                       | fjern + ny                            |

---

## 3. Død og foreldreløs kode

`knip` (`pnpm exec knip`, 10. nov) melder **ingen** ubrukte filer eller eksporter: alt under er fortsatt importert. Det er foreldreløst mot historien, ikke mot importgrafen. Telling: **48 punkter**.

### Flerbruker, Sanity, Resend, Vercel (fjernes i fase 5) – 34

- API-ruter (16): `api/auth/{family,login,recover,register,share-key-required,verify}`, `api/family`, `api/session`, `api/session/{friends,kid-code,sync}`, `api/settings/{delete-account,email-subscription}`, `api/unsubscribe`, `api/cron/send-daily-emails`, `api/home-bridge`. Testene under `__tests__` følger med.
- Bibliotek (7): `lib/sanity-client.ts`, `lib/session-manager.ts`, `lib/email-service.ts`, `lib/code-generator.ts`, `lib/api-utils.ts`, `lib/password-utils.ts`, `lib/analytics.ts` (+ `__mocks__/@vercel/analytics.ts`, `__mocks__/uuid.ts`). `SanityStorageAdapter` i `storage-adapter.ts:114–690`.
- Sider (2): `app/snill-liste/page.tsx` (er familieregistrering og gjenoppretting, ikke Snill-listen i historien), familiedelen av `nissemor-guide/innstillinger/page.tsx` (`/api/auth/family`).
- Skript og oppsett (9): `scripts/send-daily-mission-emails.ts`, `send-welcome-emails.ts`, `leaderboard.ts`, `cleanup-test-sessions.ts`, `migrations/`, `sanity/`, `sanity.config.ts` + `sanity.cli.ts`, `vercel.json`, `test-multi-tenant.sh`.
- Avhengigheter: `@sanity/client`, `@sanity/vision`, `sanity`, `styled-components` (bare for Studio), `resend`, `@vercel/analytics`, `uuid` (bare API-ruter).

### 2025-spillmodell (fjernes eller skrives om i steg 3) – 14

| Punkt                                                                                                                                                     | Bevis                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GameEngine.getEventyrMetrikker` – ingen kallere                                                                                                          | `game-engine.ts:1186`                                  |
| `GameEngine.getEventyrMusikkSpor` – ingen kallere                                                                                                         | `game-engine.ts:1386`                                  |
| `getCurrentSystemMetrics`/`getProgressiveMetrics`/`getMetricValue` + `systemMetrikker` i JSON + `metric-calculator.ts` – brukes bare av Brevfugler-fasene | `game-engine.ts:1071–1380`, `statisk_innhold.json:428` |
| `getBrevfuglerFremdrift` – faseliste for `brevfugl-mysteriet` (B1 fjerner)                                                                                | `game-engine.ts:1344`, `Brevfugler.tsx`                |
| Krise-API `getCrisisStatus`/`isCrisisResolved` med «inventory» (D2b)                                                                                      | `storage.ts`, `NisseStats.tsx`, `QuickActions.tsx`     |
| `EVENTYR_CAMERA_FEEDS` per eventyr-ID                                                                                                                     | `eventyr.ts:254–329`                                   |
| `eventyr.json` med ni ID-er, og `eventyr.id` i dag 1–7 peker på fem av dem                                                                                | `eventyr.json`, `uke1_oppdrag.json`                    |
| `getMajorEventyr`/`getMiniEventyr`/`getRewardIcon`/`getParentGuidance` – flertrådsmodell                                                                  | `eventyr.ts:154–227`                                   |
| `reveals.modules: ["SNØFALL_TV"]` dag 10 – TV-ikonet er alltid synlig, nøkkelen finnes ikke i ikonlisten                                                  | `uke2_oppdrag.json`, `page.tsx:345–410`                |
| `unlockModule("SNØFALL_TV"/"EVENTYR_OVERSIKT")` i utviklersiden                                                                                           | `utvikling/page.tsx:184–187`                           |
| `dagbokinnlegg`, `hint`, `hint_type` dag 8–24 (venter på kode-innhold)                                                                                    | `types/innhold.ts:211`, `DayPlanning.tsx:141`          |
| `getDagbokLastRead`/`setDagbokLastRead` beskrevet som i bruk                                                                                              | `ARCHITECTURE.md:167–271`                              |
| `src/data/archive/2025/` – ikke importert noe sted                                                                                                        | grep `archive/2025`                                    |
| Fasit i NisseNet og varsler (se gap 4)                                                                                                                    | `statisk_innhold.json`                                 |

---

## 4. Avvik mellom kode og historie

1. **SymbolScanner åpner aldri.** Ingen dag har `SYMBOLSKANNER` i `reveals.modules` (grep i `src/data`, utenom arkivet). Barna skal skanne grønt hjerte dag 3 (`gaater-2026.md:107`). S1 er ikke gjort, og den ligger i uke 1-data som allerede er merget.
2. **Moduler åpner på løsning eller dagen etter, ikke på dato.** `checkTimedModuleUnlocks` bruker `quest.dag < currentDay` (`game-engine.ts:483`). NisseKrypto (reveal dag 4) og Brevfugler (dag 14) åpner først når dagens kode er inne. Storyboardet sier «åpner dag N». Avklar: før eller etter koden? NisseMusikk dag 7 som «varmekilden» er trolig ment å åpne etter koden; dag 12 «FROSSET» (M1) mangler.
3. **Koden lekker fortsatt ut av huset.** `KodeTerminal.tsx:137–145` poster dagens kode til `/api/home-bridge`, som videresender til webhooks. Strider mot MCP-kravet «aldri koder» og «null utgående trafikk». Utviklersiden lenker til en GET som ikke finnes.
4. **Fasit i UI og data (brikketaket 40 %).** `NisseMusikk.tsx:412` («DEL 2: O - D - I»), `Brevfugler.tsx:236` («O-R-I-G-A-M-I»), ni `daily_alerts` med kodeord (dag 9, 11, 13, 14, 18, 19, 20, 21, 23), NisseNet-filene i N5 (`julesanger-samling.txt`, `lucia_lussekatt_hemmelig.txt`, `julekode_dekoder.txt` m.fl.), og `fysisk_hint`/`rampenissen_rampestrek` dag 8–24 med «DEL 1 + DEL 2»-oppskrift. Data for dag 8–24 venter på kode-innhold; de to komponentlekkasjene og varslene gjør ikke det.
5. **Ett eventyr er ikke innført for dag 1–7.** Merget uke 1 bruker `brevfugl-mysteriet`, `iqs-oppfinnelser`, `frosne-monster`, `juletradisjon`, `morkets-trussel` og ingen på dag 4. D1 krever `spokelseskoden` på alle dager. Kode-innhold-lanen dekker 8–24; dag 1–7 må tas med der eller rett etter.
6. **Frost og Snøfall TV.** TV leser Frostgraden én gang ved montering (`SnøfallTV.tsx:49`). Løses koden mens TV-vinduet er åpent (KodeTerminal er et annet vindu, så sjelden), henger verdien. Viktigere: frostmodus nivå 1 (dag 10) skal gi «spøkelsesbilde på alle kanaler» (storyboard §1) – sjekk at `SnøfallTV` får `getFrostMode()` og ikke bare prosenten.
7. **Tidsmaskin vs. `NEXT_PUBLIC_MOCK_*`.** Tidsmaskin vinner (`date-utils.ts:63`) og har klokkeslett; `MOCK_*` har ikke time, så nødstoppen 20:00 (`frost.ts:61`) kan bare testes med Tidsmaskin. Begge bakes inn ved bygging. Dokumentasjonen (AGENTS.md, ARCHITECTURE.md) nevner bare `MOCK_*`. MCP-verktøyet `skip_day` (fase 5) må virke på serversiden, der Tidsmaskin (localStorage) ikke finnes.
8. **Fremdrift bare i nettleseren.** Video-sett, løste dager og bonus ligger i localStorage. Fase 5 (MCP `get_progress`, frost for Skjerm, PS-varianter) trenger dem på serveren. Storyboardet sier SQLite (H3b, avgjørelse 4); `todo.md` fase 5 sier PostgreSQL. `todo.md` er nyere – oppdater storyboardet.
9. **Frostendepunkt.** Storyboardet H3 vil ha `GET /api/frost`; `todo.md` fase 5 sier at hjemmeintegrasjon går via MCP (`get_state`). Avklar om Skjerm poller MCP eller et eget GET.
10. **Navnekollisjon `/snill-liste`.** Ruten er familieregistrering; Snill-listen i historien er `NameEntryModal` dag 22. Slettes med flerbrukeren.
11. **Dokumentasjon er 2025.** `ARCHITECTURE.md:80` «2 eventyr», `:84` Dagbok som tekst, `:167` dagbok-lesesporing, `:452` Sanity. `AGENTS.md` beskriver familiekoder og Resend. C3.

---

## 5. Anbefalt rekkefølge

Små oppgaver med 1–3 leveranser. Kolonnen «Filer» viser hva som kan kollidere. Oppgaver uten felles filer kan gå i parallell (maks fire samtidig).

### Steg 3 (resten)

| #   | Oppgave                       | Leveranser                                                                                                 | Filer                                                       | Parallell med                   |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| A1  | Datoåpning av moduler         | SymbolScanner dag 3, regel for «dato vs. kode» (gap 2), test                                               | `game-engine.ts` (unlock), `uke1_oppdrag.json`              | A2, A3, A4                      |
| A2  | Lekkasjer i komponenter       | Fjern «DEL 2» i NisseMusikk, «O-R-I-G-A-M-I» i Brevfugler, FROSSET-overlegg dag 12                         | `NisseMusikk.tsx`, `Brevfugler.tsx`                         | A1, A3, A4                      |
| A3  | Fjern home-bridge             | Slett ruten, kallet i KodeTerminal og lenkene i utviklersiden                                              | `api/home-bridge`, `KodeTerminal.tsx`, `utvikling/page.tsx` | A1, A2, A4                      |
| A4  | TV følger frostmodus          | `getFrostMode()` inn i SnøfallTV, oppdatering etter løsning                                                | `SnøfallTV.tsx`, `snofall-tv/channels.ts`                   | A1–A3                           |
| A5  | Rydd 2025-modell i GameEngine | Slett `getEventyrMetrikker`, `getEventyrMusikkSpor`, metrikkene, `metric-calculator.ts`, `systemMetrikker` | `game-engine.ts`, `statisk_innhold.json`                    | Etter kode-innhold (deler JSON) |
| A6  | Eventyr til én ID             | `eventyr.id` dag 1–7, kamerametadata ut av `eventyr.ts`                                                    | `uke1_oppdrag.json`, `eventyr.ts`                           | Etter kode-innhold              |
| A7  | Brevfugler etter B1           | Blå fugl, fryst brev, fjern faseliste og `getBrevfuglerFremdrift`                                          | `Brevfugler.tsx`, `game-engine.ts`                          | Etter A2 og A5                  |
| A8  | Nissemor-guiden               | Scenariovelger, «marker video som sett», diplom «Snøfalls venn»                                            | `nissemor-guide/*`, `printout/page.tsx`                     | A1–A4                           |

Kode-innhold-lanen eier allerede: `uke2–4_oppdrag.json`, `eventyr.json`, `merker.json`, `badge-system.ts`, `GrandFinaleModal.tsx`, `daily_alerts` og NisseNet-filene (D1–D4, N1–N5, G1, K1). Ikke rør disse før den er merget.

### Fase 5

| #   | Oppgave          | Leveranser                                                                                                      | Filer                                                              | Parallell med                          |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| P1  | Slett flerbruker | API-rutene i §3, `sanity*`, `session-manager`, `email-service`, `code-generator`, `/snill-liste`, avhengigheter | `src/app/api/*`, `src/lib/*`, `package.json`                       | P2 (ikke `package.json` samtidig)      |
| P2  | Kjøring og image | `output: "standalone"`, `PORT`/`0.0.0.0`, hoder i `next.config`, Dockerfile, mise-oppgave for push              | `next.config.ts`, `Dockerfile`, `mise.toml`, `vercel.json` (slett) | P1                                     |
| P3  | Én familie       | `KID_CODE`/`PARENT_CODE` i `/api/auth/login` og `verify`, `GET /api/health`                                     | `api/auth/*`, `api/health`                                         | Etter P1                               |
| P4  | Postgres-lager   | `pg`-pool (maks 5), idempotente migreringer ved oppstart, serverlager for løst/bonus/video-sett                 | `src/lib/db.ts`, `storage-adapter.ts`, `storage.ts`                | Etter P1                               |
| P5  | MCP `read`       | `/mcp`, JWT mot Kanidm (`jose`), `get_state`, `get_today_quest`, `get_progress`, test mot alle 24 koder         | `src/app/mcp/*`, `src/lib/mcp/*`                                   | Etter P4                               |
| P6  | MCP `parent`     | `give_hint`, `set_frost`, `reset`/`skip_day`, lyd via GET                                                       | `src/lib/mcp/*`                                                    | Etter P5; adversarial review før merge |
| P7  | Dokumentasjon    | AGENTS.md, ARCHITECTURE.md, IMPLEMENTATION.md etter koden (C3), Tidsmaskin beskrevet                            | `*.md`                                                             | Sist                                   |

Til sammen **15 oppgaver** (8 i steg 3, 7 i fase 5). Første parallelle runde: A1, A2, A3, A4 (+ P1 og P2 når kode-innhold er merget).
