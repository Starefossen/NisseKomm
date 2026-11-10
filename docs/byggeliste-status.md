# Byggeliste 2026: status

Sjekket mot koden 10. november (gren `fix/byggeliste`). Kilder: `storyboard-2026.md` §5 og «Avgjort», `gaater-2026.md` «Til byggelisten». `mise run test:gjennomspilling`: 24/24 dager OK.

Status: **ferdig**, **delvis**, **mangler**, **utenfor** (media-produksjon, utrulling eller annet repo).

## Storyboard §5

| #       | Status  | Bevis / merknad                                                                                                                   |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| V1, V3  | ferdig  | `src/data/julius_videoer.json:3` (`transkripsjon`), `src/data/uke1_oppdrag.json:28` (`julius_ps`)                                 |
| V2      | utenfor | Videoproduksjon (steg 4)                                                                                                          |
| V4      | ferdig  | `src/components/modules/JuliusVideo.tsx:17`                                                                                       |
| V5      | ferdig  | `src/app/page.tsx:210` (autoåpning når video ikke er sett)                                                                        |
| V6      | ferdig  | `src/components/windows/Dagbok.tsx:4` (videoarkiv)                                                                                |
| R1      | ferdig  | Manus låst i steg 2                                                                                                               |
| R2, R3  | utenfor | Lydproduksjon / Morgenrådet                                                                                                       |
| F1      | ferdig  | `src/data/uke1_oppdrag.json:6`                                                                                                    |
| F2–F4   | ferdig  | `src/app/nissemor-guide/printout/filer.ts:16` (`dag06-silhuetter`) og resten av registeret                                        |
| F5      | ferdig  | `src/app/nissemor-guide/handleliste/page.tsx`                                                                                     |
| F6      | ferdig  | `src/app/nissemor-guide/printout/page.tsx:199`, `printout/diplom/`                                                                |
| F7      | ferdig  | `src/app/nissemor-guide/printout/filer.ts:3-4` (runetavle, runer-fasit), `src/components/ui/Frostrune.tsx`                        |
| F8      | ferdig  | `src/app/nissemor-guide/printout/filer.ts:29` (`dag17-baandkort`) m.fl.                                                           |
| E1      | ferdig  | `src/data/uke1_oppdrag.json:5`; dag 5 uten `VMSJLFO`; dag 19 `src/data/uke4_oppdrag.json:5`                                       |
| E2      | ferdig  | `src/data/uke3_oppdrag.json:119` (`LYKT2026`)                                                                                     |
| N1      | ferdig  | `src/data/statisk_innhold.json:245,261,269`; åpner morgenen på sin dag via `afterDay` (`src/lib/game-engine.ts:792`)              |
| N2, N3  | ferdig  | `src/data/statisk_innhold.json:321` (stjernetegn, varde 5), `:351` (margnotat 2-5-7), `:331` (runelinje)                          |
| N4      | ferdig  | `src/data/statisk_innhold.json:204` (orakelets-rapport) m.fl.; `magisk-sekk-test` er `feilrapport-uke-1.txt`                      |
| N5, N6  | ferdig  | Ingen av de slettede filnavnene eller toppmerkene finnes i `src/data`                                                             |
| T1–T11  | delvis  | Kanalkart og hendelser i `src/components/windows/snofall-tv/channels.ts:40,99-103`; loops mangler som media. Eier: TV-agenten     |
| T12     | delvis  | `src/components/ui/Frostrune.tsx:46`; runelinjer i data. Eier: T12/T14-agenten                                                    |
| T13     | ferdig  | `src/components/windows/NisseNetUtforsker.tsx:163`                                                                                |
| T14     | delvis  | Eier: T12/T14-agenten                                                                                                             |
| M1      | ferdig  | `src/components/windows/NisseMusikk.tsx:169` (FROSSET), `:183` (varmekilden); tiner og spiller dag 12: `src/app/page.tsx:110`     |
| B1, B2  | ferdig  | `src/components/windows/Brevfugler.tsx:14`; brev lagres `src/lib/storage.ts:776` og synkes `src/lib/db.ts:16`                     |
| S1      | ferdig  | `src/data/uke1_oppdrag.json:74,106`; morgenåpning `src/lib/game-engine.ts:479`                                                    |
| G1      | ferdig  | `src/components/ui/GrandFinaleModal.tsx:14`                                                                                       |
| K1      | ferdig  | `src/data/uke2_oppdrag.json:182`; krypto dag 12/18/23: `uke2:177`, `uke3:185`, `uke4:153`; symbolkort dag 3,6,9,12,15,18,20,22,23 |
| K2      | ferdig  | `src/lib/game-engine.ts:447`, test `src/lib/__tests__/julius-ps.test.ts`                                                          |
| O1, D1  | ferdig  | `src/components/windows/EventyrOversikt.tsx:64`, `src/data/eventyr.json:4`                                                        |
| D2, D2b | ferdig  | `src/lib/badge-system.ts:107`, `src/components/ui/BadgeRow.tsx:87`                                                                |
| D3      | ferdig  | Frost per dag ligger i `src/lib/frost.ts:8` i stedet for `frost_morgen`/`frost_etter` (bevisst)                                   |
| D3b     | ferdig  | Vaktes av `src/lib/__tests__/kodelekkasje.test.ts`                                                                                |
| D4      | ferdig  | `src/data/statisk_innhold.json:8` (28 varsler); `systemMetrikker` fjernet                                                         |
| D5      | utenfor | iCal er Varden-konfig (H5); titlene ligger i oppdrag-JSON                                                                         |
| H1      | ferdig  | `src/components/modules/SystemStatus.tsx:54`, `src/lib/frost.ts:8`                                                                |
| H2      | ferdig  | `src/lib/frost.ts:65`, `src/app/page.tsx:101`; nordlys dag 17 `src/app/page.tsx:105`                                              |
| H3      | utenfor | MCP (fase 5); home-bridge er slettet                                                                                              |
| H3b     | ferdig  | `src/lib/db.ts:112`, `/api/state`                                                                                                 |
| H4, H5  | utenfor | Annet repo / Varden                                                                                                               |
| C1, C2  | ferdig  | `src/lib/auth.ts:2` (`KID_CODE`); Sanity/Resend borte fra `src`                                                                   |
| C3      | delvis  | `AGENTS.md` oppdatert; `ARCHITECTURE.md` nevner fortsatt Sanity                                                                   |

## gaater-2026 «Til byggelisten»

| Punkt                                 | Status | Bevis                                                  |
| ------------------------------------- | ------ | ------------------------------------------------------ |
| Dag 16 `foreldre_kode` `LYKT2026`     | ferdig | `src/data/uke3_oppdrag.json:119`                       |
| Dag 5 e-post uten chiffer             | ferdig | `src/data/uke1_oppdrag.json` (ingen `VMSJLFO`)         |
| `farge-koder.txt`, `alfabet.txt`      | ferdig | `src/data/statisk_innhold.json:245,261`                |
| Dag 19 «IQ sier: ikke pakk opp bevis» | ferdig | `src/data/uke4_oppdrag.json:5`                         |
| Tegnsett / `transcript_runer`         | delvis | `src/components/ui/Frostrune.tsx:46`; eier T12-agenten |
| Dag 20 `julius_ps_krypto_mangler`     | ferdig | `src/lib/game-engine.ts:447`                           |
| stjernetegn, notatboken, siste side   | ferdig | `src/data/statisk_innhold.json:321,351,331`            |
| `dagens_oppdrag.txt` punkt 5 (tavla)  | ferdig | `src/data/statisk_innhold.json:170`                    |
| JSON-lekkasjer (titler, hint, koder)  | ferdig | `src/lib/__tests__/kodelekkasje.test.ts`               |
