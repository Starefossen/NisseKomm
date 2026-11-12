# Julius-promo 2026

To promovideoer for voksne (A) og en teaser (B). Ikke en del av sesongen: bakes ikke inn i guiden eller transkriptene. Lages med
`python3 -u assets/bin/julius-dag.py 90 --manus docs/manus/julius-promo.md --dest <mappe utenfor public> --cutaway <klipp>:<kutt>:<sek> … --plakat <bilde>`.
Innklippene er raske montasjer fra appen (0,7–1,4 s per bilde, glitch mellom): ta opp med Playwright mot en egen dev-server og klipp med `python3 assets/bin/promo-montasje.py <opptak-A> <opptak-B> <ut>`; bildelisten står i skriptet. B viser bare skrivebordet uskarpt, Snøfall TV og kalenderen uten «NOE ÅPNER».

Full klipp (v4): lag Julius uten innklipp (`julius-dag.py 90 --manus … --join-only --dest <mappe> --plakat <bilde>`), ta opp appen med et skript som merker hvert bilde med navn, tid og et 16:9-utsnitt av vinduet, og kjør `python3 assets/bin/promo-montasje.py lag <julius.mp4> <opptak> A <ut.mp4>`. Den gir 1920×1080 med kort oppstart, skrivebordet og app-bilder over midten av hver replikk (Julius i bilde de første 2 s og siste 1 s); lyden hans går urørt under. Bildelisten står i `LAG`. Ferdige versjoner ligger i `MEDIA_DIR/promo/` (gamle som `.oldN`) og vises bare for foreldre.

## Dag 90 (promo) – Til de voksne

Kulde-nivå 0. Rent bilde og ren lyd. Fire segmenter, 67 ord.

1. **Replikk:** «Hallo, ja? Er det bare voksne her? Bra. Dette sier dere ikke til barna.»
   - Varighet: 11 s (14 ord)
   - Handling: Lener seg inn mot mikrofonen og holder venstre pekefinger foran leppene til segmentet er slutt.
   - Kulde: Ingen.
2. **Replikk:** «I år trenger Snøfall hjelp. Første desember åpner NisseKomm, direktelinjen vår hjem til Kristian, Håkon og Hanna.»
   - Varighet: 12 s (16 ord)
   - Handling: Følger en ledning på sentralbordet med venstre pekefinger, fra tavla og ut mot kanten.
   - Kulde: Ingen.
3. **Replikk:** «Rampenissen flytter inn hos dem. Han gjør rampestreker om natten og rapporterer til meg. Foreldrene sa ja, stakkars.»
   - Varighet: 13 s (18 ord)
   - Handling: Holder mikrofonen fast i høyre hånd hele tiden, inntil munnen; den slippes aldri og svever aldri. Venstre hånd løfter et ark fra brevbunken, han ser på det og rister på hodet, og venstre hånd legger det ned før siste setning.
   - Kulde: Ingen.
4. **Replikk:** «Hver dag får de en gåte. Halve svaret ligger i huset, resten på skjermen. Dere vet ingenting. Vi ses!»
   - Varighet: 14 s (19 ord)
   - Handling: Legger venstre hånd rundt trekoppen, løfter den som en skål på «Dere vet ingenting» og humrer.
   - Kulde: Klikk når mikrofonen slås av.

Lengde: 11 + 12 + 13 + 14 s minus tre krysstoninger på 0,25 s gir rundt 49 s. Klipper vi den stille halen i siste segment, blir det 47 s.

## Dag 91 (promo) – Teaser

Kulde-nivå 1. Svak knitring i lyden. Tre segmenter, 56 ord. Ingen navn på barna, ingen Rampenissen og ikke ordet NisseKomm.

1. **Replikk:** «Ja… hallo? Er det liv i jernvaren? Her er det Julius i Snøfall. Noe er på gang her oppe.»
   - Varighet: 14 s (19 ord)
   - Handling: Banker to ganger på mikrofonen med venstre pekefinger, lytter, og lyser opp.
   - Kulde: Svak knitring.
2. **Replikk:** «IQ har trukket en ny ledning. Den går ut av Snøfall, og jeg sier ikke hvor den ender. Ikke ennå.»
   - Varighet: 14 s (19 ord)
   - Handling: Følger en ledning på sentralbordet med venstre pekefinger helt ut til kanten, og lar hånden ligge der.
   - Kulde: Svak knitring.
3. **Replikk:** «Første desember skrur vi på. Det blir en kald desember, så kle dere godt. Julius over og ut!»
   - Varighet: 13 s (18 ord)
   - Handling: Legger venstre hånd rundt trekoppen og holder den der, som for å varme seg.
   - Kulde: Svak knitring, lampen blinker én gang på «kald», klikk når mikrofonen slås av.

Lengde: 14 + 14 + 13 s minus to krysstoninger gir rundt 40 s. Med en plakat på 4 s til slutt («1. desember») blir det 44 s.
