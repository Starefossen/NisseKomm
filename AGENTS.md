# NisseKomm - Development Guide for AI Agents

> **Important**: Keep this document updated when making changes to the project. Always run `pnpm check` at the end of coding sessions to verify code quality. Assume the dev server is already running at <http://localhost:3000>.
>
> **Do NOT create new markdown files** (like SUMMARY.md, CHANGES.md, etc.) to document your work unless explicitly requested by the user.

Beslutninger fra Hans: [docs/beslutninger.md](./docs/beslutninger.md) — sjekk før du endrer noe som berøres. Agenter legger nye beslutninger fra Hans til der (dato, én linje, kort «hvorfor»).

## Quick Navigation

**Session Starter** (you're here): Project essence, critical patterns, environment setup
**Deep Dive References**:

- 📐 [ARCHITECTURE.md](./ARCHITECTURE.md) - Layout patterns, module system, state management, date handling
- 🎮 [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Game mechanics, user flows, component behaviors
- 🎨 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Visual design, colors, animations, responsive patterns
- ✍️ [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) - Norwegian vocabulary, character voices, puzzle design

## Project Overview

**NisseKomm** is an advent calendar experience for children (ages 9-12) that bridges the physical and digital worlds. Rampenissen, the silly but friendly elf stationed with the kids, needs their help on a mission from Julius (Santa). Kids solve daily riddles by finding clues in both the real world and inside **NisseKomm** - the digital headquarters for critical Snøfall operations.

**Core Experience**: Rampenissen's daily emails → scavenge for physical clues → access digital HQ → combine hints from both worlds → solve riddles → unlock Julius' secrets.

**The Physical-Digital Bridge**: This is NOT a purely digital game. Success requires exploring BOTH worlds - searching the house for physical clues while investigating files in NisseKomm's retro CRT terminal. The two worlds intertwine throughout December 1-24.

**Universe**: Based on Snøfall TV series - Julius (Santa) in magical Snøfall with Hjerterud and elves. Rampenissen does humorous mischiefs during advent while keeping a watchful eye on the kids, but this year he needs their problem-solving help.

📖 **Complete details** → [CONTENT_GUIDE.md#dialogue-principles](./CONTENT_GUIDE.md#dialogue-principles) | [IMPLEMENTATION.md#game-mechanics](./IMPLEMENTATION.md)

**Key Design Philosophy**: The app is a digital tool in service of physical exploration. Rewards come from effort in BOTH worlds - not just typing codes, but searching, thinking, connecting clues across real and digital spaces. Puzzles require combining physical notes with digital information - neither alone provides the complete answer. Story arcs and bonus challenges reference previous days and require extra problem-solving, encouraging kids to remember and build on their adventure.

📖 **Puzzle design principles** → [CONTENT_GUIDE.md#puzzle-design](./CONTENT_GUIDE.md#puzzle-design)

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (utility-first, custom properties)
- **PostgreSQL** (`DATABASE_URL`) via `/api/state`, with `localStorage` as a client cache (StorageManager abstraction)

📖 **Visual design** → [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

## Critical Architecture Patterns

### 🚨 Facade Pattern (ALWAYS FOLLOW)

**GameEngine is the ONLY entry point for game state operations.**

UI components MUST call GameEngine methods, NEVER StorageManager directly:

```typescript
// ❌ BAD - UI directly accessing game state
const completedDays = StorageManager.getCompletedDaysForMissions();
const codes = StorageManager.getSubmittedCodes();

// ✅ GOOD - UI calls GameEngine facade
const completedDays = GameEngine.getCompletedDays();
const codes = GameEngine.getSubmittedCodes();

// ✅ ACCEPTABLE - Pure UI state (non-game data)
const isLoggedIn = StorageManager.isAuthenticated();
const lastRead = StorageManager.getDagbokLastRead();
```

**Why**: Encapsulation, type safety, easy backend migration, clear ownership.

📖 **Complete pattern details** → [ARCHITECTURE.md#architecture-principles](./ARCHITECTURE.md#architecture-principles)

### 🚨 Centralized Date Handling (ALWAYS FOLLOW)

**NEVER use `new Date()` directly. ALWAYS import from date-utils.ts:**

```typescript
// ❌ BAD - Direct date usage
const today = new Date();
const currentDay = today.getDate();

// ✅ GOOD - Centralized date utilities
import { getCurrentDay, getCurrentDate } from "@/lib/date-utils";
const currentDay = getCurrentDay();
const today = getCurrentDate();
```

**Why**: Enables `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` for testing across entire app.

📖 **Complete API reference** → [ARCHITECTURE.md#date-handling-system](./ARCHITECTURE.md#date-handling-system)

## Game Mechanics Overview

**5 Core Systems**:

1. **Oppdrag** (Daily Quests): 24 missions with riddles → physical clues → codes → diary unlocks
2. **Bonusoppdrag** (Side Quests): Tasks on day 11 (antenna) and 16 (lantern, `LYKT2026`) approved in the guide's day view (`/nissemor-guide/dag/11#bonus`). No badge: −20 % frost and a bonus variant of Julius' PS (`julius_ps_bonus`, day 11 and 16–19)
3. **Eventyr** (Story Arc): one story, `spokelseskoden`, on all 24 days, with milestones M1–M6 in `eventyr.json` (EventyrOversikt shows one progress line). Badges: Varmebærer (`decryptionSolved` frosne-koder), Portvokter (`dayCompleted` 21), Snøfalls venn (`allQuestsCompleted`)
4. **Nice List** (Days 22-24): Name registration → personalized finale message
5. **Symboler** (Symbol Collection): 9 physical QR cards → 3 NisseKrypto decryption challenges

**Frost (2026)**: `src/lib/frost.ts` holds the Frostgraden table and frost-mode rules (day 10 level 1, day 21 level 2). Use `GameEngine.getFrostLevel()`, `getFrostMode()`, `isFrostDay()`, `getLearnedRunes()`; runes render with `Frostrune`/`RuneText` (`components/ui/Frostrune.tsx`).

📖 **Complete specifications** → [IMPLEMENTATION.md](./IMPLEMENTATION.md)

## Coding Conventions

### TypeScript & React

- **Strict mode** TypeScript, functional components with hooks
- Use `'use client'` directive when needed (state, effects, browser APIs)
- Proper typing for all props (no `any`)

### Styling (Tailwind CSS v4)

**Critical syntax change**:

```tsx
// ✅ GOOD - Tailwind v4
bg-(--neon-green)
text-(--gold)

// ❌ BAD - Old syntax
bg-[var(--neon-green)]
```

**Key rules**:

- Utility classes only (no custom CSS in components)
- Use `text-black` on bright backgrounds (readability)
- Touch targets minimum 44×44px (`min-w-11 min-h-11`), prefer 48×48px

📖 **Complete styling guide** → [DESIGN_SYSTEM.md#styling-conventions](./DESIGN_SYSTEM.md#styling-conventions)

### Norwegian Language

All UI text in Norwegian. Use consistent vocabulary:

**Common terms**: Åpne (Open), Lukk (Close), Send (Submit), Låst (Locked), Fullført (Completed), Feil kode (Wrong code)

📖 **Complete ordliste** → [CONTENT_GUIDE.md#norwegian-vocabulary](./CONTENT_GUIDE.md#norwegian-vocabulary)

### Code Comments

Explain WHY, not WHAT. Remove obvious comments.

```typescript
// ✅ GOOD - Non-obvious logic
// Day 24 completion awards trophy badge

// ❌ BAD - Obvious action
// Loop through items
```

### File Organization

- Components: `src/components/` (windows/, modules/, ui/)
- Game logic: `lib/game-engine.ts`, `lib/systems/`, `lib/generators/`, `lib/validators/`
- Content: `src/data/*.json` (single source of truth)
- Types: `types/`

### Code Maintenance

**No deprecated code** - Delete obsolete code, don't comment out. Git is your safety net.

## Component Behaviors

**NisseMail**: Split-view inbox (30/70), unread tracking, "NY" badges
**Dagbok**: Julius' video diary (`JuliusVideo`, also Snøfall TV K3). Shows nothing outside December (no videos before 1 Dec). Today's video opens on login with «NY MELDING FRA JULIUS» until played to the end (`GameEngine.markJuliusVideoWatched`); transcript after watching, `GameEngine.getJuliusPs(day)` after the code (bonus and day-20 «krypto mangler» variants). Day texts 2–24 (titles, mail, PS, alerts, NisseNet files): `python3 scripts/oppdrag-innhold.py` from `docs/manus/app-tekster-2026.md`; `kodelekkasje.test.ts` fails if a kid-visible text shows a code early. Transcripts: `python3 scripts/julius-transcripts.py` → `src/data/julius_videoer.json`
**Dag 1-åpning (T14)**: `ui/Day1Opener.tsx`: `Day1Boot` (page.tsx, first login on 1 Dec) and `Day1Tail` (after Julius day-1 video); once each via `GameEngine.isIntroSeen/markIntroSeen`, click skips. Rune lines (T12) under Kulde's ghost line: `snofall-tv/runer.ts` + `RuneText learned=`, unlearned letters as frost.
**Snøfall TV**: four channels (`snofall-tv/channels.ts`) play video loops from `MEDIA_DIR`. Village events (letter birds, tower light) are drawn on canvas in code (`landsby-overlays.ts`) and only cut into `landsby-rolig`, never into other loops. **Runes**: `GameEngine.getLearnedRunes()` = letters of solved word codes plus E and T on day 1 (day 5 and 22 give none, so U comes on day 7 and B on day 18). **Brev til Julius** are stored in `nissekomm-santa-letters` and synced, one entry per day and writer (`from`, name buttons Kristian/Håkon/Hanna; old letters have none). The guide's Brevfugler page shows name and date and prints.
**SLEDEFLUKT** (desktop module from day 8, `RetroWindow stor`; `windows/sledeflukt/`): IQs sledesimulator in retro-pixel 3D. `gl.ts` (matrices, flat-shaded `Mesh`, 64-colour `PALETT`), `verden.ts` (valley tiles, instanced trees, Snøfall houses with `pipe` for Phase 2, golden rings standing up across the course (`ringMesh`, oval = the sim's `RING_X`/`RING_ALT`, kept near round), peaks, wall, cave, sleigh and reindeer rig; `tilVerden` maps sim units to the world), `renderer.ts` (WebGL1, 640×360 framebuffer stepping down to 480×270 and 320×180, Bayer dither in source pixels and palette snap, nearest upscale; fog fades to the sky gradient behind it, so the valley walls and far tiles end without a hard edge; no shadow map, no noise). `Sledeflukt.tsx` drives the pure sim in `snofall-tv/slede.ts` (nine stages from day 8, `dagensUtfordring`, `Styring.gass` for held FART/BREMS), sound in `slede-lyd.ts`, results via `GameEngine.recordSledeResultat`. Altitude `ALT_MIN`–`ALT_MAX` (40–450, climb `KLATRE` 190/s; HØYDE bar scales from them). **Krasj**: trees, peaks, the wall and (without IQ-assistent) diving into the snow cost one of three lives (`liv`; 0 ends the run as «IQ KOBLER INN NØDBREMSEN»); with the assistant there are no lives and the floor is soft. Every krasj: barrel roll (`RULL`, off with reduced motion), shake, sound, reindeer hop, radio line. **Skade**: small hits (a grazed tree or peak, skimming the snow; in fri flyging a steep slope) add `SKADE_PER_TREFF` (0.34) to `s.skade`, at most one per 0.6 s; a full meter is a krasj and starts over (fri flyging also resets it on respawn). HUD: SLEDE meter, LIV ●●●, red screen edge on each hit; the sled wobbles with damage and throws sparks from half. One relative touch stick plus held buttons, keyboard (`taster.ts`, by `e.code` so a key released under Shift lets go; held keys clear on blur; E = SPRANG; keys, stick and blur pause live in `useKontroller` (`kontroller.ts`), shared with free flight; a pause during the countdown resumes the countdown), pause on blur, `prefers-reduced-motion` (also turns off the snow pass); auto fallback one step (640 → 480 → 320) when the median frame is over 18 ms. A lost WebGL context (iPad in the background) shows «TRYKK FOR Å STARTE PÅ NYTT» and remounts (`Renderer.påTapt`). Chimney smoke is one instanced `Renderer.tegnRøyk` call (`pipeRøyk`/`skyRøyk` in `verden.ts`), dithered out as it rises; free flight bakes every house into one mesh (`gl.bak`); the dev page exposes draw calls per frame as `window.__trekk`. A dive into the snow crashes on arrival only, and after a crash a held dive is ignored until the stick comes back; stage 1 (`tundra`) has a soft floor (scrape, never crash). The start screen marks stages nobody in the family has flown «NY». Rings (`Ting` «varde», RINGER in the HUD) hang every `Blanding.varde` segments (5, Ringløypa 4) and step up or down and sideways between every pair (`Blanding.høyde`, sideways `høyde/100`; day 8 teaches low then high; `slede.test.ts` flies an ideal pilot through every ring of every stage), with a ground shadow, a gold tick on the HØYDE bar and «OPP»/«NED»; every stage shows the next stage's peaks locked beside the finish (`lagBane`); `ringAvvik` is the hit test, «nesten» the near miss. **Pipelevering** from day 14: stages with `Blanding.hus` place `Ting` «hus» on the course; SLIPP/Space/Enter drops one package at a time on every stage from day 8, chimneys or not (`SLIPP_PAUSE` between drops; without chimneys it just lands in a puff of snow, no score, no miss counted) (`Styring.slipp`, `forutsiPakke` draws the aim line), hits at the chimney top score, `leveringsoppdrag(day, e)` is the day's target (+300); from day 14 (`PIPER_FRA_DAG`) stages without houses get a few optional chimneys (`lagBane(e, dag)`, no target, points only), packages are named from `GameEngine.getSantaLetters()` (`pakkenavn`). **Fri flyging** (`FriFlyging.tsx`, mounted instead of the stages by `SledefluktSpill`): an open world, not a track. The pure sim is `snofall-tv/vidda.ts` (`createFri({dag, bergen, landås})`): position (x, z; north is -z), altitude and heading (`kurs`), `høyde(x, z)` terrain with round mountains (`FJELL`) and the wall ridge (`MUR`) as obstacles (a wall ahead, ground above the ceiling or a dive into the ground is a «krasj»: the sled stops for a second (`stoppTil`), then is set down 600 back and 60 higher and flies slowly for a moment; a gentle rise lifts the nose; Nordtoppen and Muren stand above `ALT_MAX`), `STEDER` (Snøfall, antenna, gårdene from day 8; Nordtoppen 20, Muren 21, Krystallgrotten 24; Bergen with day 24 solved) found once each («oppdaget», the place's own nordlandsk radio line), locked places push the sled out («låst», `stedsnavn` says «ÅPNER DAG N»/«ÅPNER JULAFTEN»; «LANDÅS» only with day 22 solved), the curtain at `GRENSE` turns the sled back («snu», `utenfor`), the gate corridor to Bergen (north-east behind the cave, `BERGEN_KURS`, `fraKorridor`/`iKorridor`) opens with `bergen`; **Snøfall** is a round tun (`TUN`, `BYGG` in vidda.ts, one mesh in `sledeflukt/snofall.ts`): wall with the gate due south and four onion-domed turrets, clock tower in the middle, named houses, ring and main-street houses at double size (`FriHus.sk`) with chimneys from `lagHus`, lamps, fences, a Christmas tree, lit spruces (`PYNTETRÆR`, instanced) and stall clutter; `bygg(x, z, alt)` makes wall, gable, turrets and houses obstacles, `husTopp` the ring houses too (under the arch is open; the start is above the roofs at `ALT_START` 260, `KURS_START` over the gate with the tower off the line); Muren's arc glows gold from day 21 (`murGlødMesh`), grey before; Muren is IQ's ridge arc (`MUR`, `murPunkt`) between Snøfall and Krystallgrotten at Nordtoppen's north-east foot, circling letter birds (`FUGLER`, `fuglPos`), chimneys to drop into (`lagHus`, same `nærPoeng`/`landingTekst` as the stages). Rendering: square tiles `lagRute` on `høyde()` around the sled (locked places' tiles grey), one coarse `fjernMesh` for the horizon drawn first and `Renderer.nullstillDybde()` before the near pass (one shared fog), `gardinMesh` aurora rays at the edge, padlocks scaled by distance, a compass tape (N Ø S V, place marks) and a north-up map of the whole vidda with labels and padlocks. Nothing saved. The stage teasers (`Ting.lås`/`låst` from `SimOpts.dag`) stay grey with a padlock beside the finish. **Feel**: `STYRE_TREGHET` (0.5 s, slede.ts and vidda.ts) eases turns in and out in two lag stages, turns are slower at speed, the sleigh trails the reindeer (`s.slep`); `AERO` (0.15) makes climbing cost speed and diving gain it, and under 70 % speed the nose drops. Free flight has wind (`vindStyrke`, `VIND_FRI`): always on, turning slowly, strongest near `FJELL` and high up, shown as snow drift. `Blanding.sti`/`klippe` put a tree or peak on the ring line halfway between rings, ramping by stage (none on stage 1). Radio lines show in `RadioBoks` (top centre, Rampenissen's portrait, crackle, queued, `RADIO_SEK` 3 s). Trixter pulls the sleigh (HUD «TRIXTER»). **Records**: the result screen lists Kristian's, Håkon's and the family best for the stage with this run highlighted and «NY REKORD!»; REKORDER on the start screen shows all stages per player; START with no player chosen asks «VELG HVEM SOM FLYR» first. **Per player**: `SPILLERE` (Kristian, Håkon) choose a name on the start screen (`GameEngine.getSledeSpiller`, per screen); `recordSledeResultat(etappe, poeng, bjeller, spiller, utfordringDag)` keeps the family best under the stage id and the player's under «Navn/etappe» in the same synced key. **Extras**: letter birds (`Ting` «fugl», +80), reindeer hop on nesten/fugl/krasj, a missed chimney puffs back (`s.sisteHus`), Rampenissen's nordlandsk radio lines (`RADIO`/`radiolinje`, keyed by event name, in synlig-tekst) in `RadioBoks` low on the left. **Crew**: Julius at the reins and Pil in the back (`mannskap` in `verden.ts`) lean in turns, Julius waves on a ring streak (3+) or a new place, Pil throws on SLIPP, both duck on a crash. Rings face along the bend (`kursYaw`) and hang still. Locked stages show as «LÅST · ÅPNER DAG N» on the start screen (julenatt stays hidden). K4 «TEKNISK HUD» keeps a one-line pointer. Dev page `/dev/sledeflukt?dag=24&res=320` (lan mode) shows frame times. Status and Phase 2 notes: `docs/sledeflukt-status.md`. Stage names and HUD text must never contain a code word (`kodelekkasje.test.ts`).
**Brevfugler**: sky over Snøfall (`feed/landsby-rolig.jpg` from `MEDIA_DIR`, fallback `/village-day.jpg`) with pixel birds; the blue bird circles Nordtoppen from day 14; day 24's thaw plays once (`isIntroSeen("brev-tint")`).
**Opplåsinger**: `lib/opplasinger.ts` derives every unlock (quest `reveals.modules`, Ugleposten chapters, `ETAPPER`, HUD toys in `snofall-tv/hud.ts`); `opplasinger.test.ts` ties it to each game's gate. Drives unlock alerts (a day with three unlocks gets one combined line after the code) and otherwise one nudge a day while unopened (`nivaa`: badge only before today's code, then Rampenissen, IQ plus tile pulse, last nudge on day 3, then only the badge until opened; `puffTekst` rotates variants per item and day; seen = `ny-<vindu>-<dag>` in the synced intros key, set when the window opens). Rampenissen's lines are nordlandsk, IQ's bokmål; no digits in them (number codes), calendar «NOE ÅPNER» and day list, and `ui/NyttIDag` banners. Use `GameEngine.getOpplasinger/getNyttNivaa/getOpplasingNivaa`.
**Nissemor-guiden**: six tabs (I kveld · I dag · Dager · Historien · Bibliotek · Søk) plus a gear for Innstillinger; in November «I dag» opens the pre-season page (`/forberedelser`: Morgenrådet 24.–30. Nov from `radio-hint.json`, prep list, day-1 build plan, shopping list). One source per fact: `lib/guide-sesong.ts` (server, parent-only) reads historie, storyboard and gaater from the bake by heading (`seksjon`, every heading used listed in `SEKSJONER` and tested in `guide-sesong.test.ts`), so renaming a heading there fails the test. It feeds `/api/guide/sesong` (day list, pre-season, Historien) and the day view: storyboard «Dag N» on top, tonight's checklist and strek from gaater and historie §8, one line per subsystem (frost, runes, milestone, TV §9, NisseNet, Sledeflukt, Ugleposten, tidbits, radio) and Varden = the real `getKidContext` on a simulated state, before and after the code. **Gåtekart** tops the day view (`gaatekart(n)` in guide-sesong.ts, `dag/[n]/gaatekart.tsx`): house pieces H1… are the sentences of gaater «Brikke H» (bold letters hidden until «Vis fasit»), screen pieces S1… are «Brikke S» quotes located in the Julius transcript/segment or mail plus `gaatebiter.json` (NisseNet path, symbol N/9, older PS/mail/video); a quote found nowhere is flagged red. `gaatekart.test.ts` checks every located quote against the kids' text. «Andel per flate» is the bar; the #kveld checklist lists H1… (day 1: the 28.–30. Nov build plan). `/nissemor-guide/dag/kart` is the season table. `/nissemor-guide/dag/[n]` holds status (solved, wrong attempts, symbol, bonus), hints, fasit, tonight's checklist (`#kveld`) and bonus (`#bonus`); old `/i-kveld`, `/fasit`, `/bonusoppdrag`, `/merker` redirect there. Parent checklists and wrong attempts are synced keys, so both parents' phones agree. The speech budget mirrors `assets/bin/julius-dag.py` (`wcount`, `timing`). Day view, Historien, Bibliotek and Søk read `src/data/guide-innhold.json` (manus, historie/storyboard/gaater, entitet.md, medier.json), baked by `node scripts/guide-innhold.mjs` because the image has no docs/ or assets/; `guide-innhold.test.ts` fails when it is stale. Only `lib/guide-innhold.ts` (server, parent-only routes) imports it. **Vurderinger**: guide sections carry the media cards' «Godkjent»/«Lag på nytt» + note (`Vurderingsknapper` in `media/kort.tsx`, wrapped by `Vurder id=` in `nissemor-guide/vurdering.tsx`); ids `dag/NN/{gaatekart,kveld,rampestrek,delsystemer,varden}`, `historien/<slug of card title>`, `forsesong/<date>` share `MEDIA_DIR/media-vurdering.json` with media paths via `/api/media/vurdering` (parent-only, lan mode). `/nissemor-guide/vurderinger` (Bibliotek) lists everything not approved with notes and links; agents read the same JSON with `GET /api/media/vurdering` (Bearer JWT) and filter `vurdering != "godkjent"`. «Delsystemer i dag» and «Varden» are `Lukkbar` `<details>`, closed by default, open state per section in localStorage.
**Utskrifter**: every print uses `printout/_print/Utskrift.tsx` (API comment at the top): parts declare size (A3 = 2 × A4 with glue strip, A4, A5 true ISO, A6/A7 trimmed to tile A4, or `{b, h}` mm), paper, two-sided and count; the frame packs them on A4 with cut marks and shows a non-printed instruction box. Titles and days live in `printout/filer.ts` (`utskriftTittel`).
**Kalender**: 3 day states (locked/available/completed), modal on click → opens NisseMail
**SymbolScanner**: QR camera plus a 4-character card code printed under each QR (`SHORT_CODES` in `symbol-system.ts`, never change once printed). `parseSymbolCode` accepts both; a card is refused before its `symbol_clue` day in December. No camera, denied, or http on a LAN IP (no secure context) → typed code only. `symbolskanner.test.ts` ties printout to parser; `gjennomspilling` types the code on each symbol day.
**Medieinventar**: generators write `<fil>.meta.json` (source text, reference images, prompt hash; `assets/bin/medie.py`) and skip files that are current unless `--force`. Every derived image and TV loop is a job in `assets/medier.json` (template in `assets/prompts/`, `{{winter}}`/`{{iq.KLÆR}}` placeholders, refs as `characters/winter#tophat`); characters, places and objects are entities with `entitet.md` (JSON block: names, refs, pronoun, first day, relations, facts, banned phrases; sections for personality and voice; `docs/asset-struktur.md`). Character facts live there, not here: `mise run entiteter` writes `src/data/entiteter.json` and the block in CONTENT_GUIDE, and `entiteter.test.ts` checks kid-visible text against them. A hand-made file is `"generator": "hånd"` in medier.json and is never queued. After a pull that moves refs, run `python3 assets/bin/medie.py flytt`. `mise run inventar` writes `assets/INVENTAR.md` and `public/media-inventar.json` (shown on the guide's media page via `/api/media/inventar`).
**Tidbits**: small surprises (secret words, wrong-code jokes, TV frequencies, SPAM folder, calendar lines, Snøfall-statistikk, hidden track, NisseNet MORO files, idle Rampenissen) all come from `src/data/tidbits.json`; schema in `docs/tidbits.md`, helpers in `lib/tidbits.ts`. Covered by `kodelekkasje.test.ts`.
**Vurderinger**: Hans' Godkjent/Lag på nytt and notes from the guide (`MEDIA_DIR/media-vurdering.json`) reach agents through the parent MCP tool `list_vurderinger` (open by default, `siden`, `prefiks`; one text line per item). `mise run vurderinger [--alle] [--siden ISO] [--nye] [--prefiks P]` calls it on localhost:3000 (dev token `parenttoken1`, set by `mise run dev`; `MCP_URL` for another port); `--nye` reads `~/.cache/nissekomm/vurderinger-sist`.
**KodeTerminal**: 1.5s processing delay, case-insensitive validation, gold flash on success
**Nissespill** (Ugleposten, from day 4): point-and-click side story in `windows/nissespill/`. `motor.ts` is the engine as pure functions over `EventyrSave` (GameEngine.getEventyrSave/saveEventyr, synced key); chapters are data (`kapittel1.ts`–`kapittel4.ts`, registry in `kapitler.ts`, unlock days 4/10/16/22 via `spilldag()`; `Nissespill.test.tsx` plays every chapter through the engine). Conditions take `alle`/`en_av`; optional owl feathers (`Scene.fjaer`, `EventyrSave.fjaer`); mini-puzzles (lock, sliding tiles, radio, route) are pure logic in `minispill.ts`, UI in `Puslespill.tsx`; data format at the top of `motor.ts`. The kids play **Floke**, Rampenissen's yarn owl (`assets/characters/floke/entitet.md`; never «Knerten»), through IQ's cameras. `UgleIntro.tsx` is the chapter opener (camera boot, Floke wakes, Rampenissen whispers `kap.intro`), once per chapter via `GameEngine.isIntroSeen("ugle-k<n>")`, replay from MENY; the chapter list shows locked chapters greyed with «ÅPNER DAG N» and `Kapittel.teaser` (covered by `synlig-tekst.ts` from day 4). Rampenissen's lines are nordlandsk, others bokmål; no clues or codes for the daily puzzles (`kodelekkasje.test.ts` scans every chapter from its day; avoid code words such as «lykt», «kulde», «turbo» even inside other words). Stills and pixel portraits live under `spill/` in the media manifest (`assets/bin/portrett.sh`, `piksel.sh`). Scenes are pixel art: `spill-piksel/<scene>` in medier.json redraws the photo the game shows (`bilde: public/…` = MEDIA_DIR, so hotspots keep fitting; shared style block `assets/prompts/spill/piksel-stil.txt`) to `spill/piksel/<scene>.png`; `Nissespill.tsx` falls back to the photo when it is missing. Scenes without a photo (K1's four places off Torget: `kafeen`, `pakkesentralen`, `klokketaarnet`, `julebodene`, canonical in `assets/locations/`) use `piksel-ny-scene.txt` with the Torget pixel image as palette reference; `Scene.bilde` must be named like the job's `ut` (`spill/kafe.jpg` → `spill/piksel/kafe.png`). `tips(kap, save, flagg)` prefers the goal of an open side puzzle. Genre conventions (gap list in `docs/ugleposten-sjanger.md`): every `Gaate` has `maal` for the NOTAT notebook (`kjent` for parallel goals), `Hotspot.prat` answers SNAKK on things, asked dialog choices grey out (`spurt:` flags), the end card shows `oppsummering`. Pickups open a card (icon, name, `funnetTekst` = `Gjenstand.funnet` or first sentence of `se`); the slot pulses «NY» (`ny:` flag) until examined or used, and NOTAT lists them as «Kanskje nyttig». Rampenissen never cuts in: dialog asides (`Node.rampenissen`) and item teases queue (`merkReplikk`/`rampenissenNytt`) behind his RAMPENISSEN button, which also holds TIPS. **Save**: one shared story save with a soft lock: every write stamps `skjerm` (`GameEngine.getSkjermId()`, player name from the menu's «Hvem spiller her?», shared with SLEDEFLUKT), and the other screen adopts the pulled save and shows «<navn> spiller nå» with TA OVER for two minutes. `byttKapittel` parks the outgoing chapter in `EventyrSave.parkert` and resumes the incoming one; `nyttKapittel` (restart, behind a Ja/Nei) wipes only that chapter. `sist` drives the resume card (`gjenoppta`) on a new day; `feil` counts wrong tries per goal, and `dyttGrunn` (new day or 4 wrong tries) makes the RAMPENISSEN button pulse and give the next tip unasked; after the last tip a mini-puzzle offers «La Rampenissen ta den siste biten». **Figures and icons**: `Hotspot.figur` draws `spill/piksel/figur/<id>.png` in the hotspot rect (bottom centre, same `vis`), a pixel silhouette until it exists; item icons are `spill/piksel/ikon/<id>.png` (32×32, nearest-neighbour) with the pixelarticons `ikon` as fallback. Holding an item turns on hotspot outlines and a big «BRUK X PÅ …» chip with ✕; a slot can be dragged onto a hotspot. **Kartplate** (`Kartplate.tsx`) sits over the chapter list: one mark per chapter at its start scene, locked ones grey with a padlock and «ÅPNER DAG N» (`erLaastOpp`), no navigation; the drawn SVG is the fallback for medier.json `spill-piksel/kart`. **Koblinger** (`kobling.tsx`, GameEngine only) fill chapter text at render time, so the static strings stay under `kodelekkasje.test.ts`: `{{brev}}` = the kids' letters to Julius on the desk (K3/K4 `brevbunken`, writer and excerpt), `{{rekorder}}` = Sledeflukt bests per player on the back of Winter's list (K4 dialog `rekorder`, numbers spaced so none reads as a code), and `ᚱ:ORD` at the end of a line draws a frostrune word with `RuneText learned=` (K1 tavla, K2 hyllene, K3 steinene, K4 bokhylla; story words only). Eight owl feathers across chapters (`GameEngine.getUglefjaer()`, `FJAER_MAAL` in `opplasinger.ts`) show the MORO file with `fjaer` in tidbits.json and one Rampenissen alert until it is opened (`ny-nissenet-fjaer`).

📖 **Complete behaviors** → [IMPLEMENTATION.md#component-behaviors](./IMPLEMENTATION.md)

## Environment Configuration

**Key `.env.local` Settings**:

```bash
# Test Mode & Date Mocking
NEXT_PUBLIC_TEST_MODE=false              # Bypass date restrictions
NEXT_PUBLIC_BOOT_ANIMATION_DURATION=2    # 0 = skip
NEXT_PUBLIC_MOCK_DAY=                    # 1-24 for testing
NEXT_PUBLIC_MOCK_MONTH=                  # 1-12 for testing

# One family (no registration)
KID_CODE=                                # Kids' login (three words, e.g. "snø lykt rein")
PARENT_CODE=                             # Parent guide login
NISSEKOMM_MODE=lan                       # 'public' (kid app only) or 'lan' (guide, dev pages)
TRUST_PROXY=                             # 1 = trust X-Forwarded-Proto (set in production behind Kourier, both modes)

# Storage and media
DATABASE_URL=                            # PostgreSQL; progress is synced via /api/state
MEDIA_DIR=                               # Video/audio library (not in the repo), served at /media/*
STORAGE_BACKEND=                         # server | localStorage; unset = server when DATABASE_URL is set
```

**Sessions**: one cookie per role (`nissekomm` kid, `nissekomm-guide` parent); each API checks only the role it needs (`hasRole` in `lib/auth.ts`), and logout ends one role. On https the names are `__Host-`/Secure; on plain http (local dev, LAN laptop) they are unprefixed. Production (public and lan/mcp) sits behind Kourier, which terminates TLS, so it needs `TRUST_PROXY=1` to see https from `X-Forwarded-Proto`; without it the header is ignored and the request URL decides.

`mise run dev` sets dev codes and lan mode. Multi-tenancy, Sanity and Resend are gone; one family logs in with `KID_CODE` (parent guide: `PARENT_CODE`). `NISSEKOMM_MODE=lan` enables the guide, `/dev`, `/mcp` and the simulation panel; `public` serves the kid app only (the default in production). Progress lives in Postgres (in-memory store without `DATABASE_URL`); a season reset (`DELETE /api/state`, parent only) clears the server too, so every screen resets. The MCP server at `/mcp` (Bearer JWT, tools in `src/lib/mcp/tools.ts`) is the home integration; `/api/home-bridge` is gone. `get_kid_context` (Varden) hides an unsolved day's pieces as «[skjult]»; the piece list is `src/data/gaatebiter.json`, tested against `docs/gaater-2026.md`. `get_clips` adds `intro_hint`/`reaksjon_hint` per clip and `host_hint` on 24–30 Nov, baked from the radio script by `node scripts/radio-hint.mjs` into `src/data/radio-hint.json` (staleness test in guide-innhold.test.ts). It aims for 9 KB (`KID_TARGET_BYTES`): older solved days as title, PS and a one-sentence recap, files capped at 300 characters; then logs, file text and old PS go first.

**Date Mocking**: Set `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` to test specific days across entire app. In `next dev` or with `NEXT_PUBLIC_TEST_MODE=true`, the TIDSMASKIN button (bottom right) opens a panel that sets day and time live («Gå til dag med fremgang» solves earlier days via `sim.solveUntil`, «Gå til dag, løst» today too) via a localStorage override in `date-utils.ts`, and can reset progress.

📖 **Complete API** → [ARCHITECTURE.md#date-handling-system](./ARCHITECTURE.md#date-handling-system)

## Quality Checklist

**Before Committing**:

- [ ] Run `pnpm check` (type checking + linting)
- [ ] All text in Norwegian (except code comments)
- [ ] VT323 font used consistently
- [ ] Thin brass title bars on windows (2 px)
- [ ] Animations on all interactions
- [ ] Colors from CSS custom properties
- [ ] StorageManager for all persistence
- [ ] TypeScript strict mode compliance
- [ ] Update this AGENTS.md if architecture changed

**Design Consistency**:

- [ ] Parchment/ice (`--neon-green`) = primary UI; green only for northern lights, success and LEDs
- [ ] Red = errors
- [ ] Gold = success/completion
- [ ] Amber/ice blue (`--cold-blue`) = info/hints
- [ ] Gray = locked/disabled

## Development Workflow

1. **Assume dev server is running** at <http://localhost:3000>
2. Make changes to components/content
3. Browser auto-reloads on save
4. Test in browser (use `NEXT_PUBLIC_TEST_MODE=true` for testing all days)
5. Run `pnpm check` before finishing session
6. Update this document if you changed architecture/patterns

## Future Enhancements

**Planned Features** (Phase 2+):

- Reactive sidebar widgets (update on code submissions)
- Full-screen glitch effects for dramatic feedback

---

**Version**: Phase 1
**Last Updated**: November 2025
**Target Audience**: Children ages 9-12 (Norwegian-speaking)
**Maintained By**: AI Coding Agents (keep this doc in sync with code!)
