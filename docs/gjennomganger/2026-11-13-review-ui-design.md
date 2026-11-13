# Gjennomgangsriggen: én modell for alt som vurderes (13.11.2026)

Kun design. Ingen kode endret, ingen betalte kall. Bygger på `review-forslag.md` (godkjent).
Endring fra Hans underveis: dag 1–13 og alle gamle vurderinger flyttes inn i samme modell.
De vurderes ikke på nytt; godkjent forblir godkjent. Det erstatter «la dag 1–13 stå».

## 1. Dagens sider og hvor de overlapper

| Side | Hva Hans gjør der | Overlapp |
|---|---|---|
| Media (`/media`) | Ser filer, filtrerer («Hva gjenstår»), vurderer på kortet, «Ta i bruk vN» | Vurdering finnes også i Gjennomgang. Filteret finnes i to utgaver (`filter.ts` og `UTVALG`). |
| Gjennomgang | Matrise 24 dager × 7 kolonner + ekstrarader, `?id=` åpner ett element med tastene G/O/L/N/P | Eneste sted med guideseksjoner og medier sammen, men viser ikke flagg, segmenter eller forbruk. |
| Vurderinger | Liste over alt som ikke er godkjent, nyeste først | Samme data som «Hva gjenstår», uten forhåndsvisning. Blander «venter på Hans» og «venter på agent». |
| Dagvisningen | `Vurder` på delsystemer og Varden; gåtekart, kveld og strek vurderes i Gjennomgang | Samme id-er, annen inngang. Viser ikke medienes status samlet. |
| Bibliotek | Lenker til Gjennomgang, Media, Vurderinger, entiteter, merker | Ren meny. |

Hopping i dag: en Julius-runde krever Media (se video) → terminal (flaggfil) → Gjennomgang (manus) →
Media («Ta i bruk»). Ingen side svarer på «hva venter på meg nå?» uten at Hans velger filter først.

**Forslag: fire flater, én komponent for vurdering.**

```
GJENNOMGANG
 ├─ Kø         «Venter på deg (7)» · «Hos agent (4)» · «Lærdom»      ← åpner her
 ├─ Element    ?id=…  ett element, tastatur, alle typer               ← eneste sted det vurderes
 ├─ Oversikt   matrisen (dag × kolonne + ekstrarader), per sesong
 └─ Filer      versjoner, «Ta i bruk», arkiv, inventar (dagens Media)
```

- **Kø** erstatter Vurderinger-siden og «Hva gjenstår» på Media og i Gjennomgang. Sortert på dag, nærmeste først.
  Identiske versjoner (samme innholdshash som en godkjent) kommer aldri i køen.
- **Element** er dagens `?id=`-visning, utvidet per type (kapittel 3). Kortet på Media og `Vurder` i dagvisningen
  bruker samme komponent, så en vurdering ser lik ut overalt.
- **Oversikt** er matrisen som den er. Kolonner og ekstrarader leses fra typeregisteret (kapittel 2), ikke fra `KOLONNER`.
- **Filer** er Media-siden uten egen vurderingsflyt: versjonshistorikk, «Ta i bruk», arkiv, sidefiler, hva som mangler.
- **Bort:** Vurderinger-siden (omdirigering til Kø med filter), `UTVALG` i Gjennomgang, «Gjennomsyn» på Media.
- **Dagvisningen** får én statuslinje: «Dag 14: 3 venter på deg, 1 hos agent» med lenke til køen for dagen.

## 2. Én elementmodell

Alt som vurderes er et **element**. Vurderingen hører til **innholdet** (en hash), ikke til filnavnet.

```
Element
  id        stabil, uten versjon og uten år: video/julius/dag-13, …#s3, manus/julius/dag-13#s3,
            video/tv/kontor-dag14.mp4, strek/dag10.png, dag/04/gaatekart, dag/04/utskrifter
  type      slår opp i typeregisteret
  sesong    2026 (felt i lageret, ikke i id-en)
  dag       valgfri
  deler     valgfri: #s1…#s5 og #skjøt for Julius. Foreldrenes status = verste del.
  versjoner filer på disk: gjeldende, -vN, .old-N, hver med innholdshash
  vurdering per hash: {vurdering, notat, merker[], tid?, oppdatert}
  historikk alle tidligere vurderinger, aldri slettet
```

**Steg regnes ut, de lagres ikke.** Bare vurderingene lagres. Resten kommer av fakta på disk:

| Steg | Fakta |
|---|---|
| 1 Utkast | kildetekst/prompt finnes, ingen gyldig vurdering av den |
| 2 Manus godkjent | `manus/…` eller `prompt/…` har godkjent/ok på gjeldende hash (bare typer med manusport) |
| 3 Generert | fil + sidefil (`.meta.json`) finnes |
| 4 Maskinsjekket | `segmenter.json`/flaggfil/inventarstatus finnes. Typer uten sjekk hopper over. |
| 5 Godkjent av Hans | godkjent/ok på hashen til nyeste versjon |
| 6 I bruk | filen uten -vN har den godkjente hashen |

Sidetilstander: «lag på nytt», «utdatert» (kilden endret etter generering), «mangler».
**Hvem har ballen** regnes også ut: Hans har steg 1, 3–4 og «godkjent, ikke tatt i bruk». Agenten har
«lag på nytt», «manus godkjent, ikke generert», «utdatert» og «mangler». Ny fil etter «lag på nytt» sender
elementet tilbake til Hans av seg selv (det gjør `ny_versjon` allerede).

**Typeregister** (`src/lib/vurdering-typer.ts`, én tabell; `typeAv` i `filter.ts` og `KOLONNER` flyttes hit):

| Type | Visning | Manusport | Maskinsjekk | Merker | Omtak |
|---|---|---|---|---|---|
| Manussegment (Julius) | tekst | er porten | lint, ordtall, tid | manus, lengde, tone | rediger manus |
| Julius-segment | video (del) | ja | manus mot hørt, revisjon | klipp, mikrofon, volum, pause, uttale | `julius-dag.py N --segment S` |
| Julius-video (skjøt) | video | – | varighet, overganger | overgang, slutt | skjøt på nytt (gratis) |
| TV-loop | video (loop) | prompt | – | loop-hopp, stil, figur | `tv-loops.sh` |
| Radio | lyd | manus | varighet | uttale, tempo, dialekt | `rampenissen-tts.sh` |
| Rampestrek, pikselscene, portrett, ikon, figur | bilde | prompt | utdatert-sjekk | stil, figur, tekst i bildet, utsnitt | `generer.py <jobb>` |
| Musikk/feed | lyd/bilde | – | – | – | hånd |
| Utskrift | side (iframe) | – | tester | skrivefeil, layout | kode/tekst |
| Guideseksjon (gåtekart, kveld, historien …) | side | – | tester | fakta, språk | tekst |
| Spilldel (Ugleposten-kapittel, etappe) | lenke + notat | – | tester | – | kode (ingen hash) |

Ny sesong = ny `sesong`-verdi, nytt lager og nye kilder. Typeregisteret og visningene står urørt.
Ingenting i modellen kjenner «24 dager» eller «Julius»; det ligger i sesongens elementliste.

### Lager og migrering

`MEDIA_DIR/media-vurdering.json` (219 oppføringer i dag) blir format 2:

```
{ "format": 2, "sesong": 2026,
  "elementer": { "video/julius/dag-06": {
      "type": "julius-video",
      "vurderinger": { "<hash>": {vurdering, notat, merker, oppdatert, fil: "dag-06-v7.mp4"} },
      "historikk":  [ {vurdering, notat, oppdatert, fil, versjon?} ] } } }
```

Regler for flyttingen (ett skript, kan kjøres flere ganger, gammel fil beholdes som `.format1.json`):

1. **Id:** `-vN` og `.old-N` strykes fra id-en (56 oppføringer). De blir vurderinger på samme element, med `fil` bevart.
2. **Hash:** har oppføringen `versjon` (`size-mtime`) og den stemmer med filen nå, beregnes innholdshash og
   vurderingen står. Stemmer den ikke, eller filen er borte, går vurderingen til `historikk` (i dag vises den
   alt som «forrige versjon»).
3. **Uten `versjon`** (100 oppføringer): dagens regel brukes én gang (sidefilens `created` nyere enn
   `oppdatert` = endret). Ellers stemples gjeldende hash.
4. **Guideseksjoner og utskrifter:** hashen av bakt innhold beholdes som den er.
5. **Rydding:** «Lag på nytt» som visningstekst (3 stk.) blir `lag_paa_nytt`. Notat uten vurdering (6 stk.) beholdes.
6. **Julius dag 1–13:** blir element med én del («hele»). Segmenter kommer først når et omtak lages.
   Ingenting vurderes på nytt.

Kontroll: regn ut cellen for hvert element før og etter flytting. Forskjellen skal være null, og antall
vurderinger inn = antall ut (vurderinger + historikk). Det er testen som følger skriptet.

Overgang: `/api/media/vurdering` og `list_vurderinger` fortsetter å levere dagens form (`{id: {vurdering,
notat, forrige}}`) som en visning av format 2. Sidene kan da byttes én om gangen.
**Til fase 1-agenten:** les og skriv vurderinger gjennom én funksjon i `medie.py` (`vurdering(id, hash)`), ikke
`json.load` flere steder. Id-ene `…#sN` med sha256-versjon er allerede i målformen og flyttes 1:1.

## 3. Elementvisningen

Felles ramme for alle typer: topplinje (id, steg, hvem har ballen), innhold, maskinens funn, notat med merker,
historikk. Taster: `G` godkjent · `O` OK · `L` lag på nytt (fokus i notat, Enter lagrer) · `N`/`P` neste/forrige
i køen · `↑↓` del · `mellomrom` spill/pause · `T` sett inn tidskode · `1–9` merke · `V` bytt gammel/ny.

**Video med segmenter (Julius)**

```
┌ video/julius/dag-13 · v3 · steg 4 maskinsjekket · venter på deg ───── 14 kr brukt, 1 640 kr igjen ┐
│ ┌──────────────── video ────────────────┐  s1 ✓ godkjent i v2 (ikke spilt)                        │
│ │                                       │  s2 ✓ godkjent i v2                                     │
│ │                 ▶ 0:31                │ ▸s3 ○ NY   «Lucia-morgen i Snøfall …»                   │
│ └───────────────────────────────────────┘  s4 ✓ godkjent i v2                                     │
│ [s1▒▒▒|s2▒▒▒▒|s3████|s4▒▒▒|skjøt]          skjøt ○ (overganger, slutt)                            │
│ Manus: Lucia-morgen i Snøfall, og IQ har pyntet tårnet.                                           │
│ Hørt:  [Lucia-morgen] i Snøfall, og IQ har pyntet tårnet {sulele}.     [mangler] {ekstra}         │
│ Maskinen fant: ekstra ord 0:36 → hopp                                                             │
│ Notat: [@0:36 sier «sulele»____________]  (1)klipp (2)mikrofon (3)volum (4)pause (5)uttale        │
│ [G] Godkjent  [O] OK  [L] Lag på nytt → julius-dag.py 13 --suffix -v4 --segment 3  (~17 kr)       │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Køen åpner rett på første del som ikke er vurdert, og spiller bare den. Grå deler hoppes over.

**Bilde:** gammel (i bruk) og ny side ved side, `V` legger dem oppå hverandre og blinker mellom. Klikk =
zoom 1:1 (viktig for piksel og ikon: nærmeste nabo, vist i 32 px og 4×). Under: referansebildene fra sidefilen.

**Lyd (radio):** spiller + manus under. Samme «manus mot hørt» når transkripsjon finnes, `T` gir tidskode.

**Tekst/manus:** én rad per segment: replikk, handling, ordtall, anslått tid, lint-advarsler, låst gåtebit.
Endring siden forrige godkjenning vises som ord-diff. Ingen redigering i guiden; teksten eies av manusfilene.

**Side (utskrift, guideseksjon):** dagens iframe, med «endret siden sist» som diff der innholdet er tekst.

**iPhone:** én kolonne. Innholdet øverst, delene som vannrett stripe, merker som brikker, tre store knapper
festet nederst (G/O/L), sveip til siden = neste/forrige. Ikke side ved side: `V`-knappen bytter gammel/ny.

## 4. Koblingen til agentene

- **Én linje per element** i `mise run vurderinger`/`list_vurderinger`: id, vurdering, merker, tidskode, notat og
  omtakskommandoen fra typeregisteret. Agenten tolker ikke fritekst.
- **«Venter på Hans» / «venter på agent»** er to faner i køen og to filtre i MCP (`--hos hans|agent`). Regnes ut
  (kapittel 2), ingen egen tilstand å holde ved like. En agent som tar et element, skriver ingenting; ny fil flytter det.
- **Merker → «unngå»-regler:** `assets/laerdom.json` (i git, gjelder på tvers av sesonger):
  `{type: [{regel, merke, kilder: [id], godkjent}]}`. `medie.py` får `unngaa(type)` som generatorene legger i
  prompt eller lint (i dag en håndskrevet liste rundt linje 190 i `julius-dag.py`). Forslag til regel lages av en
  agent når et merke er brukt to ganger på samme type. Forslaget er et element av typen «regel» og går gjennom
  samme kø. Ingen regel virker før Hans har godkjent den. Dette er det som bærer lærdom til 2027.
- **Forbruk:** `forbruk.py rapport --json` skriver `MEDIA_DIR/forbruk.json` ved hver logging. Køen viser
  «i dag / siden 13.11 / igjen av 2000 kr». Ved «Lag på nytt» står anslått pris for omtaket (pris per type fra
  `PRIS`) og hva elementet har kostet til nå. Guiden bestiller ikke selv; den viser kommandoen og prisen.

## 5. Faser

**Før 1. desember** (skal lønne seg på dag 14–24 og omtak):

| # | Hva | Innsats |
|---|---|---|
| 1 | Manusport, sidefil `segmenter.json`, `--segment`, lås (pågår). Vurderinger via én funksjon i `medie.py`. | S–M |
| 2 | Format 2 + flytteskript + kontrolltest + dagens API-form som visning. Rett etter fase 1, før stripa. | M |
| 3 | Elementvisning for Julius: segmentstripe, manus mot hørt, flagg, merker og tidskode | M |
| 4 | Kø som forside i Gjennomgang (to faner), identiske versjoner skjult, Vurderinger-siden omdirigert | S |
| 5 | Forbrukslinje i køen og pris ved «Lag på nytt» | S |
| 6 | Bilde: gammel/ny med `V` og zoom (gjenstående piksel, ikon, strek) | S |

Rekkefølgen 2 før 3 er med vilje: stripa bygges én gang, på den nye modellen. Glipper tiden, tåler 4–6 å vente;
1–3 gir gevinsten på videokallene.

**Januar–oktober 2027:**

| Hva | Innsats |
|---|---|
| Typeregisteret fullt ut; matrisen og filtrene leser det, `KOLONNER`/`typeAv` slettes | M |
| Media blir «Filer»: vurderingsknappene bort derfra, bare versjoner, «Ta i bruk», arkiv | S |
| Sesongvelger: 2026 som lesbart arkiv, 2027 som ny sesong (nytt lager, samme rigg) | M |
| Manusport for TV-looper, bilder og radio (`prompt/<jobb>`, `manus/radio/…`) | S |
| `laerdom.json` + regelforslag i køen + `unngaa()` i alle generatorer | M |
| Lydvisning med manus mot hørt for radio; batch «godkjenn alle uten flagg» | S |
| Dagvisningens statuslinje; iPhone-utgaven pusset | S |

**Bygger vi ikke:**

- Tegning i bildet, kommentartråder, tildeling, roller og varsler (Frame.io/ShotGrid). Det er én anmelder.
- Database for vurderinger. Én JSON-fil per sesong holder for noen hundre elementer.
- Automatisk generering fra guiden. Budsjettet krever at noen starter kjøringen.
- Et arbeidsflytverktøy med steg som kan settes opp. Stegene er seks, faste og utledet.
- Aktiv læring og modellforslag (Prodigy). Vi tar bare «én ting om gangen, tastatur, maskinens funn først».
- Egen videospiller eller bildenøyaktig tidskode. `<video>` og hele sekunder holder.
- Redigering av manus i guiden. Kildene er markdown i git.

## 6. Beslutninger for Hans

1. **Vurdering knyttet til innholdshash på elementet, ikke til filnavn?** Anbefaling: ja. Det gir «identisk
   med v6» gratis, «Ta i bruk» trenger ikke stemple om, og dag 1–13 flyttes uten ny vurdering.
2. **Flytting til format 2 før 1. desember (fase 2), ikke i januar?** Anbefaling: ja, rett etter fase 1, med
   sikkerhetskopi og kontrolltesten «null endrede celler». Venter vi, bygges stripa to ganger.
3. **Gjennomgang åpner på køen, og Vurderinger-siden forsvinner (omdirigering)?** Anbefaling: ja.
4. **Media-siden mister vurderingsknappene?** Anbefaling: ja, men først i januar. Før jul deler den bare komponent.
5. **«Unngå»-regler virker først når du har godkjent dem i køen?** Anbefaling: ja. Én fil i git som følger
   med til neste sesong; vurderingene blir igjen i sesongens lager.
