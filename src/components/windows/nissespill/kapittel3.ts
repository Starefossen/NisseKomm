/**
 * Kapittel 3: «Gufset fra dypet» (dag 16). The children know who sits in
 * Krystallgrotten (M4, day 15) and Rampenissen wants to bring him a light, not
 * a fight. The chapter ends with a greeting and no answer: the first real
 * answer belongs to the main story (day 17). Written for Håkon (9) and Kristian
 * (12): nobody tells them which crystals pass light on; the lantern held to the
 * clear shelf shows it and thaws the shard loose; the lantern may also stand on
 * the pedestal first (en_av), its light reaches the lowest crystal. Two
 * mini-puzzles: turn the clear crystals so the light runs shelf by shelf to the
 * roof (route), and set the radio dial to the number scratched into the
 * pedestal (radio). Julius' magnifier is a red herring. Side story only: no
 * clues or codes for the daily puzzles.
 * Rampenissen speaks nordlandsk, everyone else bokmål.
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
      "«Dokker. Hør. Æ har tenkt. Det skjer ikkje ofte, så hør godt etter. Heilt sia æ hørte sukket i isen har æ tenkt. Og no veit vi kem han e, han der nede i grotta. IQ bygde han. Og så glømte alle han. Alle. I mange år.»",
    R +
      "«Æ vil ikkje slåss med han. Æ vil gi han nåkka. Et lys. Grotta e det mørkaste stedet i heile Snøfall, mørkare enn under senga mi. Knerten sitt hos Julius no. Julius e ute, men Nissemor e der. Ho veit ting.»",
    R +
      "«Problemet: det trekk nåkka forferdelig der nede. Alt som brenn, blås ut. Vi treng et lys som trekken ikkje tar, og det må nå heile grotta. Og så sei vi hei. Bare det. Æ klare å sei bare det. Trur æ.»",
  ],
  utro:
    R +
    "«Han svarte ikkje. Men han slo ikkje av lyset heller. Det står der no, nede i mørket, og krystallan sende det videre. Nissemor sei det e det snillaste æ har gjort. Æ sa det va dokker. Ho sa ‘ja, det òg’. Neste gang ska nån reise. Æ sei ikkje meir. Over og ut!»",
  gjenstander: {
    stearinlys: {
      id: "stearinlys",
      navn: "Tent stearinlys",
      ikon: "fire",
      se: "Et hvitt stearinlys som brenner rolig. Flammen bøyer seg når Knerten puster på den. Den liker ikke vind. Den har ikke møtt trekken i grotta ennå. Den kommer til å mislike den.",
    },
    tesil: {
      id: "tesil",
      navn: "Nissemors tesil",
      ikon: "tea",
      se: "En rund tesil av messing med fine, små hull. Lokk som smekker igjen. Lukter kamille. Nissemor vil ha den tilbake. Hun sa det to ganger. Hun mente det tre.",
    },
    tesil_lanterne: {
      id: "tesil_lanterne",
      navn: "Tesil-lanterne",
      ikon: "lightbulb",
      se: "Stearinlyset står inni tesilen med lokket på. Flammen lyser gjennom hundre små hull. Du puster på den. Den bryr seg ikke. Du puster hardere. Den bryr seg fortsatt ikke. Messingen blir varm på utsiden.",
    },
    krystallskaar: {
      id: "krystallskaar",
      navn: "Klart krystallskår",
      ikon: "diamond-gem",
      se: "Et skår av klar krystall, stort som en fyrstikkeske og fortsatt kaldt etter rimet. Holder du det mot et lys, kommer lyset ut på den andre siden. Større. Det er ikke lupe-større. Det er noe annet.",
    },
    lupe: {
      id: "lupe",
      navn: "Julius' lupe",
      ikon: "search",
      se: "Julius' lupe med messingkant. Han bruker den til å lese små bokstaver i brev fra små barn. Gjennom den ser Knertens fot ut som en drage. Hun ser på den ofte.",
    },
  },
  fjaerBelonning:
    R +
    "«Begge fjæran! Knerten mista fjær når ho e redd òg. Ho e ikkje redd her nede. Ikkje lenger.»",
  puslespill: {
    lysveien: {
      type: "rute",
      tittel: "Lyset gjennom hylla",
      flagg: "krystall_satt",
      tekst:
        "Den siste krystallen vrir seg på plass, og lyset hopper. Hylle etter hylle, helt opp til taket. Hele grotta lyser gull og blått. " +
        R +
        "«... Æ har ikkje ord. Æ har bestandig ord, sei Nissemor. Men ikkje no.»",
      rutenett: ["L.M", "L|L", "S.L"],
    },
    stemme: {
      type: "radio",
      tittel: "Skiva på radioen",
      flagg: "radio_stilt",
      tekst:
        "880. Susen glir bort, og summingen kommer gjennom høyttaleren. Dyp og rolig, som noen som nynner og nettopp har merket at døra sto åpen. " +
        R +
        "«No hører han oss. Og vi hører han. Æ e ikkje klar. Æ e klar. Æ e begge deler.»",
      min: 500,
      max: 1600,
      maal: 880,
      toleranse: 10,
      steg: 5,
      enhet: "kHz",
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
        "«Ei lanterne av ei tesil! Gruvefolk gjord sånt. Nissemor veit alt. Det e ikkje alltid praktisk, men no va det det.»",
    },
  ],
  scener: [
    {
      id: "kontor",
      navn: "Julius' kontor",
      bilde: "spill/julius-kontor.jpg",
      utganger: [{ til: "grotten", navn: "Ut vinduet og ned i grotta" }],
      // On the desk between the window candles and the open diary
      fjaer: { x: 72, y: 64, w: 4, h: 6 },
      hotspots: [
        {
          id: "juletreet",
          navn: "Juletreet",
          rect: { x: 4, y: 0, w: 30, h: 84 },
          smart: "se",
          se: "Et juletre med levende lys, røde kuler og småkaker. Én av småkakene mangler en bit. Bitene er på størrelse med et nissegap. Det finnes bare ett nissegap på den størrelsen i Snøfall, og det sitter i Bergen.",
          bruk: "Du rister forsiktig i ei grein. En kule svinger. En småkake faller. Knerten spiser den. Bevis fjernet. Knerten lærer fort.",
        },
        {
          id: "lampa",
          navn: "Lampa",
          rect: { x: 36, y: 14, w: 7, h: 14 },
          smart: "se",
          se: "Ei liten vegglampe med skjerm. Den lyser varmt og gult, akkurat nok til å lese julekort ved. Nissemor har lest fire hundre. Hun har to hundre igjen og én kopp te, og teen er kald.",
        },
        {
          id: "bokhylla",
          navn: "Bokhylla",
          rect: { x: 42, y: 0, w: 12, h: 30 },
          smart: "se",
          se: "Gamle bøker med gullskrift på ryggen: «Snøfall gjennom tidene», «Reinsdyrstell», «Alt om sirup». Den siste er mest slitt. Den har et bittemerke på ryggen. Noen har lest den med tennene.",
        },
        {
          id: "bamsen",
          navn: "Bamsen",
          rect: { x: 43, y: 30, w: 8, h: 10 },
          smart: "se",
          se: "En gammel bamse med ett øye og et nystrøket halstørkle. Han har sittet i hylla siden Julius var liten. Han har sett alt. Han sier ingenting. Det er derfor han fortsatt sitter der.",
          bruk: "Du klapper bamsen. Han ser like rolig ut. Han er proff. Han har vært proff i hundre år.",
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 56, y: 0, w: 40, h: 40 },
          smart: "se",
          se: "Et stort buevindu med rim på rutene. Utenfor ligger Snøfall blått og stille, og langt der ute lyser ei rød lampe på ei mast, jevnt og rolig. Noen har peilet den riktig. Det var dere.",
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
                "Ett lys igjen i vinduskarmen. Det lyser dobbelt så hardt for å ta igjen. Det klarer det nesten.",
            },
            {
              tekst:
                "To hvite stearinlys i vinduskarmen. Nissemor tenner dem hver kveld, så de som er ute, finner veien hjem. De har aldri brent for noen som ikke kom.",
            },
          ],
          ta: {
            item: "stearinlys",
            tekst:
              "Du tar det ene lyset. Knerten holder det med begge føttene og flyr veldig forsiktig. Flammen holder seg. Så vidt. Knerten holder pusten. Ugler kan det, viser det seg.",
          },
          bruk: "Det siste lyset får stå. Noen skal finne veien hjem i kveld også. Kanskje flere enn vanlig.",
        },
        {
          id: "taletrakten",
          navn: "Taletrakten",
          rect: { x: 84, y: 36, w: 16, h: 46 },
          smart: "snakk",
          snakk: "julius",
          se: "En messingtrakt med slange ned i et skap fullt av plugger og ledninger. Det er Julius' telefon. Ett rør går til tjernet, ett til verkstedet, og ett har en lapp: «LANDÅS (ikke etter leggetid)». Lappen er skrevet av Nissemor. Regelen er for Julius.",
          bruk: "Du blåser i trakten. Langt borte sier noen «hva i all verden». Du slutter. Noen andre langt borte sier «var det deg?». Du slutter mer.",
        },
        {
          id: "nissemor",
          navn: "Nissemor",
          rect: { x: 48, y: 57, w: 17, h: 16 },
          smart: "snakk",
          snakk: "nissemor",
          se: "Nissemor sitter i Julius' stol med en bunke julekort og en penn. Hun skriver fort og pent. Ved siden av står en kopp te som har sluttet å ryke for lenge siden. Hun har ikke merket det. Hun merker alt annet.",
          bruk: "Du prikker Nissemor på armen. Hun ser opp over brillekanten og smiler. «Ja, Knerten?» Hun visste at du kom. Hun vet alltid.",
        },
        {
          id: "brevbunken",
          navn: "Brevbunken",
          rect: { x: 22, y: 70, w: 20, h: 12 },
          smart: "se",
          se: "Brev til Julius, ordnet etter land, bundet med rød tråd. Det øverste er fra Bergen og lukter regn. Det nest øverste er også fra Bergen. Bergen skriver mye. Bergen har tid, det regner jo.",
        },
        {
          id: "boka",
          navn: "Den tykke boka",
          rect: { x: 17, y: 78, w: 12, h: 12 },
          smart: "se",
          se: "Ei tykk, brun bok uten tittel. Du åpner den på måfå: «Snillhet, se: å se noen». Du lukker den igjen. Det var hele siden. Det var nok.",
        },
        {
          id: "blekkhuset",
          navn: "Blekkhuset",
          rect: { x: 35, y: 81, w: 6, h: 9 },
          smart: "se",
          se: "Et blekkhus med en fjærpenn. Blekket er grønt. Julius sier rødt er for ordrer og grønt er for brev. Han har aldri kjøpt rødt blekk.",
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
                "Nissemors tekopp. Kald te, og en krok på kanten uten tesil. Koppen ser naken ut. Den klarer seg.",
            },
            {
              tekst:
                "Nissemors tekopp, av tre, med en liten tesil av messing hengende på kanten. Teen er kald. Tesilen er fin. Den er full av små hull, som alle tesiler, og det er poenget med den.",
            },
          ],
          ta: {
            item: "tesil",
            hvis: "nissemor_ja",
            tekst:
              "Du løfter tesilen av koppen. Nissemor nikker uten å se opp. «Tilbake etterpå.» " +
              R +
              "«Ho sei det te mæ òg. Om alt. Om ting æ ikkje har tatt ennå.»",
          },
          bruk: [
            {
              hvis: "tok_tesil",
              tekst:
                "Kald kamillete. Knerten smaker. Knerten angrer. Knerten smaker igjen, for å være sikker. Knerten angrer igjen.",
            },
            {
              tekst:
                "Du tar ikke ting fra Nissemor uten å spørre. Ikke engang Knerten. Særlig ikke Knerten. Nissemor ser opp akkurat idet du tenker tanken.",
            },
          ],
        },
        {
          id: "lupa",
          navn: "Lupa",
          rect: { x: 46, y: 74, w: 16, h: 7 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_lupe",
              tekst:
                "Et tomt sted på pulten der lupa lå. Julius kommer til å lete her først. Han leter alltid først der tingen lå sist.",
            },
            {
              tekst:
                "Julius' lupe. Han bruker den til å lese små bokstaver i brev. Gjennom den ser Knertens fot ut som en drage. Hun blir litt stolt. Den gjør alt større. Alt.",
            },
          ],
          ta: {
            item: "lupe",
            tekst:
              "Du tar lupa. Nissemor ser opp. «Den også? Greit. Tilbake etterpå.» " +
              R +
              "«Ei lupe gjør ting større. Lys e en ting. Æ e ikkje sikker på matematikken, men æ like den.»",
          },
          bruk: "Pulten er pult. Du har lupa. Julius har ikke lupa. Det blir en samtale senere.",
        },
        {
          id: "brillene",
          navn: "Brillene",
          rect: { x: 57, y: 85, w: 7, h: 8 },
          smart: "se",
          se: "Julius' lesebriller, pent brettet sammen ved boka. Han glemmer dem hver gang han går ut. Hver gang. Nissemor har sluttet å si fra. Hun legger dem her i stedet.",
        },
        {
          id: "dagboka",
          navn: "Den åpne boka",
          rect: { x: 65, y: 76, w: 18, h: 18 },
          smart: "se",
          se:
            "Julius' dagbok, åpen. Du leser ikke andres dagbøker. Knerten leser ikke andres dagbøker. " +
            R +
            "«Æ les ... Nei. Æ gjør ikkje det. Fly videre. Fly videre, sa æ. Okei, bare overskrifta. Nei!»",
        },
      ],
    },
    {
      id: "grotten",
      navn: "Krystallgrotten",
      bilde: "spill/kulde-grotte.jpg",
      utganger: [{ til: "kontor", navn: "Opp igjen til kontoret" }],
      // On the cave floor between the big crystal and the pedestal
      fjaer: { x: 22, y: 88, w: 4, h: 6 },
      hotspots: [
        {
          id: "sprekken",
          navn: "Sprekken i taket",
          rect: { x: 42, y: 0, w: 16, h: 40 },
          smart: "se",
          se: "En lang sprekk i taket. Det drysser snø ned gjennom den hele tiden, og med snøen kommer trekken: en lang, kald pust som aldri stopper. Den har holdt på lenge. Den er ikke sliten.",
          bruk: "Knerten flyr opp mot sprekken. Trekken dytter henne ned igjen. Hun prøver en gang til. Samme svar. Trekken diskuterer ikke.",
        },
        {
          id: "istappene",
          navn: "Istappene",
          rect: { x: 14, y: 0, w: 26, h: 18 },
          smart: "se",
          se: "Istapper så lange som Knerten er høy. En av dem drypper. Dråpen treffer en krystall og sier «pling». Samme tone hver gang. Den har holdt tonen i mange år. Ingen har klappet.",
        },
        {
          id: "blaakrystallene",
          navn: "De blå krystallene",
          rect: { x: 6, y: 22, w: 32, h: 58 },
          smart: "se",
          se: "Hyller skåret rett inn i isen, fulle av krystaller med blå glød. Hver har en liten lapp med tall, skrevet med stø hånd for lenge siden. Noen bygde dette nøye. Noen hadde tid. Noen hadde kanskje for mye tid.",
          bruk: "Du tar i en blå krystall. Den er kald, tung, og det kjennes som om den drikker lyset ut av øynene dine. Du slipper. Du blunker. Lyset kommer tilbake. Det var på lån.",
          feil: {
            tesil_lanterne:
              "Du holder lanterna mot en blå krystall. Lyset forsvinner inn i den og kommer ikke ut igjen. Krystallen gløder litt mer blått, som om den har spist. " +
              R +
              "«Ikkje dem blå. Dem blå ET lys. Prøv dem andre.»",
            stearinlys:
              "Du holder lyset mot en blå krystall. Flammen blir mindre. Du tar det vekk. Flammen blir større. Den tilgir deg.",
            lupe: "Du ser på en blå krystall gjennom lupa. Den er større, blåere, og ser sulten ut på nært hold. Du senker lupa.",
            krystallskaar:
              "Du holder det klare skåret mot en blå. Ingenting. Lys må inn i skåret først. Og ikke fra den siden.",
          },
        },
        {
          id: "klarekrystallene",
          navn: "De klare krystallene",
          rect: { x: 64, y: 20, w: 32, h: 58 },
          smart: "bruk",
          vis: { uten: "skaar_satt" },
          se: [
            {
              hvis: "tok_krystallskaar",
              tekst:
                "Hyller med klare krystaller, som glass med frost i. Nederst på hylla: en liten, tom flekk i rimet der skåret satt. Resten står og venter på lys.",
            },
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Hyller med klare krystaller. Lyset fra sokkelen når så vidt den nederste. Den lyser svakt, og rimet rundt et lite skår ved siden av har smeltet til en pytt.",
            },
            {
              hvis: "skaar_loes",
              tekst:
                "Hyller med klare krystaller, som glass med frost i. Nederst ligger et løst skår i en liten pytt av smeltet rim. Det er akkurat passe stort til en uglefot.",
            },
            {
              tekst:
                "Hyller med klare krystaller, som glass med frost i. Hundre av dem, og alle mørke. Nederst på hylla sitter et lite skår fast i rimet, som om noen mistet det for lenge siden og ikke så det. Det var mørkt da også.",
            },
          ],
          ta: {
            item: "krystallskaar",
            en_av: [{ hvis: "skaar_loes" }, { hvis: "lys_paa_sokkelen" }],
            tekst:
              "Du tar det løse skåret fra pytten på nederste hylle. Det er lett og klart. Når du holder det opp, ser du hele grotta gjennom det. Litt større. Og litt mindre mørk, selv om det ikke kan stemme.",
          },
          bruk: [
            {
              hvis: "tok_krystallskaar",
              tekst:
                "Resten får stå. De holder lyset sammen, hylle for hylle, når de får noe å holde.",
            },
            {
              en_av: [{ hvis: "skaar_loes" }, { hvis: "lys_paa_sokkelen" }],
              tekst:
                "Skåret ligger løst nå. Det er bare å ta det. Knerten strekker foten og nøler, for det er fint, og fint er man forsiktig med.",
            },
            {
              tekst:
                "Knerten hakker på rimet rundt skåret med nebbet. Rim: 1, nebb: 0. " +
                R +
                "«Rim e is. Is smelte av varme. Vi har nåkka varmt. Nåkka varmt med lokk på.»",
            },
          ],
          bruker: [
            {
              item: "tesil_lanterne",
              uten: "skaar_loes",
              flagg: "skaar_loes",
              tekst:
                "Du holder lanterna inntil den nederste klare krystallen. Den lyser opp. Og den bak. Og den bak der igjen, helt opp mot taket. Så drypper det: rimet smelter, og skåret løsner. " +
                R +
                "«SÅG dokker det? Dem klare SENDE lyset videre! Og skåret e løst! To fluer, ei tesil!»",
            },
            {
              item: "tesil_lanterne",
              tekst:
                "Du holder lanterna mot hylla igjen. Den lyser opp, krystall etter krystall, så lenge du står helt i ro. Lanterna må stå et sted. Et sted midt i grotta, der lyset treffer hylla uten at noen holder den.",
            },
          ],
          feil: {
            stearinlys:
              "Du holder det nakne lyset mot hylla. Krystallen lyser så vidt opp, og så bøyer trekken flammen flat. Du redder den akkurat. Dette lyset trenger noe rundt seg før det tør å stå her.",
            lupe:
              "Du ser på skåret gjennom lupa. Rimet er større. Skåret er større. Det sitter like fast, bare større. " +
              R +
              "«Ei lupe gjør ting større, ikkje løsare. Æ hadde håpa.»",
            tesil:
              "Du holder den tomme tesilen mot hylla. Krystallen ser på en liten messinghatt. Den er ikke imponert.",
          },
        },
        {
          id: "lyshylla",
          navn: "De klare krystallene",
          rect: { x: 64, y: 20, w: 32, h: 58 },
          smart: "bruk",
          vis: { hvis: "skaar_satt" },
          puslespill: "lysveien",
          se: [
            {
              hvis: "krystall_satt",
              tekst:
                "Hylle etter hylle med klare krystaller, alle tent. Lyset går i sikksakk fra den nederste til den øverste, som en trapp av gull. Noen bygde dette for akkurat dette. Det tok bare noen år.",
            },
            {
              tekst:
                "Den nederste krystallen lyser. Den neste er mørk. Krystallene sitter i små messingringer og kan vris. Hver har to slipte sider, og lyset går bare ut der siden peker. Noen må vri dem så lyset finner veien opp.",
            },
          ],
          bruk: "Lyset står. Du rører ikke en eneste krystall. Knerten holder til og med pusten.",
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
                "Nå som hele grotta lyser, ser du små bokstaver på knottene, slitt ned av fingre for lenge siden. Rørene gløder litt sterkere enn i sted. Det kan være lyset. Det kan være noe annet.",
            },
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Et gammelt radioapparat av messing og tre, med frost på skiva. Lanterna lyser svakt på kanten av den. Den summer lavt, som noen som nynner for seg selv og ikke har bestemt seg for sangen.",
            },
            {
              tekst:
                "Et gammelt radioapparat av messing og tre på en steinsokkel. Rørene gløder svakt blått. Det summer lavt, som noen som nynner for seg selv og ikke venter at noen hører. Ingen har hørt på lenge.",
            },
          ],
          bruk:
            "Du rører ikke knottene. Ikke i mørket. " +
            R +
            "«Ikkje skru i blinde. Vi e på besøk. Æ har skrudd på andre sin radio før. Det blei ikkje jul av det.»",
          feil: {
            tesil_lanterne:
              "Du prøver å sette lanterna oppå radioen. Den sklir på frosten. Sokkelen under er flatere, og den har bedre utsikt til hyllene.",
            krystallskaar:
              "Du holder skåret mot radioen. Pent, men lyset må komme et sted fra først. Og stå i ro.",
            lupe: "Du ser på radioen gjennom lupa. Knottene har bokstaver. De er for slitte til å lese, også store. Du legger lupa ned igjen. Noen ting leser man ikke uansett.",
          },
        },
        {
          id: "knottene",
          navn: "Skiva på radioen",
          rect: { x: 40, y: 66, w: 20, h: 14 },
          smart: "bruk",
          vis: { hvis: "krystall_satt" },
          puslespill: "stemme",
          se: [
            {
              hvis: "radio_stilt",
              tekst:
                "Nåla står på 880. Summingen kommer rolig ut av høyttaleren. Frosten på skiva har begynt å smelte i en liten ring rundt tallet.",
            },
            {
              tekst:
                "I lyset ser du skiva: tall fra 500 til 1600, og en nål som skjelver mellom dem. Summingen kommer fra rørene, ikke fra høyttaleren. Skiva står ikke der han er. Noen risset et tall i sokkelen for å huske det.",
            },
          ],
          bruk: "Skiva står på 880, og du lar den stå. Han hører dere nå. Det er nok.",
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
                "Lanterna står på sokkelen med skåret foran, og hele grotta lyser gull og blått. I lyset ser du at noen har risset et tall i steinen ved lanterna, med samme hånd som lappene: «880». Det er ikke mørkt her lenger. Det har det vært lenge.",
            },
            {
              hvis: "skaar_satt",
              tekst:
                "Lanterna står på sokkelen med krystallskåret foran. Lyset går gjennom skåret og treffer den nederste klare krystallen. Der stopper det. Resten av hylla venter på at noen vrir dem rett.",
            },
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Tesil-lanterna står på sokkelen og lyser gjennom hundre små hull. Et lite, varmt lys i en veldig stor grotte. Trekken tar det ikke. Men lyset når ikke bort til hyllene. Det trenger hjelp på veien.",
            },
            {
              tekst:
                "En stor stein med snø på, som et bord, midt i grotta. Herfra ser man begge hyllene: de blå til venstre, de klare til høyre. Det er plass til noe her. Noe som lyser, og noe som sender lyset videre.",
            },
          ],
          bruk: [
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Du retter litt på lanterna. Den sto bra. Nå står den bra igjen. Knerten er fornøyd med seg selv.",
            },
            {
              tekst:
                "Du børster snø av sokkelen med vingen. Nå er det plass. Det var plass før også, men nå er det pent.",
            },
          ],
          bruker: [
            {
              item: "tesil_lanterne",
              hvis: "skaar_loes",
              uten: "lys_paa_sokkelen",
              flagg: "lys_paa_sokkelen",
              forbruker: true,
              tekst:
                "Du setter lanterna midt på sokkelen. Trekken kommer susende ... og flammen står rolig bak messingnettet. Men lyset når ikke bort til hyllene. " +
                R +
                "«Det STÅR! Men grotta e stor. Lyset treng nåkka som sende det videre. Vi har sett ka som gjør det.»",
            },
            {
              item: "tesil_lanterne",
              uten: "lys_paa_sokkelen",
              flagg: "lys_paa_sokkelen",
              forbruker: true,
              tekst:
                "Du setter lanterna midt på sokkelen. Trekken kommer, og flammen står rolig. Nederst på den klare hylla fanger én krystall lyset, og rimet ved siden av begynner å dryppe. " +
                R +
                "«Det STÅR! Og såg dokker det? Den nederste klare TOK lyset. Og nåkka ved sia av tine.»",
            },
            {
              item: "krystallskaar",
              hvis: "lys_paa_sokkelen",
              uten: "skaar_satt",
              flagg: "skaar_satt",
              forbruker: true,
              tekst:
                "Du setter skåret foran lanterna, vendt mot den klare hylla. Lyset går gjennom det, større, og treffer den første klare krystallen. Den neste er mørk: lyset går ut på skrå, mot veggen. " +
                R +
                "«Dem må SNUS! Hylle for hylle, så lyset finn neste. Dem e bygd te å vris.»",
            },
            {
              item: "krystallskaar",
              tekst:
                "Du setter skåret på sokkelen. Det er klart og fint og helt mørkt. Lyset må komme først, og stå bak det.",
            },
            {
              item: "stearinlys",
              tekst:
                "Du setter lyset på sokkelen. Trekken tar det med ett pust. Knerten flyr opp og tenner det igjen på lyset i vinduskarmen hos Nissemor, og later som ingenting. " +
                R +
                "«Trekken tar alt som står bart. Lyset treng nåkka rundt sæ. Nåkka med hull i, så det får puste.»",
            },
          ],
          feil: {
            tesil:
              "Du setter tesilen på sokkelen. Tom. Den ser ut som en liten messinghatt som venter på et hode. Et varmt hode.",
            lupe:
              "Du setter lupa foran lanterna. Lyset samles til én liten, skarp prikk på veggen. Prikken er veldig lys. Grotta er veldig stor. Prikken taper. " +
              R +
              "«Større lys, ikkje mindre! Lupa gjør det feil vei.»",
          },
        },
        {
          id: "storekrystallen",
          navn: "Den store krystallen",
          rect: { x: 0, y: 56, w: 14, h: 44 },
          smart: "se",
          se: "En krystall høyere enn Knerten, med ei lapp nederst: «NR. 1». Den første. Noen begynte her, en gang, med stor tro på det. Lappen er skrevet med samme skrift som lappen på IQs dør. Yngre skrift. Samme hånd.",
        },
        {
          id: "hoyrekrystallen",
          navn: "Krystallene ved veggen",
          rect: { x: 84, y: 72, w: 16, h: 28 },
          smart: "se",
          se: "Et knippe klare krystaller som vokser rett opp av gulvet. Speilbildet av Knerten står i hver av dem. Sju ugler. Alle like forbauset. Den åttende er ekte, og hun er mest forbauset.",
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
                "«Så du gjorde det, Knerten. Og Rampenissen tenkte det ut selv. Jeg skal skrive det i et julekort. Til ham. Han kommer til å ramme det inn. Han har ikke ramme. Han kommer til å lage en.»",
            },
            {
              hvis: "nissemor_snakket",
              tekst:
                "«Fortsatt her? Lysene står i vinduskarmen. Tesilen er på koppen. Og jeg vil ha den tilbake, hører du. Og lupa, hvis den også blir med.»",
            },
            {
              tekst:
                "«Å, Knerten! Kom inn, kom inn. Julius er ute ved tjernet med IQ, de ser på antenna igjen. Jeg sitter her og skriver julekort. Fire hundre igjen. Hva kan jeg hjelpe med? Si det fort, pennen tørker.»",
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
            "Nissemor legger fra seg pennen. «Et lys. Til ham. Det er det snilleste jeg har hørt fra Rampenissen siden han var liten. Men det trekker fra sprekken i taket der nede. Et vanlig lys blåser ut før du er halvveis. Og ett lys er lite i en så stor grotte. Det må nå hyllene.»",
          rampenissen:
            "«Æ va aldri liten. Æ va kompakt. Æ e fortsatt kompakt.»",
          valg: [
            { tekst: "Hva kan skjerme et lys mot trekk?", neste: "skjerm" },
            { tekst: "Hvor får vi tak i et lys?", neste: "lyset" },
            { tekst: "Takk, Nissemor." },
          ],
        },
        skjerm: {
          tekst:
            "«Gruvefolk hadde lanterner med netting rundt flammen. Luft kommer inn, vind kommer ikke. Jeg har ikke netting.» Hun ser på tekoppen sin. Så på deg. «Jeg har messing med hull i. Sett lyset inni og lukk lokket. Og jeg vil ha den tilbake.»",
          rampenissen:
            "«Ho meine tesila! Ho sa det ikkje, men ho meine det. Ho har svar på alt. Det e litt irriterande. Æ sei det med kjærlighet.»",
          valg: [{ tekst: "Vi skal passe på den.", flagg: "nissemor_ja" }],
        },
        lyset: {
          tekst:
            "«Ta ett av lysene i vinduskarmen. Jeg tenner dem for at de som er ute, skal finne hjem. Ett mindre gjør ingen forskjell. Og kanskje er han der nede også en som skal finne hjem. Da er det jo riktig bruk.»",
          valg: [{ tekst: "Takk." }],
        },
        farlig: {
          tekst:
            "«Nei. Han er alene. Det er ikke det samme som farlig, selv om det kan høres likt ut gjennom en radio. Alt høres farlig ut gjennom en radio. Også Rampenissen.»",
          rampenissen:
            "«Ho sei det bedre enn mæ. Ho sei alt bedre enn mæ. Æ sei det høgare, det e min ting.»",
          valg: [{ tekst: "Skjønner." }],
        },
        kort: {
          tekst:
            "«Julekort. Til alle som har skrevet til Julius i år. Han svarer alle, men jeg skriver konvoluttene, for skriften hans ser ut som et reinsdyr har gått over arket. Et reinsdyr som har det travelt.» Hun viser et kort. Det er sant.",
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
                "«Knerten. Jeg ser lyset herfra. Hele grotta. IQ sa ingenting på fem minutter, og det har aldri skjedd før. Jeg tok tiden.»",
            },
            {
              hvis: "julius_snakket",
              tekst:
                "«Knerten igjen! Vi står fortsatt her ute. IQ måler noe. Han sier det er viktig. Det sier han om alt. En gang sa han det om en vaffel.»",
            },
            {
              tekst:
                "«Hallo? Er det deg, Nissemor? Nei ... det er Knerten! Jeg ser deg i det lille kameraet til IQ. Vi står ute ved tjernet. Antenna peker på Landås nå, takket være noen jeg tror jeg kjenner. Jeg kjenner alle, så det er ikke et stort hint.»",
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
            "Det blir stille i trakten. Så: «Da er han klokere enn jeg var i høst. Ja. Gjør det. Men ett lys blir lite i en så stor grotte. Det må nå lenger enn til sokkelen, ellers ser han bare en prikk, og en prikk har han hatt lenge.»",
          rampenissen:
            "«Klokere enn Julius. Skriv det ned, nån. Kem som helst. Nissemor, du har penn!»",
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
            "«Krystallene. Noen av dem drikker lys, og noen sender det videre fra hylle til hylle. Hvilke som gjør hva, får dere se selv, med et lys i hånda. Finner dere et løst stykke av de riktige, hører det hjemme foran flammen.»",
          rampenissen:
            "«Prøv dokker fram med lyset. Det e sånn æ gjør alt. Det e sjelden det går så bra, men no e det lov.»",
          valg: [{ tekst: "Vi prøver oss fram." }],
        },
        tjernet: {
          tekst:
            "«IQ måler hvor mye antenna rister i vinden. Jeg holder stigen. Jeg har holdt stigen i to timer. Jeg tror jeg er stigen nå. Stigen og jeg har snakket om det.»",
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
                "Radioen summer, dypt og rolig. Rørene gløder. Lyset står på sokkelen. Alt er som dere lot det være. Det er det fineste man kan si om et sted man har vært.",
            },
            {
              hvis: "radio_stilt",
              tekst:
                "Radioen summer gjennom høyttaleren. Hele grotta lyser rundt den. Det er nå eller aldri. Hva sier man til noen som ikke har hørt en stemme på lenge?",
            },
            {
              hvis: "krystall_satt",
              tekst:
                "Radioen summer. Hele grotta lyser rundt den, og i lyset ser du skiva. Nåla står feil. Han hører ikke dere ennå, bare seg selv.",
            },
            {
              hvis: "lys_paa_sokkelen",
              tekst:
                "Radioen summer. Lanterna lyser svakt på messingen. Resten av grotta er mørk. Det er ikke nok. Ikke ennå.",
            },
            {
              tekst:
                "Radioen summer lavt i mørket. Du hører trekken. Du hører ditt eget hjerte. Du hører ingenting annet.",
            },
          ],
          valg: [
            {
              tekst: "Hei. Vi vet at du er der.",
              hvis: "radio_stilt",
              uten: "hilst",
              neste: "svar",
              flagg: "hilst",
            },
            {
              tekst: "God jul fra Landås.",
              hvis: "radio_stilt",
              uten: "hilst",
              neste: "svar",
              flagg: "hilst",
            },
            {
              tekst: "Lyset er til deg. Du kan beholde det.",
              hvis: "radio_stilt",
              uten: "hilst",
              neste: "svar",
              flagg: "hilst",
            },
            {
              tekst: "Hallo?",
              uten: "radio_stilt",
              neste: "stille",
            },
            { tekst: "Vi går igjen." },
          ],
        },
        stille: {
          tekst: "Summingen fortsetter. Ingen svarer. Ikke ennå.",
          rampenissen:
            "«Vent med å snakk. Først lyset, så heile grotta, så skiva på radioen. Og så hilse vi. Han ska SE oss og HØRE oss når vi sei hei. Æ vil ikkje vær en stemme i mørket. Han har nok av dem.»",
          valg: [{ tekst: "Greit." }],
        },
        svar: {
          tekst:
            "Summingen stopper. Ett sekund. To. Tre. Så starter den igjen, litt dypere og litt roligere enn før. Ingen svarer. Men ingen slår av lyset heller.",
          rampenissen:
            "«Han hørte oss. Æ veit det. Det der va ... det va nok for i dag. Vi kjem tilbake. Æ sa det ikkje så høgt no. Det e nytt.»",
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
          "«Trekken der nede blås ut alt. Nissemor veit sikkert ka gruvefolk gjord med lys i trekk. Spør ho. Ho sitt rett der og skriv.»",
        R +
          "«Nissemor snakka om netting rundt flammen, og så såg ho på tekoppen sin. Ka heng det på en tekopp som e av messing og full av hull?»",
        R +
          "«SNAKK med Nissemor, spør ka som kan skjerme et lys mot trekk, si at vi passe på den, og ta tesilen fra tekoppen hennes.»",
      ],
    },
    {
      id: "skaar",
      ferdig: "tok_krystallskaar",
      tips: [
        R +
          "«Lys i vinduskarmen hos Nissemor, tesil i lomma. Sett lyset INNI tesilen, så har vi ei lanterne. Og nede i grotta: nån av krystallan gjør nåkka med lys. Prøv dokker fram, men ikkje på de blå.»",
        R +
          "«Nederst på den klare hylla sitt et skår fast i rim. Rim e is, og vi har ei varm lanterne. Hold ho inntil hylla, eller la ho lyse på hylla fra sokkelen.»",
        R +
          "«Kombiner lyset og tesilen. Fly ned i grotta og BRUK lanterna på de klare krystallan til høyre. Da løsne skåret. Ta det.»",
      ],
    },
    {
      id: "sokkel",
      ferdig: "lys_paa_sokkelen",
      tips: [
        R +
          "«Lanterna må stå i ro et sted midt i grotta, der trekken ikkje tar ho og ho ser begge hyllene.»",
        R + "«Steinen med snø på, foran radioen. Den e som et bord.»",
        R + "«Sett tesil-lanterna på sokkelen foran radioen.»",
      ],
    },
    {
      id: "skaar_satt",
      ferdig: "skaar_satt",
      tips: [
        R +
          "«Lanterna står, men lyset når ikkje hyllene. Dokker såg sjøl ka de klare krystallan gjør med lys. Vi har et stykke av en.»",
        R + "«Skåret ska stå rett foran flammen, vendt mot den klare hylla.»",
        R + "«Bruk krystallskåret på sokkelen, der lanterna står.»",
      ],
    },
    {
      id: "krystall",
      ferdig: "krystall_satt",
      tips: [
        R +
          "«Den nederste krystallen lyse, men lyset går ut te veggen. Krystallan sitt i ringa og kan vris. BRUK den klare hylla.»",
        R +
          "«Lyset går bare ut der den slipte sida peke. Start nederst ved S og vri hver krystall te lyset treff neste. Hjørnekrystallan snur lyset, den rette sende det videre.»",
        R +
          "«Fra S: opp te hjørnet, snu det mot høyre, gjennom den rette, og hjørnet øverst te høyre snur det opp te M. De to andre hjørnan e bare pynt.»",
      ],
    },
    {
      id: "stemme",
      ferdig: "radio_stilt",
      tips: [
        R +
          "«Heile grotta lyse, og no ser vi skiva på radioen. Nåla står feil. Han hører ikkje oss før ho står der han e.»",
        R +
          "«Han som bygde alt her, skreiv tall på alt. SE på sokkelen no som det e lyst. Der står tallet.»",
        R +
          "«BRUK skiva på radioen og dra nåla te 880. Summingen blir sterkare jo nærmare du kjem. Trykk LÅS FREKVENS.»",
      ],
    },
    {
      id: "hilsen",
      ferdig: "k3_ferdig",
      tips: [
        R +
          "«No lyse heile grotta, og radioen hører. Da mangle bare det viktigaste: å sei hei. Det e det vanskeligaste. Spør mæ.»",
        R + "«SNAKK med radioen på sokkelen.»",
        R +
          "«Trykk på radioen, velg ei hilsen, og sei at vi kjem tilbake. Det held. Det held lenge.»",
      ],
    },
  ],
};
