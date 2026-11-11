# Kildeassets: én kanonisk kilde per entitet

Mål: Winters utseende står ett sted. Endrer du det, blir hver prompt som bruker ham ny, og sidefil-hashen markerer alle Winter-filer som utdatert (⚠). Holdning: flytt lite, behold URL-ene, la koden gjøre jobben.

## 1. Struktur

```
assets/
  stil.md                        # felles stil (finnes); refereres som {{stil}}
  characters/<id>/               # julius, rampenissen, iq, winter, hjerterud (etter rename)
    beskrivelse.txt              # brukes ordrett i prompter: {{winter}}
    ref.jpg, ref-<variant>.jpg   # ref-tophat.jpg, ref-outside.jpg, ref-tom.jpg  (gitignorert)
    entitet.json                 # navn, alias, refs, notat
    replikker.md, synger.txt …   # innhold som ikke er utseende, blir liggende
  locations/<id>/                # snofall-landsby, julius-kontor, krystallgrotten, antenne-tjern, iq-verksted, sledeflukt
    beskrivelse.txt, entitet.json
    ref.jpg, ref-<variant>.jpg   # ref-rolig, ref-v2, ref-vidvinkel, ref-vidvinkel-tom, ref-nordlys …
  objects/<id>/                  # nytt: postkasse, klementin, slede, lille-pjokk, brevfugl, flosshatt
    beskrivelse.txt, entitet.json, [ref.jpg]
  prompts/<app>/<navn>.txt       # maler, flyttet fra locations/*/varianter/: tv/, spill/, slede/, portrett/, julius/
  medier.json                    # ALLE avledede filer: mal + entiteter + refs → ut-sti
  out/                           # mellomfiler: stillbilder (still-dagNN.jpg, still-v2-*.jpg) flyttes hit
```

`entitet.json` (eksempel, `characters/winter/`):

```json
{
  "navn": "Winter",
  "alias": ["Vinter"],
  "refs": { "outside": "ref-outside.jpg", "tophat": "ref-tophat.jpg" },
  "standard_ref": "outside"
}
```

«used-by» lagres ikke; `medie.py brukt-av winter` regner det ut fra `medier.json`. Da kan det ikke gå i utakt.

## 2. Avledede filer: `assets/medier.json`

```json
{
  "tv/port-winter": {
    "generator": "loop",
    "ut": "video/tv/port-winter.mp4",
    "bilde": "locations/snofall-landsby#v2",
    "mal": "prompts/tv/port-winter.txt",
    "refs": ["characters/winter#tophat"]
  },
  "spill/torget": {
    "generator": "still",
    "ut": "spill/torget.jpg",
    "bilde": "locations/snofall-landsby#rolig",
    "mal": "prompts/spill/torget.txt",
    "refs": ["characters/winter#outside", "characters/winter#tophat"]
  },
  "spill/portrett-winter": {
    "generator": "portrett",
    "ut": "spill/portrett-winter.png",
    "mal": "prompts/portrett/standard.txt",
    "vars": { "hvem": "winter" },
    "refs": ["characters/winter#outside"]
  }
}
```

En mal skriver `{{winter}}` (beskrivelse.txt), `{{objects/postkasse}}`, `{{stil}}`, `{{prompts/spill/piksel-stil}}` (en felles blokk i `prompts/`) eller `{{hvem}}`. Én funksjon i `medie.py`, `render(id)`, setter inn tekstene og løser `#variant` til en bildesti. Den rendrede prompten skrives til `out/prompts/<id>.txt`, og det er den filen shell-generatorene (still.sh, loop.sh, portrett.sh) får. De endres ikke. Sidefilen hasher den rendrede teksten og hver ref. Derfor gjør en endring i `winter/beskrivelse.txt` eller `ref-tophat.jpg` alle Winter-filer ⚠, uten egen avhengighetslogikk.

Julius (`julius.sh`, `julius-dag.py`) bruker allerede `cat beskrivelse.txt`; den eneste endringen er at ref-stien hentes fra `entitet.json`. Rampenissen-TTS har ingen bildekilde og blir som den er.

## 3. Utfiler i MEDIA_DIR: ingen omdøping

`video/julius/`, `audio/rampenissen/`, `video/tv/`, `feed/`, `spill/` og `music/` blir som i dag. URL-ene er appens API (media.ts `MEDIA_FILES`, `MEDIA_GROUPS`, channels.ts, kapittel*.ts), og en omdøping ville kreve omdirigeringer og ny bygging av imaget, uten gevinst for barna. To små rettelser:

| Gammel                                           | Ny                                                              | Hvorfor                         |
| ------------------------------------------------ | --------------------------------------------------------------- | ------------------------------- |
| `feed/snøfall-day.png`, `feed/snøfall-storm.png` | beholdes, med alias-redirect `snofall-*` bare hvis de omdøpes   | ø i URL; ikke verdt det før jul |
| hardkodet liste i media.ts                       | genereres fra `medier.json` (`ut`-feltene) + Julius/Rampe-dager | én liste, ikke to               |

Siste rad er valgfri (steg 6). Uten den sjekker en test at hver `ut` i `medier.json` står i `MEDIA_FILES`.

## 4. Ref-bilder (gitignorert)

`/assets/**/*.jpg` er fortsatt ignorert. Omdøping skjer lokalt med `mv` og skript (`assets/bin/flytt-refs.sh`, idempotent, skriver gammel → ny-tabell). Sidefilene peker på gamle stier. Skriptet skriver derfor stiene i `*.meta.json` om i samme kjøring, ellers blir alt ⚠ og genereres på nytt (kvote!). `entitet.json` og malene er sporet i git. Bildene ligger bare lokalt og i imaget, som i dag.

## 5. Migrering (små steg, hvert er én PR)

| #   | Steg                                                                                                                                                                                | Test                                                                                                           | Tid   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----- |
| 1   | `render()` + `{{…}}` i medie.py, med assert-selvtest. Ingen filer flyttes ennå                                                                                                      | `medie.py --selvtest`, `generer.py --selvtest`                                                                 | 2 t   |
| 2   | `medier.json` med dagens SPILL/PORTRETT/SLEDE/TV-jobber, stier uendret. generer.py og tv-loops.sh leser den i stedet for egne tabeller. Rendret prompt = dagens tekst → hasher like | `generer.py --selvtest`; `media:plan` viser 0 nye ⚠                                                            | 3 t   |
| 3   | Trekk ut gjentatt utseende: Winter-tekst ut av port-winter, torget-spill, hendelse-winter og portrett; erstatt med `{{winter}}`. Det samme for Julius og IQ                         | `media:plan`: bare de berørte blir ⚠, og det er riktig. Godkjenn ny generering eller beskriv det som tilsiktet | 2 t   |
| 4   | Flytt `varianter/*.prompt.txt` → `prompts/<app>/`, og `still-*.jpg` → `out/`. `flytt-refs.sh` gir refs nye navn og skriver om sidefiler                                             | `media:plan`: 0 nye ⚠; `mise run inventar`                                                                     | 2 t   |
| 5   | `objects/` med postkasse, klementin, slede, lille-pjokk, brevfugl, flosshatt. Maler bruker `{{objects/…}}`                                                                          | som steg 3                                                                                                     | 1,5 t |
| 6   | (valgfritt) media.ts-listen genereres fra medier.json, ellers en konsistenstest                                                                                                     | `pnpm check`, `pnpm test`, gjennomspilling dag 1, 11, 18, 24                                                   | 1,5 t |

Sum ca. 10–12 t. Steg 1–2 gir mest verdi; 5–6 kan vente til etter 1. desember.

## Venter på Hjerterud-renamen

- Steg 3–5 rører `characters/` og malene som nevner Nissemor (`port-nissemor`, `hendelse-nissemor`, `portrett-nissemor`). Start dem først når renamen er merget.
- Steg 1–2 rører bare `assets/bin/` og en ny `medier.json`. Det kan begynne nå, så lenge `medier.json` ikke lister Nissemor-jobber før renamen er inne. Legg dem til etterpå med id `hjerterud`.
- Ut-URL-ene `video/tv/port-nissemor.mp4` og `spill/portrett-nissemor.png`: renamen bestemmer om de skal hete noe nytt. Gjør de det, trengs redirect i `/media/*`-ruten. Denne planen endrer dem ikke.

## 6. Personlighet og atferd: samme prinsipp

I dag står personlighet, stemme, forhold og fakta i `beskrivelse.txt`, CONTENT_GUIDE.md («Character Voices»), historie-2026.md, AGENTS.md, i hodene på manusene, i kommentarer i kapittel*.ts, i promptene og i `RAMPE_STYLE` i medie.py.

**Én fil per entitet: `<kind>/<id>/entitet.md`.** Den erstatter `beskrivelse.txt` og `entitet.json` fra seksjon 1. Faste overskrifter gjør at et lite regex-skript (bare stdlib, uten YAML-avhengighet) kan dele den opp:

````md
# Winter

```json
{
  "id": "winter",
  "navn": ["Winter", "Ole Winter"],
  "pronomen": "han",
  "fra_dag": 3,
  "refs": { "outside": "ref-outside.jpg", "tophat": "ref-tophat.jpg" },
  "forhold": { "julius": "sjef", "iq": "kollega, irritert over rot" },
  "fakta": [
    { "fra_dag": 1, "tekst": "sjef for pakkesentralen" },
    { "fra_dag": 21, "tekst": "åpner porten" }
  ],
  "ikke": ["kald", "uvennlig", "kalles Vinter"]
}
```

## Utseende ← {{winter}} i bildeprompter (teksten fra dagens beskrivelse.txt)

## Personlighet ← {{winter.personlighet}}

## Stemme ← talestil: «paragraf», lister; for Rampenissen nordlandsk + TTS-linja

## Gjør / ikke gjør
````

**Generer eller sjekk?** Tommelfingerregel: det en maskin leser genereres. Det et menneske har skrevet med omhu sjekkes.

| Artefakt                                 | Retning                                                                                                              | Hvorfor                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Bildeprompter (utseende)                 | **generer** (`{{…}}`)                                                                                                | Maskinlest; sidefil-hashen markerer da filene som ⚠ helt gratis         |
| TTS-stil (`RAMPE_STYLE`)                 | **generer** fra `## Stemme`                                                                                          | Én linje, maskinlest; endret stil → alle klipp ⚠                        |
| Julius-prompten (`julius.sh`)            | **generer** (leser allerede beskrivelse.txt)                                                                         | Bare en ny sti                                                          |
| CONTENT_GUIDE «Character Voices»         | **generer** mellom markører `<!-- entiteter:start/slutt -->` (`mise run entiteter`), og test at blokken er oppdatert | I dag en kopi som glir ut av sync; prosaen utenfor blokken blir stående |
| AGENTS.md-linjer om karakterer           | **lenke**, ikke kopi                                                                                                 | Kort peker til `assets/characters/`; mindre tekst                       |
| Testfixture (navn, pronomen, fra_dag)    | **generer** `src/data/entiteter.json`                                                                                | TS-testene leser JSON; ingen YAML i appen                               |
| Manus (julius, rampenissen, app-tekster) | **sjekk**                                                                                                            | Skrevet for hånd og språkvasket; generert dialog blir flat              |
| historie-2026.md, gaater                 | **sjekk**                                                                                                            | Samme; dette er forfatterens arbeidsdokument                            |
| Ugleposten-kapitler (`kapittel*.ts`)     | **sjekk**; fjern dupliserte karakterkommentarer, lenk til entiteten                                                  | Koden er dialog, ikke metadata                                          |
| Hendelse- og port-prompter               | **generer** utseende + **sjekk** resten                                                                              | Handlingen er håndskrevet                                               |

**Sjekken** blir én test, `entiteter.test.ts`, på samme mønster som `kodelekkasje.test.ts` (den skanner allerede barnesynlig tekst per dag, så vi gjenbruker skanneren):

1. Stavemåte: et navn som ligner (Levenshtein ≤ 2) men ikke står i `navn`, gir feil (Vinter, Nissemor etter renamen, IQ/Iq).
2. Pronomen: «Winter … hun» innen samme setning gir advarsel, ikke feil (falske treff).
3. Fra dag: en karakter nevnt i barnesynlig tekst før `fra_dag` gir feil.
4. `ikke`-lista: ordrette forbudte fraser gir feil.
   Fakta som motsier hverandre i prosa («Winter åpner porten» på dag 5) kan ikke sjekkes sikkert med regex. Det hører hjemme i Fable-språkvasken, med entitetsfilen som vedlegg til gjennomlesningen.

**Steg (føyes til tabellen i 5):**

| #   | Steg                                                                                                                                                            | Test                                                                               | Tid   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----- |
| 7   | `entitet.md` for 6 karakterer: slå sammen beskrivelse.txt, CONTENT_GUIDE, historie og kommentarer. Dette er mest redaksjonelt arbeid, og forfatteren godkjenner | gjennomlesning; `render()` gir samme utseendetekst → 0 nye ⚠                       | 3 t   |
| 8   | Generatorer: prompter, TTS-stil, `entiteter.json`, CONTENT_GUIDE-blokk                                                                                          | `medie.py --selvtest`; `media:plan` (TTS ⚠ bare hvis teksten endres); `pnpm check` | 2 t   |
| 9   | `entiteter.test.ts` (punkt 1, 3, 4; 2 som advarsel). Rett ekte funn eller hvitlist dem                                                                          | `pnpm test`; falsifiser: sett `fra_dag` for Winter til 24 → rød                    | 2,5 t |
| 10  | Steder og objekter (`entitet.md`, utseende + fakta)                                                                                                             | som 8                                                                              | 1,5 t |

Tillegg ca. 9 t, til sammen ca. 20 t. Steg 7–9 må vente på Hjerterud-renamen, fordi de skriver om `characters/` og navnelistene. Steg 9 fanger da også rester av «Nissemor» etter renamen. Prioritet før 1. desember: 9 (testen) gir mest trygghet per time. 7–8 kan gjøres etter jul hvis tiden blir knapp.

## 7. Hvert sted er en entitet

Hvert sted får en id under `assets/locations/`, også når bare ett spill bruker det. Spillstillbilder og slede-horisonter i `medier.json` har feltet `sted` med denne id-en. Foreløpig peker `bilde` fortsatt på dagens filer, så statusene står. Mappene med `beskrivelse.txt` og kanonisk ref lages i steg 3–5. Da byttes `bilde` til `locations/<id>#<variant>`.

| Sted-id                                                                   | Brukes av                                  | Filer i dag                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `snofall-landsby`                                                         | TV `landsby-*`, `port-*`                   | `locations/snofall-landsby/` (nokkelramme*.jpg, still-*.jpg)                        |
| `torget` (ny, fra snofall-landsby)                                        | `spill/torget` (Ugleposten)                | `snofall-landsby/nokkelramme-rolig.jpg`, `varianter/torget-spill.still.prompt.txt`  |
| `porten` (ny, fra snofall-landsby)                                        | `spill/port-aapen`, TV `port-*`            | `snofall-landsby/port-nokkelramme*.jpg`; `spill/port-aapen.jpg` har ingen jobb ennå |
| `iq-verksted`                                                             | `spill/iq-verksted`                        | `locations/iq-verksted/vidvinkel-tom.jpg`, `varianter/spill.still.prompt.txt`       |
| `julius-kontor`                                                           | `spill/julius-kontor`, TV `kontor-*`       | `locations/julius-kontor/ref-tom.jpg`, `vidvinkel-*.jpg`                            |
| `antenne-tjern`                                                           | `spill/antenne-tarn`, TV `antenne-*`       | `locations/antenne-tjern/ref.jpg`                                                   |
| `krystallgrotten`                                                         | `spill/kulde-grotte`, TV `grotte-*`        | `locations/krystallgrotten/ref.jpg`, `nokkelramme.jpg`                              |
| `hytta` → `antenne-tjern`                                                 | Ugleposten K2 «hytta»                      | del av tjernet (mottakeren står i hytta), ikke et eget sted                         |
| `tundra`, `nordtoppen`, `muren`, `julenatt`                               | `slede/<id>` (SLEDEFLUKT-horisont)         | `torget/ref.jpg` + `prompts/slede/<id>.txt`                                         |
| `vardeloypa`, `granskogen`, `stjernedrysset`, `kastevind`, `tindeflukten` | slede-etapper i `slede.ts` (id-ene derfra) | bare beskrivelse; låner en av de fire horisontene                                   |

`sledeflukt/` blir da bare en gruppe av maler (`prompts/slede/`), ikke et sted.

## Status

- [x] Steg 1: `render()` i medie.py fyller `{{navn}}`, `{{kind/id}}`, `{{stil}}` og `vars`; `#variant` → ref-sti via entitet.json. Mal uten plassholdere brukes som den er. Selvtest: `medie.py --selvtest` (kjøres også av `generer.py --selvtest`)
- [x] Steg 2: `assets/medier.json` har slede-, spill-, portrett- og TV-jobbene (64 oppføringer med mellomstillbilder, generator `mellomstill`). generer.py og tv-loops.sh leser den; `medie.py tv` og `medie.py stiller <id>` gir shell-linjene. Etter rebase på Hjerterud-renamen: `tv/port-hjerterud` og `portrett/hjerterud` står i medier.json; `landsby-nissemor` er droppet. Planen er lik main sin (63 elementer). Kontroll: `generer.py plan`, inventar (JSON og INVENTAR.md) og køkommandoene er identiske før og etter (MEDIA_DIR = ekte bibliotek).
- [x] Steg 3: `{{id.FELT}}` henter én merket linje fra `beskrivelse.txt` (`KARAKTER:`, `KLÆR:` …). `source_text` fyller malen før hashing, og `write()` lagrer malen (ikke `out/prompts/`), så flytting av tekst inn i plassholdere endrer ingen status. Bare ordrette kopier ble trukket ut: `port-iq` (`{{iq.KARAKTER}} {{iq.KLÆR}}`) og `port-julius` (`{{julius.KARAKTER}}`). Winter-promptene (port-winter, hendelse-winter, torget-spill, portrett) og hendelse-iq/-julius har omskrevet tekst; å bytte dem til plassholdere gir ny tekst og ny generering, så det venter på godkjenning. Portrettjobber for iq, julius og rampenissen er lagt til (alle ✓). generer.py spør nå sidefilen for bilder som ikke står i media.ts-manifestet; det fjerner `portrett:winter` fra køen, som før ble lagt der som «mangler» selv om filen er ✓ (laget etter nytt Winter-design).
- [x] Steg 4: promptene ligger i `assets/prompts/{tv/<sted>,spill,slede,portrett}/`, mellomstillbildene i `assets/out/stills/<sted>/`, refs har nye navn (`winter/ref-outside.jpg`, `ref-tophat.jpg`, `porten/ref.jpg`, `torget/ref.jpg` …). Avvik fra planen: sidefilene i MEDIA_DIR skrives ikke om. `assets/flyttet.json` (gammel → ny) brukes av `medie.located()`, så gamle stier (også absolutte fra en annen sjekkut) finnes fortsatt, og main og grenen ser samme status uten at mediebiblioteket endres. `python3 assets/bin/medie.py flytt` flytter de gitignorerte bildene (idempotent); kjør den i hovedsjekkouten etter merge. Julius' `ref-v3.jpg` beholder navnet: stien står i julius.sh over `curl`, og en endring der ville gjort alle Julius-videoer ⚠. Plan og inventar er uendret.
- [x] Steg 5: alle figurer og steder har `entitet.json` (navn, refs, standard_ref, ev. `avledet_fra`). Nye steder med `beskrivelse.txt`: `torget`, `porten`, `antenne-tjern` (med hytta), `krystallgrotten` og de ni slede-etappene. `objects/` har postkasse, klementin, slede, brevfugl og flosshatt. `lille-pjokk` er utelatt fordi ingen kilde nevner den. medier.json bruker `kind/id#variant` for bilder og refs og har `sted` på hver jobb. `spill/port-aapen` er sporet som `skaler` (nedskalert `porten#open`, ingen API, aldri i køen). `medie.py brukt-av <entitet>` regner ut bruken. Ingen mal bruker `{{objects/…}}` ennå: ingen prompt har en ordrett kopi, og omskriving gir ny generering. Plan og inventar er uendret.
- [x] Håndlagde filer: en fil forfatteren har laget selv, får `"generator": "hånd"` i `medier.json` og originalen som variant i entiteten (`bilde`: `locations/torget#spill` = `torget/ref-spill.jpg`). Som `skaler` er den sporet, men `generer.py` legger den aldri i køen, heller ikke med `--force`. Dette står i git; en «godkjent»-vurdering i `media-vurdering.json` ligger bare i MEDIA_DIR og kan nullstilles fra guiden, så den brukes ikke til dette. Første tilfelle: `spill/torget` (1920×1080, beskåret fra `ref-spill.jpg`). Ugleposten K1: stempelputa, skrinet og Winter er flyttet til det nye bildet; de andre feltene og fjæra passer. Planen mister bare `spill:torget`; inventaret er uendret.
- [x] `generer.py --selvtest` peker MEDIA_DIR til en tom mappe, så resultatet ikke avhenger av det ekte biblioteket.
- [x] Steg 7: hver figur, hvert sted og hver ting har `entitet.md` i stedet for `entitet.json`: en JSON-blokk (navn, refs, standard_ref; for figurer også pronomen, fra_dag, forhold, fakta med dag og `ikke`-fraser) og seksjonene Utseende, Personlighet, Stemme og Gjør / ikke gjør. Avvik fra planen: utseendet blir i `beskrivelse.txt`, og «## Utseende» peker dit. julius.sh leser den filen, og stien inngår i promptversjonen; å flytte teksten ville gjort alle Julius-videoer ⚠. Hjerterud har «Nissemor» i `ikke`; Winter er «han». Teksten er et utkast fra CONTENT_GUIDE, historie-2026 og beskrivelse.txt og skal godkjennes av forfatteren.
- [x] Steg 8: `medie.entity()` leser `entitet.md`; `image()` henter refs derfra. `{{winter.personlighet}}` gir en seksjon (brukes ikke i noen mal ennå). `RAMPE_STYLE` er `TTS:`-linja i Rampenissens «## Stemme», ordrett som før. `mise run entiteter` (`medie.py entiteter`) skriver `src/data/entiteter.json` og blokken mellom `<!-- entiteter:start/slutt -->` i CONTENT_GUIDE; `--sjekk` sier om de er utdatert. Merk: TTS-linja sier Tromsø, mens skrivereglene sier Bodø/Salten. Den er ikke endret, fordi alle klipp da blir ⚠.
- [x] Steg 9: `entiteter.test.ts` bruker samme liste over synlig tekst som `kodelekkasje.test.ts` (`src/lib/__tests__/synlig-tekst.ts`). Feil: navn som ligger nær et navn (Levenshtein 1, 2 for navn over 7 tegn; IQ uten hensyn til store og små bokstaver; genitiv godtas), figur nevnt før `fra_dag`, `ikke`-fraser, og utdatert fixture eller CONTENT_GUIDE-blokk (kaller `medie.py entiteter --sjekk`). Pronomen gir bare `console.warn` (tre falske treff i dag). Falsifisert: Winter med `fra_dag` 24 gir rødt. Alle fem figurene nevnes allerede dag 1 (om-snofall.txt), så `fra_dag` er 1.
- [x] Steg 10: steder og ting har `entitet.md` med metadata og en peker til `beskrivelse.txt`; fakta er ikke fylt inn. Ingen mal bruker `{{objects/…}}`, fordi ingen prompt har en ordrett kopi av en ting-beskrivelse. Plan og inventar er uendret (bortsett fra `spill:torget` over).
