# NisseKomm — Prosjektplan Sesong 2 (2026): Operasjon Spøkelseskode

## Fase 1: Grunnlag, 2026-historie og CRT-moduler (Fullført i PR #9)

- [x] Arkiver 2025-sesongen under `src/data/archive/2025/`
- [x] 24 daglige oppdrag (`uke1_oppdrag.json` til `uke4_oppdrag.json`) med asymmetriske søskenroller (Hanna 6, Håkon 9, Kristian 11)
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

- [ ] **Rød-filter dekoderkort (Dag 1 og utvalgte dager):** Mal for kort med rød støytekst som skjuler blå/cyan kodebokstaver når Hanna (6) ser gjennom et rødt cellofan-filter ("Spøkelses-skanner").
- [ ] **Brett-og-linjer blåkopier (IQs skjemaer):** Utskrivbare ark der halve bokstaver og kretslinjer danner kodeordet først når Håkon (9) bretter arket langs stiplede piler.
- [ ] ** Hullkort / sjablongkort:** Kort med utklippede vinduer som legges over en bestemt side i en fysisk bok i bokhyllen (eller utskrift fra NisseNet) for å isolere passordet.
- [ ] **1:1 Skjerm-kalkeringskart:** Mal tilpasset bakepapir/matpapir med registreringsmerker som holdes direkte mot CRT-skjermen i `SnøfallTV` (CAM 2) for å koble fysiske punkter med lysende skjermkoordinater.

### 2.2 Sanntids smarthus-respons (`varden` / Home Assistant webhook)

- [ ] **Utgående webhook ved kode-innlevering (`KodeTerminal`):** Send umiddelbar POST fra server/klient til lokal `varden`-agent når dagens kode løses, slik at stuelampene blinker gull to ganger og skifter fra kald blå (`4000K`) til varm hvit (`2200K`) innen 2 sekunder.
- [ ] **Utgående webhook ved frekvenslås (`SnøfallTV` på `90.0 MHz`):** Trigger en kort 8-sekunders radioskurring eller lydeffekt på kjøkkenhøyttaleren når Kristian (11) låser inn bærebølgen på `90.0 MHz`.
- [ ] **Morgen-indikator i gangen:** Automatiser i `varden` at én lampe i gangen lyser isblått kl. 06:45 hver morgen frem til dagens kode i NisseKomm er løst (`lightingPreset === "frost_decay"`).

### 2.3 Skjerm- og lyd-interaksjon i appen

- [ ] **Kalibreringsmodus på `SnøfallTV` CAM 2:** Legg til en knapp (`[KALIBRER SKJERMKART]`) som viser faste hjørnekors på CRT-skjermen slik at barna kan legge fysisk matpapir eller hullkort rett på skjermen.
- [ ] **Akustisk rytme-/morse-fyr i `SnøfallTV`:** Bruk Web Audio API (`SoundManager`) til å spille en kort repeterende tone-sekvens når radioen stilles inn på en skjult frekvens, som matcher fysiske banketegn fra Rampenissen.

---

## Fase 3: Fysiske forberedelser før 1. desember (Foreldre-sjekkliste)

- [ ] Skriv ut og klipp til de 9 fysiske QR-symbolkortene (Dag 3, 6, 9, 12, 15, 18, 20, 22, 23) via `/nissemor-guide/printout`.
- [ ] Lag "Spøkelses-skanneren" (rød cellofan i pappramme) og gjør klar lommelykt til mørke morgener.
- [ ] Sett opp et fysisk "Operasjonsbrett" (korktavle eller veggplass ved PC-en) der barna kan henge opp symbolkort, brettede blåkopier og løste koder gjennom hele desember.
- [ ] Konfigurer `HOME_BRIDGE_SECRET` og test lokal polling/webhook mot `~/go/src/github.com/starefossen/home`.
- [ ] Kjør en rask generalprøve på Dag 1 med `mise run dev:day 1`.
