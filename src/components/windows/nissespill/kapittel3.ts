/**
 * Kapittel 3: «Gufset fra dypet» (dag 16). The children know who sits in
 * Krystallgrotten (M4, day 15) and Rampenissen wants to bring him a light, not
 * a fight. The chapter ends with a greeting and no answer: the first real
 * answer belongs to the main story (day 17). Side story only: no clues or codes
 * for the daily puzzles. Rampenissen speaks nordlandsk, everyone else bokmål.
 *
 * Images: reuses feed/julius-kontor.jpg and feed/kulde-grotte.png. New:
 * - spill/portrett-radio.png: pixel portrait of the old brass radio on the
 *   pedestal, frost on the dial, tubes glowing faint blue (the dialog shows the
 *   letter R until it exists).
 */
import type { Kapittel } from "./motor";

const R = "Rampenissen: ";

export const KAPITTEL_3: Kapittel = {
  n: 3,
  tittel: "Gufset fra dypet",
  dag: 16,
  klar: true,
  start: "kontor",
  slutt: "k3_ferdig",
  intro: [
    R +
      "«Dokker. Hør. Æ har tenkt. Heilt sia æ hørte sukket i isen har æ tenkt. Og no veit vi kem han e, han der nede i grotta. IQ bygde han. Og så glømte alle han.»",
    R +
      "«Æ vil ikkje slåss med han. Æ vil gi han nåkka. Et lys. Grotta e det mørkaste stedet i heile Snøfall, og ingen har vore der med lys på lenge. Knerten sitt hos Julius no. Julius e ute, men Nissemor e der.»",
    R +
      "«Problemet: det trekk nåkka forferdelig der nede. Alt som brenn, blås ut. Vi treng et lys som trekken ikkje tar. Og så sei vi hei. Bare det. TIPS-knappen, dokker veit.»",
  ],
  utro:
    R +
    "«Han svarte ikkje. Men han slo ikkje av lyset heller. Det står der no, nede i mørket, og krystallan sende det videre. Nissemor sei det e det snillaste æ har gjort. Æ sa det va dokker. Neste gang ... neste gang ska nån reise. Æ sei ikkje meir. Over og ut!»",
  gjenstander: {
    stearinlys: {
      id: "stearinlys",
      navn: "Tent stearinlys",
      ikon: "fire",
      se: "Et hvitt stearinlys som brenner rolig. Flammen bøyer seg når Knerten puster på den. Den liker ikke vind.",
    },
    tesil: {
      id: "tesil",
      navn: "Nissemors tesil",
      ikon: "tea",
      se: "En rund tesil av messing med fine, små hull. Lokk som smekker igjen. Lukter kamille. Nissemor vil ha den tilbake.",
    },
    tesil_lanterne: {
      id: "tesil_lanterne",
      navn: "Tesil-lanterne",
      ikon: "lightbulb",
      se: "Stearinlyset står inni tesilen med lokket på. Flammen lyser gjennom hundre små hull. Du puster på den. Den bryr seg ikke.",
    },
    krystallskaar: {
      id: "krystallskaar",
      navn: "Klart krystallskår",
      ikon: "diamond-gem",
      se: "Et skår av klar krystall, stort som en fyrstikkeske. Holder du det mot et lys, kommer lyset ut på den andre siden. Større.",
    },
  },
  kombinasjoner: [
    {
      a: "stearinlys",
      b: "tesil",
      gir: "tesil_lanterne",
      tekst:
        "Du setter lyset inni tesilen og smekker lokket igjen. Flammen står rolig bak messingnettet og lyser gjennom alle hullene. " +
        R +
        "«Ei lanterne av ei tesil! Gruvefolk gjor sånt. Nissemor veit alt.»",
    },
  ],
  scener: [
    {
      id: "kontor",
      navn: "Julius' kontor",
      bilde: "feed/julius-kontor.jpg",
      utganger: [{ til: "grotten", navn: "Ut vinduet og ned i grotten" }],
      hotspots: [
        {
          id: "juletreet",
          navn: "Juletreet",
          rect: { x: 4, y: 0, w: 30, h: 84 },
          smart: "se",
          se: "Et juletre med levende lys, røde kuler og småkaker. Én av småkakene mangler en bit. Bitene er på størrelse med et nissegap.",
          bruk: "Du rister forsiktig i ei grein. En kule svinger. En småkake faller. Knerten spiser den. Bevis fjernet.",
        },
        {
          id: "lampa",
          navn: "Lampa",
          rect: { x: 36, y: 14, w: 7, h: 14 },
          smart: "se",
          se: "Ei liten vegglampe med skjerm. Den lyser varmt og gult, akkurat nok til å lese julekort ved. Nissemor har lest fire hundre.",
        },
        {
          id: "bokhylla",
          navn: "Bokhylla",
          rect: { x: 42, y: 0, w: 12, h: 30 },
          smart: "se",
          se: "Gamle bøker med gullskrift på ryggen: «Snøfall gjennom tidene», «Reinsdyrstell», «Alt om sirup». Den siste er mest slitt.",
        },
        {
          id: "bamsen",
          navn: "Bamsen",
          rect: { x: 43, y: 30, w: 8, h: 10 },
          smart: "se",
          se: "En gammel bamse med ett øye og et nystrøket halstørkle. Han har sittet i hylla siden Julius var liten. Han har sett alt. Han sier ingenting.",
          bruk: "Du klapper bamsen. Han ser like rolig ut. Han er proff.",
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 56, y: 0, w: 40, h: 40 },
          smart: "se",
          se: "Et stort buevindu med rim på rutene. Utenfor ligger Snøfall blått og stille, og langt der ute blinker ei rød lampe på ei mast. Noen har peilet den riktig.",
        },
        {
          id: "lysene",
          navn: "Lysene i vinduskarmen",
          rect: { x: 65, y: 46, w: 11, h: 13 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_stearinlys",
              tekst:
                "Ett lys igjen i vinduskarmen. Det lyser dobbelt så hardt for å ta igjen.",
            },
            {
              tekst:
                "To hvite stearinlys i vinduskarmen. Nissemor tenner dem hver kveld, så de som er ute, finner veien hjem.",
            },
          ],
          ta: {
            item: "stearinlys",
            tekst:
              "Du tar det ene lyset. Knerten holder det med begge føttene og flyr veldig forsiktig. Flammen holder seg. Så vidt.",
          },
          bruk: "Det siste lyset får stå. Noen skal finne veien hjem i kveld også.",
        },
        {
          id: "taletrakten",
          navn: "Taletrakten",
          rect: { x: 84, y: 36, w: 16, h: 46 },
          smart: "snakk",
          snakk: "julius",
          se: "En messingtrakt med slange ned i et skap fullt av plugger og ledninger. Det er Julius' telefon. Ett rør går til tjernet, ett til verkstedet, og ett har en lapp: «LANDÅS (ikke etter leggetid)».",
          bruk: "Du blåser i trakten. Langt borte sier noen «hva i all verden». Du slutter.",
        },
        {
          id: "nissemor",
          navn: "Nissemor",
          rect: { x: 48, y: 57, w: 17, h: 16 },
          smart: "snakk",
          snakk: "nissemor",
          se: "Nissemor sitter i Julius' stol med en bunke julekort og en penn. Hun skriver fort og pent. Ved siden av står en kopp te som har sluttet å ryke for lenge siden.",
          bruk: "Du prikker Nissemor på armen. Hun ser opp over brillekanten og smiler. «Ja, Knerten?»",
        },
        {
          id: "brevbunken",
          navn: "Brevbunken",
          rect: { x: 22, y: 70, w: 20, h: 12 },
          smart: "se",
          se: "Brev til Julius, ordnet etter land, bundet med rød tråd. Det øverste er fra Bergen og lukter regn.",
        },
        {
          id: "boka",
          navn: "Den tykke boka",
          rect: { x: 17, y: 78, w: 12, h: 12 },
          smart: "se",
          se: "Ei tykk, brun bok uten tittel. Du åpner den på måfå: «Snillhet, se: å se noen». Du lukker den igjen. Det var hele siden.",
        },
        {
          id: "blekkhuset",
          navn: "Blekkhuset",
          rect: { x: 35, y: 81, w: 6, h: 9 },
          smart: "se",
          se: "Et blekkhus med en fjærpenn. Blekket er grønt. Julius sier rødt er for ordrer og grønt er for brev. Han skriver bare brev.",
        },
        {
          id: "tekoppen",
          navn: "Tekoppen",
          rect: { x: 41, y: 80, w: 10, h: 13 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_tesil",
              tekst:
                "Nissemors tekopp. Kald te, og en krok på kanten uten tesil.",
            },
            {
              tekst:
                "Nissemors tekopp, av tre, med en liten tesil av messing hengende på kanten. Teen er kald. Tesilen er fin.",
            },
          ],
          ta: {
            item: "tesil",
            hvis: "nissemor_ja",
            tekst:
              "Du løfter tesilen av koppen. Nissemor nikker uten å se opp. «Tilbake etterpå.» " +
              R +
              "«Ho sei det te mæ òg. Om alt.»",
          },
          bruk: [
            {
              hvis: "tok_tesil",
              tekst: "Kald kamillete. Knerten smaker. Knerten angrer.",
            },
            {
              tekst:
                "Du tar ikke ting fra Nissemor uten å spørre. Ikke engang Knerten. Særlig ikke Knerten.",
            },
          ],
        },
        {
          id: "lupa",
          navn: "Lupa",
          rect: { x: 46, y: 74, w: 16, h: 7 },
          smart: "se",
          se: "Julius' lupe. Han bruker den til å lese små bokstaver i brev. Gjennom den ser Knertens fot ut som en drage. Hun blir litt stolt.",
        },
        {
          id: "brillene",
          navn: "Brillene",
          rect: { x: 57, y: 85, w: 7, h: 8 },
          smart: "se",
          se: "Julius' lesebriller, pent brettet sammen ved boka. Han glemmer dem hver gang han går ut. Hver gang.",
        },
        {
          id: "dagboka",
          navn: "Den åpne boka",
          rect: { x: 65, y: 76, w: 18, h: 18 },
          smart: "se",
          se:
            "Julius' dagbok, åpen. Du leser ikke andres dagbøker. Knerten leser ikke andres dagbøker. " +
            R +
            "«Æ les ... Nei. Æ gjør ikkje det. Fly videre.»",
        },
      ],
    },
    {
      id: "grotten",
      navn: "Krystallgrotten",
      bilde: "feed/kulde-grotte.png",
      utganger: [{ til: "kontor", navn: "Opp igjen til kontoret" }],
      hotspots: [
        {
          id: "sprekken",
          navn: "Sprekken i taket",
          rect: { x: 42, y: 0, w: 16, h: 40 },
          smart: "se",
          se: "En lang sprekk i taket. Det drysser snø ned gjennom den hele tiden, og med snøen kommer trekken: en lang, kald pust som aldri stopper.",
          bruk: "Knerten flyr opp mot sprekken. Trekken dytter henne ned igjen. Hun prøver en gang til. Samme svar.",
        },
        {
          id: "istappene",
          navn: "Istappene",
          rect: { x: 14, y: 0, w: 26, h: 18 },
          smart: "se",
          se: "Istapper så lange som Knerten er høy. En av dem drypper. Dråpen treffer en krystall og sier «pling». Samme tone hver gang.",
        },
        {
          id: "blaakrystallene",
          navn: "De blå krystallene",
          rect: { x: 6, y: 22, w: 32, h: 58 },
          smart: "se",
          se: "Hyller skåret rett inn i isen, fulle av krystaller med blå glød. Hver har en liten lapp med tall, skrevet med stø hånd for lenge siden. Noen bygde dette nøye.",
          bruk: "Du tar i en blå krystall. Den er kald, tung, og det kjennes som om den drikker lyset ut av øynene dine. Du slipper.",
          feil: {
            tesil_lanterne:
              "Du holder lanterna mot en blå krystall. Lyset forsvinner inn i den og kommer ikke ut igjen. " +
              R +
              "«Ikkje de blå. De blå ET lys.»",
            stearinlys:
              "Du holder lyset mot en blå krystall. Flammen blir mindre. Du tar det vekk.",
          },
        },
        {
          id: "klarekrystallene",
          navn: "De klare krystallene",
          rect: { x: 64, y: 20, w: 32, h: 58 },
          smart: "bruk",
          se: [
            {
              hvis: "julius_krystall",
              tekst:
                "Hyller med klare krystaller, som glass med frost i. Nederst på hylla ligger et løst skår, akkurat passe stort til en uglefot.",
            },
            {
              tekst:
                "Hyller med klare krystaller, som glass med frost i. Hundre av dem. Noen store, noen små. Det ligger et løst skår nederst, men hva skulle man med det?",
            },
          ],
          ta: {
            item: "krystallskaar",
            hvis: "julius_krystall",
            tekst:
              "Du tar det løse skåret fra nederste hylle. Det er lett og klart. Når du holder det opp, ser du hele grotten gjennom det. Litt større.",
          },
          bruk: [
            {
              hvis: "tok_krystallskaar",
              tekst: "Resten får stå. De holder lyset sammen, hylle for hylle.",
            },
            {
              tekst:
                "Hundre klare krystaller. Knerten strekker foten mot en, så en annen. " +
                R +
                "«Vent. Nån må vite ka de gjør før vi tar en. Julius kan sånt.»",
            },
          ],
          feil: {
            tesil_lanterne:
              "Du holder lanterna mot en klar krystall. Den lyser opp, og krystallen bak den, og den bak der igjen. Så flytter du lanterna, og det slukner. Den må stå i ro et sted.",
          },
        },
        {
          id: "radioen",
          navn: "Radioen på sokkelen",
          rect: { x: 37, y: 46, w: 26, h: 36 },
          smart: "snakk",
          snakk: "radioen",
          se: [
            {
              hvis: "krystall_satt",
              tekst:
                "Nå som hele grotten lyser, ser du at det er små bokstaver på knottene, slitt ned av fingre for lenge siden. Noen bygde dette med omhu. Rørene gløder blått, og de gløder litt sterkere enn i sted.",
            },
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Et gammelt radioapparat av messing og tre, med frost på skiva. Lanterna lyser svakt på kanten av den. Den summer lavt, som noen som nynner for seg selv.",
            },
            {
              tekst:
                "Et gammelt radioapparat av messing og tre på en steinsokkel. Rørene gløder svakt blått. Det summer lavt, som noen som nynner for seg selv og ikke venter at noen hører.",
            },
          ],
          bruk:
            "Du rører ikke knottene. Det er ikke din radio. " +
            R +
            "«Nei. Ikkje skru. Vi e på besøk.»",
          feil: {
            tesil_lanterne:
              "Du prøver å sette lanterna oppå radioen. Den sklir. Sokkelen under er bedre.",
            krystallskaar:
              "Du holder skåret mot radioen. Pent, men lyset må komme et sted fra først. Sokkelen.",
          },
        },
        {
          id: "sokkelen",
          navn: "Sokkelen",
          rect: { x: 33, y: 82, w: 34, h: 18 },
          smart: "bruk",
          se: [
            {
              hvis: "krystall_satt",
              tekst:
                "Tesil-lanterna står på sokkelen med krystallskåret foran. Lyset går gjennom skåret, treffer hylla til høyre, hopper til neste, og neste. Hele grotten lyser gull og blått.",
            },
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Tesil-lanterna står på sokkelen og lyser gjennom hundre små hull. Et lite, varmt lys i en veldig stor grotte. Trekken tar det ikke.",
            },
            {
              tekst:
                "En stor stein med snø på, som et bord. Det er plass til noe her. Noe som lyser, kanskje.",
            },
          ],
          bruk: [
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Du retter litt på lanterna. Den sto bra. Nå står den bra igjen.",
            },
            {
              tekst: "Du børster snø av sokkelen med vingen. Nå er det plass.",
            },
          ],
          bruker: [
            {
              item: "tesil_lanterne",
              uten: "lys_paa_sokkelen",
              flagg: "lys_paa_sokkelen",
              forbruker: true,
              tekst:
                "Du setter tesil-lanterna midt på sokkelen. Trekken fra sprekken kommer susende ... og flammen står rolig bak messingnettet. Et lite gult lys i et hav av blått. " +
                R +
                "«Det står! Det STÅR! Men søren, grotta e stor.»",
            },
            {
              item: "krystallskaar",
              hvis: "lys_paa_sokkelen",
              uten: "krystall_satt",
              flagg: "krystall_satt",
              forbruker: true,
              tekst:
                "Du setter krystallskåret i snøen rett foran lanterna. Lyset går gjennom det og ut på andre siden, større. Det treffer den første klare krystallen på hylla. Den lyser opp. Så den neste. Så den neste. Hylle etter hylle, helt opp til taket. Hele grotten lyser. " +
                R +
                "«... Æ har ikkje ord. Æ har bestandig ord. Men ikkje no.»",
            },
            {
              item: "krystallskaar",
              tekst:
                "Du setter skåret på sokkelen. Det er klart og fint og helt mørkt. Lyset må komme først.",
            },
            {
              item: "stearinlys",
              tekst:
                "Du setter lyset på sokkelen. Trekken fra sprekken tar det med ett pust. Knerten flyr opp og tenner det igjen på vinduskarmen hos Nissemor. " +
                R +
                "«Trekken tar alt som står bart. Lyset treng nåkka rundt sæ.»",
            },
          ],
          feil: {
            tesil:
              "Du setter tesilen på sokkelen. Tom. Den ser ut som en liten messinghatt som venter på et hode.",
          },
        },
        {
          id: "storekrystallen",
          navn: "Den store krystallen",
          rect: { x: 0, y: 56, w: 14, h: 44 },
          smart: "se",
          se: "En krystall høyere enn Knerten, med ei lapp nederst: «NR. 1». Den første. Noen begynte her, en gang, med stor tro på det.",
        },
        {
          id: "hoyrekrystallen",
          navn: "Krystallene ved veggen",
          rect: { x: 84, y: 72, w: 16, h: 28 },
          smart: "se",
          se: "Et knippe klare krystaller som vokser rett opp av gulvet. Speilbildet av Knerten står i hver av dem. Sju ugler. Alle like forbauset.",
        },
      ],
    },
  ],
  dialoger: {
    nissemor: {
      taler: "Nissemor",
      portrett: "nissemor",
      start: "start",
      noder: {
        start: {
          tekst: [
            {
              hvis: "k3_ferdig",
              tekst:
                "«Så du gjorde det, Knerten. Og Rampenissen tenkte det ut selv. Jeg skal skrive det i et julekort. Til ham.»",
            },
            {
              hvis: "nissemor_snakket",
              tekst:
                "«Fortsatt her? Lysene står i vinduskarmen. Tesilen er på koppen. Og jeg vil ha den tilbake, hører du.»",
            },
            {
              tekst:
                "«Å, Knerten! Kom inn, kom inn. Julius er ute ved tjernet med IQ, de ser på antenna igjen. Jeg sitter her og skriver julekort. Fire hundre igjen. Hva kan jeg hjelpe med?»",
            },
          ],
          valg: [
            {
              tekst: "Rampenissen vil gi et lys til han i grotten.",
              neste: "lys",
              flagg: "nissemor_snakket",
            },
            {
              tekst: "Hva kan skjerme et lys mot trekk?",
              hvis: "nissemor_snakket",
              neste: "skjerm",
            },
            {
              tekst: "Hvor får vi tak i et lys?",
              hvis: "nissemor_snakket",
              neste: "lyset",
            },
            {
              tekst: "Er han farlig, han der nede?",
              hvis: "nissemor_snakket",
              neste: "farlig",
            },
            { tekst: "Hva skriver du?", neste: "kort" },
            { tekst: "Ha det, Nissemor." },
          ],
        },
        lys: {
          tekst:
            "Nissemor legger fra seg pennen. «Et lys. Til ham.» Hun ser ut av vinduet en stund. «Det er det snilleste jeg har hørt fra Rampenissen siden han var liten. Men det trekker fra sprekken i taket der nede. Et vanlig lys blåser ut før du er halvveis.»",
          rampenissen: "«Æ va aldri liten. Æ va kompakt.»",
          valg: [
            { tekst: "Hva kan skjerme et lys mot trekk?", neste: "skjerm" },
            { tekst: "Hvor får vi tak i et lys?", neste: "lyset" },
            { tekst: "Takk, Nissemor." },
          ],
        },
        skjerm: {
          tekst:
            "«Gruvefolk før i tiden hadde lanterner med netting rundt flammen. Luft kommer inn, vind kommer ikke. Jeg har ikke netting ... men jeg har en tesil av messing. Den henger på koppen min. Sett lyset inni og lukk lokket. Og jeg vil ha den tilbake.»",
          rampenissen:
            "«Ei tesil! Sjølvsagt. Ho har svar på alt. Det e litt irriterande.»",
          valg: [{ tekst: "Vi skal passe på den.", flagg: "nissemor_ja" }],
        },
        lyset: {
          tekst:
            "«Ta ett av lysene i vinduskarmen. Jeg tenner dem for at de som er ute, skal finne hjem. Ett mindre gjør ingen forskjell. Og kanskje er han der nede også en som skal finne hjem.»",
          valg: [{ tekst: "Takk." }],
        },
        farlig: {
          tekst:
            "«Nei. Han er alene. Det er ikke det samme som farlig, selv om det kan høres likt ut gjennom en radio.»",
          rampenissen: "«Ho sei det bedre enn mæ. Ho sei alt bedre enn mæ.»",
          valg: [{ tekst: "Skjønner." }],
        },
        kort: {
          tekst:
            "«Julekort. Til alle som har skrevet til Julius i år. Han svarer alle, men jeg skriver konvoluttene, for skriften hans ser ut som et reinsdyr har gått over arket.» Hun viser et kort. Det er sant.",
          valg: [{ tekst: "Lykke til med de fire hundre." }],
        },
      },
    },
    julius: {
      taler: "Julius (i taletrakten)",
      portrett: "julius",
      start: "start",
      noder: {
        start: {
          tekst: [
            {
              hvis: "k3_ferdig",
              tekst:
                "«Knerten. Jeg ser lyset herfra. Hele grotten. IQ sa ingenting på fem minutter, og det har aldri skjedd før.»",
            },
            {
              hvis: "julius_snakket",
              tekst:
                "«Knerten igjen! Vi står fortsatt her ute. IQ måler noe. Han sier det er viktig. Det sier han om alt.»",
            },
            {
              tekst:
                "«Hallo? Er det deg, Nissemor? Nei ... det er Knerten! Jeg ser deg i det lille kameraet til IQ. Vi står ute ved tjernet. Antenna peker på Landås nå, takket være noen jeg tror jeg kjenner.»",
            },
          ],
          valg: [
            {
              tekst: "Rampenissen vil gi et lys til han i grotten.",
              neste: "lys",
              flagg: "julius_snakket",
            },
            {
              tekst: "Hvordan får vi lyset til å nå lenger?",
              hvis: "julius_snakket",
              neste: "krystall",
            },
            { tekst: "Hva gjør dere ute ved tjernet?", neste: "tjernet" },
            { tekst: "Ha det, Julius." },
          ],
        },
        lys: {
          tekst:
            "Det blir stille i trakten. Så: «Da er han klokere enn jeg var i høst. Ja. Gjør det. Men ett lys blir lite i en så stor grotte. Det må nå lenger enn til sokkelen.»",
          rampenissen:
            "«Klokere enn Julius. Skriv det ned, nån. Kem som helst.»",
          valg: [
            {
              tekst: "Hvordan får vi lyset til å nå lenger?",
              neste: "krystall",
            },
            { tekst: "Takk, Julius." },
          ],
        },
        krystall: {
          tekst:
            "«Krystallene. De klare, på høyre side, sender lyset videre fra hylle til hylle. De blå drikker det. Det ligger løse skår nederst. Sett et klart skår foran flammen, så lyser hele grotten. Han som bygde dem, visste hva han gjorde.»",
          rampenissen: "«Klare, høyre, foran flammen. Æ har det.»",
          valg: [
            { tekst: "Klare, høyre, foran flammen.", flagg: "julius_krystall" },
          ],
        },
        tjernet: {
          tekst:
            "«IQ måler hvor mye antenna rister i vinden. Jeg holder stigen. Jeg har holdt stigen i to timer. Jeg tror jeg er stigen nå.»",
          valg: [{ tekst: "Hold ut, Julius." }],
        },
      },
    },
    radioen: {
      taler: "Radioen på sokkelen",
      portrett: "radio",
      start: "start",
      noder: {
        start: {
          tekst: [
            {
              hvis: "hilst",
              tekst:
                "Radioen summer, dypt og rolig. Rørene gløder. Lyset står på sokkelen. Alt er som dere lot det være.",
            },
            {
              hvis: "krystall_satt",
              tekst:
                "Radioen summer. Hele grotten lyser rundt den. Det er nå eller aldri. Hva sier man til noen som ikke har hørt en stemme på lenge?",
            },
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Radioen summer. Lanterna lyser svakt på messingen. Resten av grotten er mørk.",
            },
            {
              tekst:
                "Radioen summer lavt i mørket. Du hører trekken. Du hører ditt eget hjerte. Du hører ingenting annet.",
            },
          ],
          valg: [
            {
              tekst: "Hei. Vi vet at du er der.",
              hvis: "krystall_satt",
              uten: "hilst",
              neste: "svar",
              flagg: "hilst",
            },
            {
              tekst: "God jul fra Landås.",
              hvis: "krystall_satt",
              uten: "hilst",
              neste: "svar",
              flagg: "hilst",
            },
            {
              tekst: "Lyset er til deg. Du kan beholde det.",
              hvis: "krystall_satt",
              uten: "hilst",
              neste: "svar",
              flagg: "hilst",
            },
            {
              tekst: "Hallo?",
              uten: "krystall_satt",
              neste: "stille",
            },
            { tekst: "Vi går igjen." },
          ],
        },
        stille: {
          tekst: "Summingen fortsetter. Ingen svarer. Ikke ennå.",
          rampenissen:
            "«Vent med å snakk. Først lyset, så heile grotta. Så hilsa. Han ska SE oss når vi sei hei.»",
          valg: [{ tekst: "Greit." }],
        },
        svar: {
          tekst:
            "Summingen stopper. Ett sekund. To. Tre. Så starter den igjen, litt dypere og litt roligere enn før. Ingen svarer. Men ingen slår av lyset heller.",
          rampenissen:
            "«Han hørte oss. Æ veit det. Det der va ... det va nok for i dag. Vi kjem tilbake.»",
          valg: [{ tekst: "Vi kommer tilbake.", flagg: "k3_ferdig" }],
        },
      },
    },
  },
  gaater: [
    {
      id: "tesil",
      ferdig: "tok_tesil",
      tips: [
        R +
          "«Trekken der nede blås ut alt. Nissemor veit sikkert ka gruvefolk gjor med lys i trekk. Spør ho.»",
        R +
          "«Nissemor sitt i stolen. Spør om nåkka som kan skjerme et lys. Ho har nåkka av messing.»",
        R +
          "«SNAKK med Nissemor, spør ka som kan skjerme et lys mot trekk, og ta tesilen fra tekoppen hennes.»",
      ],
    },
    {
      id: "lanterne",
      ferdig: "lys_paa_sokkelen",
      tips: [
        R +
          "«Lys i vinduskarmen hos Nissemor. Tesil i lomma. Ka skjer vess flammen står INNI tesilen?»",
        R +
          "«Trykk på lyset i lomma, så på tesilen. Da har vi ei lita lanterne som trekken ikkje tar.»",
        R +
          "«Ta et lys fra vinduskarmen, sett det saman med tesilen, og sett lanterna på sokkelen nede i grotta.»",
      ],
    },
    {
      id: "krystall",
      ferdig: "krystall_satt",
      tips: [
        R +
          "«Ett lys e lite i ei så stor grotte. Julius veit nåkka om krystallan. Han svare i taletrakten på kontoret.»",
        R +
          "«De klare krystallan på høyre side sende lyset videre. Ta et løst skår nederst på hylla.»",
        R +
          "«Snakk med Julius i taletrakten om krystallan. Ta et skår fra de klare krystallan og bruk det på sokkelen foran lanterna.»",
      ],
    },
    {
      id: "hilsen",
      ferdig: "k3_ferdig",
      tips: [
        R + "«No lyse heile grotta. Da mangle bare det viktigaste: å sei hei.»",
        R + "«SNAKK med radioen på sokkelen.»",
        R +
          "«Trykk på radioen, velg ei hilsen, og sei at vi kjem tilbake. Det held.»",
      ],
    },
  ],
};
