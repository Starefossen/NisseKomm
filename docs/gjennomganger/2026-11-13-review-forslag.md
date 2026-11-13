# Forslag: raskere gjennomgang av medier (13.11.2026)

Kun lesing. Ingen kode endret, ingen betalte kall.

## 1. Slik går det i dag

1. `julius-dag.py <dag> --suffix -vN` lager 4–5 segmenter (`assets/out/dagNN-S.raw.mp4`).
   Et segment gjenbrukes når `dagNN-S.take.json` har samme `[replikk, sekunder, handling]`.
   Ellers betales ett nytt kall (~17 kr), deretter transkripsjon og revisjon (to billige kall).
2. Avvik skrives til `assets/out/dagNN[-vN]-flagget.txt` (finnes nå for dag06-v8, dag12-v3, dag13-v2).
   Fila vises ikke noe sted i guiden.
3. Segmentene skjøtes til `video/julius/dag-NN-vN.mp4`. Hans ser hele videoen på `/nissemor-guide/media`
   eller i Gjennomgang og skriver fritekst i Godkjent/OK/Lag på nytt.
4. En agent leser notatet med `mise run vurderinger`, finner selv ut hvilket segment det gjelder,
   endrer manus eller sletter take og kjører på nytt.

Tall:
- `forbruk.jsonl`: 111 linjer, 10 videokall, 92 transkripsjoner, 5 TTS, 4 bilder (loggen startet 12.11,
  så eldre forbruk mangler). Dag 13 alene: 5 videokall.
- `media-vurdering.json`: 22 Julius-vurderinger. Dag 1, 2, 3, 5 og 6 har gått 3–8 runder (dag06 er på v8).
- Notatene peker nesten alltid på ett sted: «"klementiner" blir kuttet», «"gom snøfall andre advent"»,
  «"IQ har én regel" and then it cuts», «Volume too low, incorrect microphone». Ingen har tidskode.
- Flaggfila for dag13-v2 sa allerede «mangler: lucia morgen» og «ekstra ord: sulele til sule …»,
  altså det Hans ellers må høre selv.

Sløsing:
- Hans ser 60–75 s video for å finne én feil på 15 s. Ved godkjenning av ny versjon må han se alt på nytt,
  også de 3–4 segmentene som er like (gjenbrukte råklipp). v6/v7 av dag 6 ser ut som nye versjoner,
  men skiller seg bare i ett segment.
- Agenten oversetter fritekst til segment for hånd og gjetter av og til feil (ett kall ≈ 17 kr bortkastet).
- Maskinens sjekk finnes, men Hans ser den ikke, så han vurderer det maskinen allerede har funnet.

## 2a. Manusport per segment (før video)

Manus skal godkjennes før det betales for video. I dag finnes ingen manusvurdering i
`media-vurdering.json` (ingen `manus/`-nøkler), selv om elementet `manus/julius/dag-NN` finnes i Gjennomgang.

- **Id:** `manus/julius/dag-13#s3`. Versjon = sha256 (12 tegn) av `[replikk, sekunder, handling]`,
  samme nøkkel som `take.json` allerede bruker. Endret tekst → «ny versjon, ikke vurdert».
- **Visning i guiden** (manus-raden i Gjennomgang): én rad per segment med replikk, handlingstekst,
  ordtall og anslått tid (`timing`/`wcount` finnes), lint-advarsler fra `julius-dag.py lint` (inkl.
  setninger som har kostet tagninger, linje ~190), gåtebiten markert (låst segment). Tastene G/O/L/N.
- **Port i `julius-dag.py`:** før `julius.sh` kalles sjekkes at segmentets manus er godkjent/ok med
  samme hash. Ellers stopp med «dag13 s3: manus ikke godkjent». `--uten-manusgodkjenning` bare etter
  uttrykkelig ja fra Hans. ~15 linjer, leser samme JSON som låsen i punkt 2.
- **Samme port der det passer:** TV-looper og stillbilder (hash av ferdig prompt fra `medier.json`-malen,
  id `prompt/<jobb>`) i `generer.py`/`tv-loops.sh`; radiomanus (`manus/radio/dag-NN`) før TTS. Bilder
  og radio er billige, så de kan komme etter Julius.

**Ikke godkjent i dag, dag 14–24:** alle 50 segmenter (14: 4, 15: 5, 16: 4, 17: 4, 18: 4, 19: 4,
20–24: 5 hver), hvorav 29 låste gåtebit-segmenter. Med ~1 min per segment er det under én time for Hans,
mot ~17 kr per feiltagning som ellers skyldes manus.

## 2. Hovedforslag: vurdering per segment for Julius

**Id-er.** `video/julius/dag-13#s3`. Uten versjon i id-en, så vurderingen følger segmentet på tvers av -vN.
Versjon (for `vurdering-versjon.ts`) = sha256 av `dagNN-S.raw.mp4` (12 tegn). Samme råklipp = samme
versjon = vurderingen står. Nytt klipp = «ny versjon, ikke vurdert», bare for det segmentet.

**Sidefil.** `julius-dag.py` skriver ved skjøting `dag-NN-vN.segmenter.json` ved siden av videoen:
`[{s, start, slutt, replikk, hørt, dekning, mangler, ekstra, revisjon[], hash}]`. Start/slutt finnes allerede
i `join` (span per segment etter trim og krysstoning). Ingen nye betalte kall: tallene kommer fra kjøringen.

**Segmentstripe under spilleren** (i `media/kort.tsx` og Gjennomgang, bare når sidefila finnes):
- én rad per segment: ▶ (spiller fra `start` til `slutt`), status, G/O/L, notatfelt;
- manus mot hørt tekst, ord som mangler i rødt, ekstra ord i gult (ord-diff, ingen ny avhengighet);
- revisjonsfunn med tidskode som lenke (`video.currentTime = start + t`);
- segmenter med samme hash som en godkjent vurdering vises grå med «✓ godkjent i v6» og trenger ikke ses.
Tastene G/O/L/N/P virker på valgt segment; piltast opp/ned bytter segment.

**Lag på nytt for ett segment.** Finnes nesten: et segment uten gyldig `take.json` lages på nytt ved neste
kjøring, ellers gjenbrukes det. Det mangler et flagg som tvinger ett segment. Forslag:
`julius-dag.py 13 --suffix -v3 --segment 3` (kan gjentas). Det sletter `dag13-3.take.json` før løkka og
legger til `--force` for målfila. Ca. 5 linjer.
Låsing: segmenter med vurdering godkjent/ok på samme hash får aldri nytt kall, heller ikke med `--alle`.
`julius-dag.py` leser `media-vurdering.json` direkte (samme fil, ingen API). Dette er sparetiltaket.

**Agentflyt.** `mise run vurderinger --prefiks video/julius/` gir nå én linje per segment:
`dag-13#s3 lag_paa_nytt «sier sulele…» → julius-dag.py 13 --suffix -v3 --segment 3`. Agenten trenger
ikke tolke.

**Skjøting.** Ny -vN lages automatisk av godkjente råklipp + de nye. Vurdering av hele videoen
(`video/julius/dag-13-v3.mp4`) blir én rask sjekk av overganger og slutt, ikke ny gjennomsyning av alt.

Innsats: M (2–3 dager agentarbeid). Sidefil + `--segment` + lås: S. Stripe i UI: M.
Gevinst: Hans ser ~15 s i stedet for ~70 s per runde; agenten treffer riktig segment; ingen betalte
kall på godkjente segmenter. Med 11 dager igjen og typisk 2–3 runder: anslag 30–50 færre videokall
(500–850 kr) om låsen hindrer at segmenter lages på nytt ved feiltolkning, og flere timer av Hans' tid.

## 3. Andre forbedringer (gevinst / innsats)

| # | Tiltak | Gevinst | Innsats |
|---|---|---|---|
| 1 | Vis flaggfila på kortet (`dagNN-vN-flagget.txt`, rød boks «Maskinen fant: …») | Høy | S |
| 2 | Skjul duplikater: samme innholdshash som forrige versjon → «identisk med v6», ikke i køen | Høy | S |
| 3 | Dagens kø: bare nye/flaggede, sortert på dag, «neste» etter lagring (Gjennomgang har det meste) | Høy | S |
| 4 | Hurtigmerker ved notat: `klipp`, `mikrofon`, `volum`, `pause`, `uttale`, `manus` + tidskode fra spilleren (knapp «@0:42») | Middels | S |
| 5 | Merker blir «unngå»-regler: `mikrofon` 2+ ganger → forslag i `julius-dag.py` sin regelliste (linje ~190), agent godkjenner | Middels | M |
| 6 | Side ved side gammel/ny for samme segment (to `<video>`, synkron start) | Middels | S |
| 7 | Batch-godkjenning: «Godkjenn alle uten flagg» i filteret | Lav–middels | S |

Forbilder (bare det som passer):
- Frame.io/SyncSketch: notat festet til tidskode, klikk hopper dit. Det er punkt 4.
- ShotGrid: vurdering per «shot» (segment) og versjon, godkjent shot låses. Det er hovedforslaget.
- Prodigy: én ting om gangen, tastatur, maskinens forslag ferdig utfylt. Det er punkt 1 og 3.

## 4. Ikke gjør før 1. desember

- Ingen tegning/markering i bildet (Frame.io-stil annotering). Tekst + tidskode holder.
- Ikke automatisk nytt kall etter «Lag på nytt». Et menneske eller en agent starter kjøringen (budsjett).
- Ikke per-segment for TV-looper, bilder eller radio. Bare Julius har segmenter.
- Ikke flytt vurderinger til database eller nytt format. Samme JSON, nye id-er med `#sN`.
- Ikke automatisk regelendring i prompten uten at noen godkjenner.
- Ikke bygg om Gjennomgang-matrisen.

## 5. Beslutninger for Hans

1. **Manusport før video (punkt 2a), med `--uten-manusgodkjenning` bare på ditt ja?** Anbefaling: ja, i dag, før neste videokall; godkjenn dag 14–24 (50 segmenter) først.
2. **Per-segment-vurdering for Julius dag 14–24 og omtak?** Anbefaling: ja, start med sidefil, `--segment` og lås (S) i dag; stripe i UI etterpå.
3. **Skal godkjent segment være låst også mot `--alle`?** Anbefaling: ja; opplåsing bare ved å fjerne vurderingen i guiden.
4. **Må hele videoen vurderes etter skjøting når alle segmenter er godkjent?** Anbefaling: ja, men bare én rask sjekk (overganger, slutt); egen status «skjøt OK».
5. **Gamle vurderinger (dag 1–13):** konvertere til segment? Anbefaling: nei, la dem stå; nytt opplegg gjelder nye versjoner.
