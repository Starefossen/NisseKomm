# Asset-bibliotek for NisseKomm 2026

Kildene for alt generert innhold: referansebilder, beskrivelser og nøyaktige prompter. Målet er at hver figur og hvert sted ser likt ut på tvers av videoer, loops og varianter, også når noe lages på nytt.

## Struktur

```text
assets/
  stil.md                     Felles visuell stil og lyd for hele sesongen
  bin/                        Skript for generering og etterbehandling
  characters/<navn>/          Figurer: beskrivelse, entitet.json, ref-*.jpg, replikker
  locations/<sted>/           Steder: beskrivelse, entitet.json, ref-*.jpg
  objects/<ting>/             Ting som går igjen: beskrivelse, entitet.json
  prompts/<app>/              Promptmaler (tv, spill, slede, portrett); {{winter}}, {{iq.KLÆR}}, {{objects/postkasse}}, {{stil}}
  medier.json                 Alle avledede filer: mal, grunnbilde, refs og sted -> ut-sti
  flyttet.json                Gammel -> ny sti for flyttede filer; sidefilene beholder gamle stier
  out/                        Genererte filer og mellomstillbilder (out/stills/, ikke i git)
```

Etter `git pull` som flytter refs: kjør `python3 assets/bin/medie.py flytt` (flytter gitignorerte bilder, trygt å kjøre flere ganger). Plan og status: `docs/asset-struktur.md`.

## Regler

1. **Referansebildet er fasit.** Alle varianter av et sted lages fra samme referansebilde eller fra et bilde laget av det. Da hopper ikke rommet når Snøfall TV bytter variant.
2. **Beskrivelsen limes inn ordrett.** Skriptene leser `beskrivelse.txt` og legger den inn i hver prompt. Endrer du utseendet, endrer du filen, ikke prompten.
3. **Lite bevegelse.** Låst kamera, rolig scene, figurer små i bildet. Mye bevegelse gir flere KI-feil.
4. **Skjøten skjules i etterkant.** `bin/seamless.sh` krysstoner slutten inn i starten, så loopen går rundt uten hopp.
5. **Én ting endres per variant.** Tom versjon, nordlys, frost og lignende lages ved å endre bare det ene og beskrive resten som «nøyaktig samme».
6. **Ferdige filer flyttes til `public/`.** `out/` er arbeidsmappe og ligger ikke i git. Det som skal brukes i appen, kopieres til `public/feed/` eller `public/video/`.

## Skript

| Skript                                                  | Hva det gjør                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `bin/still.sh <inn.jpg> <prompt.txt> <ut.jpg>`          | Lager et nytt stillbilde fra et referansebilde (bildemodell) |
| `bin/loop.sh <inn.jpg> <prompt.txt> <navn> [sek]`       | Lager en loop fra et stillbilde og skjuler skjøten           |
| `bin/seamless.sh <inn.mp4> <ut.mp4> [fade]`             | Krysstoner slutten inn i starten                             |
| `bin/julius.sh <navn> "<replikk>" ["<handling>"] [sek]` | Lager et klipp av Julius' videologg med opptaksfilter        |
| `bin/portrett.sh <prompt.txt> <ut.png> [ref.jpg ...]`   | Kvadratisk portrett til Nissespill (dialogbokser)            |
| `bin/piksel.sh <inn> <ut.png> [px] [farger]`            | Pikselutgave med liten palett (ffmpeg), til `public/spill/`  |

Nøkkelen hentes med `fnox get GEMINI_API_KEY` fra prosjektmappen. Modeller: `gemini-3-pro-image` for bilder, `gemini-omni-1.2-flash` (Interactions API) for video.

## Innhold så langt

| Mappe                       | Status                                                                           |
| --------------------------- | -------------------------------------------------------------------------------- |
| `characters/julius`         | Beskrivelse, faste replikker. Referansebilde i `locations/julius-kontor/ref.jpg` |
| `characters/iq`             | Beskrivelse, referansebilde                                                      |
| `locations/julius-kontor`   | Referansebilde (Julius ved pulten)                                               |
| `locations/iq-verksted`     | Vidvinkel med IQ i bakgrunnen, og tom versjon i samme utsnitt                    |
| `locations/snofall-landsby` | Nordlys-versjon og rolig natt                                                    |
