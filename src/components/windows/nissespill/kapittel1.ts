/**
 * Kapittel 1: «Senga i postkassen» (dag 4). Rampenissen slept in a yarn basket on
 * IQ's loft all year; Winter has impounded it in the village mailbox. Side story
 * only: no clues or codes for the daily puzzles. Rampenissen speaks nordlandsk
 * (docs/manus/rampenissen-radio-2026.md «Skrivemåte»), everyone else bokmål.
 */
import type { Kapittel } from "./motor";

const R = "Rampenissen: ";

export const KAPITTEL_1: Kapittel = {
  n: 1,
  tittel: "Senga i postkassen",
  dag: 4,
  klar: true,
  start: "torget",
  slutt: "k1_ferdig",
  intro: [
    R +
      "«Psst! Hør her, unga. Dokker trur kanskje æ bare sitt her i hylla og glor? Nei da. IQ har kobla kameraan i Snøfall te skjermen dokkers, og no kan dokker styre Knerten: ull-ugla mi med messingbrilla. Ho sitt på torget akkurat no.»",
    R +
      "«Saka e sånn: Æ sov i ei garnkurv på loftet te IQ heile året. Og i kurven ligg lykkebjella mi. Uten den finn ikkje sleden fram te stua dokkers på julaften! Og no e kurven BORTE.»",
    R +
      "«Trykk på ting for å SE, BRUK og SNAKK. Ting dokker plukke opp, havne i lomma nederst. Og vess dokker står fast: TIPS-knappen e mæ. Æ hviske.»",
  ],
  utro:
    R +
    "«Dokker klarte det! Lykkebjella e trygg, og Knerten flyg kurven opp på loftet igjen. Sleden finn fram te stua dokkers, det lover æ. Neste gang treng æ hjelp med nåkka ... kaldere. Æ sei ikkje meir. Over og ut!»",
  gjenstander: {
    tyttebaer: {
      id: "tyttebaer",
      navn: "Frosne tyttebær",
      ikon: "heart",
      se: "Ei neve frosne tyttebær. Harde som småstein og røde som nesa til Rudolf.",
    },
    kaffekopp: {
      id: "kaffekopp",
      navn: "IQs kaffekopp",
      ikon: "coffee",
      se: "Koppen har påskriften «VERDENS BESTE OPPFINNER». Noen har strøket over BESTE og skrevet MEST EKSPLOSIVE med tusj. Den er fortsatt varm.",
    },
    baersaft: {
      id: "baersaft",
      navn: "Kopp med tyttebærsaft",
      ikon: "fire",
      se: "Varm, rød og klissete tyttebærsaft i en kaffekopp. Lukter jul og litt kaffe.",
    },
    skjema: {
      id: "skjema",
      navn: "Skjema 4112-B",
      ikon: "file",
      se: "«Skjema 4112-B: Utlevering av umerket løsøre.» Sju felt, tre underskrifter og et felt merket «Stempel (obligatorisk)». Noen har brukt det som kaffebrikke.",
    },
    bjelle: {
      id: "bjelle",
      navn: "Lykkebjella",
      ikon: "bell",
      se: "En liten messingbjelle med en rød garntråd. Den klinger ikke. Den gnistrer.",
    },
  },
  kombinasjoner: [
    {
      a: "tyttebaer",
      b: "kaffekopp",
      gir: "baersaft",
      tekst:
        "Du slipper de frosne bærene i den varme koppen. Det freser, det damper, og kaffen blir knallrød. " +
        R +
        "«Tyttebærkaffe! Det der har æ faktisk prøvd. Anbefale det ikkje.»",
    },
  ],
  scener: [
    {
      id: "torget",
      navn: "Torget i Snøfall",
      bilde: "spill/torget.jpg",
      utganger: [{ til: "verksted", navn: "Opp trappa til verkstedet" }],
      hotspots: [
        {
          id: "trappa",
          navn: "Trappa",
          rect: { x: 0, y: 8, w: 19, h: 84 },
          smart: "bruk",
          gaaTil: "verksted",
          se: "Ei bratt tretrapp opp til loftet. Det tredje trinnet knirker i D-dur. IQ sier det er en alarm.",
        },
        {
          id: "bodene",
          navn: "Julebodene",
          rect: { x: 20, y: 40, w: 22, h: 42 },
          smart: "bruk",
          se: "To små boder med lanterner. Den ene selger kurver med frosne bær. Den andre selger ... også frosne bær. Konkurransen er hard.",
          ta: {
            item: "tyttebaer",
            tekst:
              "Du tar ei neve frosne tyttebær. Ingen ser det. Bortsett fra Winter, som noterer.",
          },
          bruk: "Du har bær nok. Mer blir det syltetøy av, sier Nissemor.",
        },
        {
          id: "urtaarnet",
          navn: "Urtårnet",
          rect: { x: 52, y: 0, w: 14, h: 62 },
          smart: "se",
          se: "Klokkeskiva har fire visere: timer, minutter, sekunder og «tid til neste julekake». Den fjerde viseren er bøyd fordi noen har prøvd å dytte den framover med en kjepp.",
          bruk:
            "Du når ikke opp til klokka. " +
            R +
            "«Æ nådde den. Én gang. Det e derfor den e bøyd.»",
        },
        {
          id: "husene",
          navn: "Husene",
          rect: { x: 24, y: 14, w: 28, h: 26 },
          smart: "se",
          se: "Fargerike tømmerhus med snø på takene. I et vindu står en nisse og vinker. Nei, han pusser vinduet. Nei, han vinker.",
        },
        {
          id: "postkassen",
          navn: "Postkassen",
          rect: { x: 66, y: 42, w: 16, h: 36 },
          smart: "bruk",
          se: [
            {
              hvis: "k1_ferdig",
              tekst:
                "Tom. Bortsett fra ett brev til Julius og en uleselig klage på grøten.",
            },
            {
              hvis: "postkasse_opplaast",
              tekst:
                "Låsen er åpen, men luka sitter bom fast. Rimfrost rundt hele hengslet.",
            },
            {
              tekst:
                "En rød postkasse med messingkant. På siden henger et skilt: «Brev til Julius legges her. Klager på havregrynsgrøten sendes til feieren.» Innenfra lukter det ... ull?",
            },
          ],
          bruk: [
            {
              hvis: "k1_ferdig",
              tekst: "Kurven er hentet. Luka står og slenger.",
            },
            {
              hvis: "postkasse_opplaast",
              tekst:
                "Du drar i luka. Den rikker seg ikke. Hengslet er frosset fast.",
            },
            {
              tekst:
                "Låst. Winter kremter høyt bak deg uten å se opp fra skriveplata.",
            },
          ],
          bruker: [
            {
              item: "kaffekopp",
              hvis: "postkasse_opplaast",
              uten: "k1_ferdig",
              flagg: "k1_ferdig",
              gir: "bjelle",
              forbruker: true,
              tekst:
                "Du holder den varme koppen mot hengslet. Det drypper, det knaker ... og luka glir opp! Inni ligger garnkurven, og oppi den: lykkebjella. " +
                R +
                "«BJELLA MI! Og ... kurven lukte fortsatt mæ. Det e et kompliment.»",
            },
            {
              item: "kaffekopp",
              uten: "postkasse_opplaast",
              tekst:
                "Winter løfter én finger uten å se opp: «Varme drikker ved offentlig postkasse er regulert i paragraf 14.»",
            },
          ],
          feil: {
            baersaft:
              R +
              "«Ikkje søl saft på postkassa! Winter kjem te å notere det i tre protokolla.»",
            tyttebaer:
              "Du dytter et bær inn i brevsprekken. Winter: «Det der er ikke et brev.»",
            skjema:
              "Du dytter skjemaet mot låsen. Ingenting. Winter: «Skjemaet leveres til meg, ikke til møbler.»",
          },
        },
        {
          id: "stempelputa",
          navn: "Stempelputa",
          rect: { x: 65, y: 78, w: 17, h: 12 },
          smart: "se",
          vis: { hvis: "winter_snakket" },
          se: [
            {
              hvis: "stempel_vaat",
              tekst:
                "Puta er knallrød og våt. Stempelet ved siden av ser nesten lettet ut.",
            },
            {
              tekst:
                "På messinghylla på postkassen ligger et stempel og ei stempelpute. Puta er tørr som en kjeks fra i fjor. Det lukter svakt av rødt.",
            },
          ],
          bruk: "Du trykker stempelet mot puta. Tørt klikk. Ikke en flekk.",
          bruker: [
            {
              item: "baersaft",
              uten: "stempel_vaat",
              flagg: "stempel_vaat",
              gir: "kaffekopp",
              forbruker: true,
              tekst:
                "Du heller den varme tyttebærsaften over puta. Den suger til seg alt og blir knallrød. Winter snuser i lufta: «Lukter det ... skogsbær?» Koppen er fortsatt varm.",
            },
          ],
          feil: {
            tyttebaer:
              "Du gnir et frossent bær mot puta. Det spretter av. " +
              R +
              "«Dem e for harde. Dem må tines først, sjø.»",
            kaffekopp:
              "Du heller en dråpe kaffe på puta. Brun. Winter: «Brunt er ikke en godkjent stempelfarge.»",
          },
        },
        {
          id: "winter",
          navn: "Winter",
          rect: { x: 82, y: 28, w: 18, h: 70 },
          smart: "snakk",
          snakk: "winter",
          se: "Winter står rank som en tinnsoldat. Skjerfet er surret tre ganger. Han har spisset blyanten så mye at den er halvparten så lang som i morges.",
          bruk: "Du prikker Winter på armen. Han noterer: «Prikket. Kl. 16.42.»",
          bruker: [
            {
              item: "skjema",
              hvis: "stempel_vaat",
              uten: "postkasse_opplaast",
              flagg: "postkasse_opplaast",
              forbruker: true,
              tekst:
                "Winter tar skjemaet med to fingertupper, trykker stempelet i puta og ... SMAKK. Et knallrødt avtrykk. Han snuser på det. «Ureglementert bærlukt. Men til nød gyldig.» Han låser opp postkassen med en liten messingnøkkel. " +
                R +
                "«HAHA! Han lukta på det! Fort, før han ombestemme sæ!»",
            },
          ],
          feil: {
            skjema:
              "Winter holder skjemaet mot lyset. «Felt 7-C, stempel, står tomt. Uten stempel er dette en papirlapp egnet til papirbåter.» Han gir det tilbake.",
            tyttebaer:
              "Winter: «Jeg tar ikke imot bestikkelser. Særlig ikke frosne.»",
            kaffekopp:
              "Winter: «Jeg drikker ikke i arbeidstiden. Og slett ikke av en kopp med påskrift.»",
            baersaft: "Winter: «Hva er DET? Nei. Ikke svar.»",
            bjelle:
              "Winter kikker på bjella. «Umerket løsøre.» Du gjemmer den fort.",
          },
        },
      ],
    },
    {
      id: "verksted",
      navn: "IQs verksted",
      bilde: "feed/iq-verksted.png",
      utganger: [{ til: "torget", navn: "Ned trappa til torget" }],
      hotspots: [
        {
          id: "sikringsskapet",
          navn: "Sikringsskapet",
          rect: { x: 0, y: 22, w: 20, h: 40 },
          smart: "se",
          se: "Et skap fullt av målere og visere. Alle står pent på midten, som om ingenting noen gang har skjedd her. Noen har limt på en lapp: «ALDRI MER KAFFETRAKTER».",
          bruk: "Du åpner luka og lukker den igjen. Fort. Noen ting lar man være.",
        },
        {
          id: "tavla",
          navn: "Tavla",
          rect: { x: 22, y: 25, w: 13, h: 26 },
          smart: "se",
          se: "Formler, piler og en tegning av noe rundt. Nederst står det «IKKE VISK UT», og rett under har noen visket ut noe.",
        },
        {
          id: "oscilloskopet",
          navn: "Oscilloskopet",
          rect: { x: 20, y: 58, w: 9, h: 18 },
          smart: "se",
          se: "Den grønne streken tegner en kurve som ser nøyaktig ut som profilen til en gretten grevling. Hver gang noen tråkker på gulvet, hopper halen.",
          bruk: "Du vrir på en knott. Grevlingen blir et pinnsvin. Du vrir tilbake.",
        },
        {
          id: "radioroerene",
          navn: "Radiorørene",
          rect: { x: 7, y: 70, w: 13, h: 16 },
          smart: "se",
          se: "Tre glødende rør i rødt, grønt og oransje. De summer i tre forskjellige toner. Sammen blir det nesten en julesang. Nesten.",
          bruk:
            "Varmt! Du trekker fingeren til deg. " +
            R +
            "«Ja. Det va sånn æ lærte det òg.»",
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 54, y: 18, w: 10, h: 28 },
          smart: "se",
          se: "Rim på rutene og snø utenfor. På innsiden har noen tegnet et smilefjes i duggen. Med nesa, ser det ut som.",
        },
        {
          id: "skiltet",
          navn: "Skiltet",
          rect: { x: 66, y: 7, w: 11, h: 12 },
          smart: "se",
          se: "«IKKE RØR (GJELDER OGSÅ RAMPENISSEN)». Under skiltet henger en lapp med klementin-klistremerker: «Æ rørte ikkje. Æ bare kikka med fingran. – R.»",
        },
        {
          id: "doera",
          navn: "IQs dør",
          rect: { x: 66, y: 20, w: 14, h: 44 },
          smart: "snakk",
          snakk: "iq",
          se: "IQs dør. Innenfra høres klirring, summing og en mann som snakker med en skrutrekker.",
          bruk: "Låst. En lapp: «BANK TRE GANGER. IKKE FIRE.» Noen har banket fire ganger, for det er en bulk nederst.",
        },
        {
          id: "kaffekoppen",
          navn: "Kaffekoppen",
          rect: { x: 45, y: 74, w: 9, h: 13 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_kaffekopp",
              tekst: "En våt ring på benken der koppen sto. Og tre skruer.",
            },
            {
              tekst:
                "En kaffekopp som fortsatt ryker. Oppi flyter tre skruer og noe som kanskje er en rosin. Kanskje.",
            },
          ],
          ta: {
            item: "kaffekopp",
            tekst:
              "Du tar koppen. Den er varm. Du fisker ut skruene og legger dem pent på benken. Rosinen får bli.",
          },
          bruk: "Her sto koppen. Nå er det bare en varm ring igjen.",
        },
        {
          id: "tegningen",
          navn: "Tegningen",
          rect: { x: 36, y: 86, w: 17, h: 14 },
          smart: "se",
          se: "En tegning av en slede med to svære trakter bak på meiene. Noen har skrevet «DREVET AV PEPPERKAKEGASS» med blyant, og Julius har satt et stort spørsmålstegn ved siden av med rød fargestift.",
        },
        {
          id: "sidebordet",
          navn: "Sidebordet",
          rect: { x: 78, y: 50, w: 14, h: 22 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_skjema",
              tekst: "Lampa, en loddebolt og en kaffering uten kopp.",
            },
            {
              tekst:
                "Et lite bord med skrivebordslampe. Under lampa ligger en bunke skjemaer med en kaffering på toppen. IQ bruker dem som kaffebrikker.",
            },
          ],
          ta: {
            item: "skjema",
            tekst:
              "Du tar det øverste skjemaet. «Skjema 4112-B». Kafferingen er heldigvis bare på baksiden. " +
              R +
              "«Det e DET skjemaet! Winter elske det skjemaet.»",
          },
          bruk: "Resten av bunken får ligge. IQ trenger kaffebrikker.",
        },
        {
          id: "krakken",
          navn: "Krakken",
          rect: { x: 67, y: 65, w: 10, h: 15 },
          smart: "se",
          se: "IQs krakk. Den har tre bein og en bok under det fjerde. Boka heter «Balanse for viderekomne».",
        },
        {
          id: "hyllene",
          navn: "Hyllene",
          rect: { x: 40, y: 8, w: 16, h: 16 },
          smart: "se",
          se: "Syltetøyglass fulle av skruer, tannhjul og ett som faktisk inneholder syltetøy. Det glasset har en lapp: «MITT. – IQ»",
        },
      ],
    },
  ],
  dialoger: {
    winter: {
      taler: "Winter",
      portrett: "winter",
      start: "start",
      noder: {
        start: {
          tekst: [
            {
              hvis: "postkasse_opplaast",
              tekst:
                "«Postkassen er låst opp i henhold til nødparagraf 99. Resten er deres problem. Og hengslets.»",
            },
            {
              hvis: "winter_snakket",
              tekst:
                "«Dere igjen. Skjema 4112-B, stemplet. Jeg gjentar ikke mer enn tre ganger, og dette var nummer to.»",
            },
            {
              tekst:
                "«Halt! Torget er i dag reservert for reglementert postbehandling i henhold til Snøfall-vedtekt paragraf 12. Har dere gyldig ærend, eller sprer dere bare snøslaps?»",
            },
          ],
          valg: [
            {
              tekst: "Vi leter etter en garnkurv. Med en bjelle i.",
              neste: "kurv",
              flagg: "winter_snakket",
            },
            {
              tekst: "Vi har Skjema 4112-B her!",
              harItem: "skjema",
              uten: "stempel_vaat",
              neste: "ustemplet",
            },
            {
              tekst: "Vær så god: skjema, og stempelputa er våt!",
              harItem: "skjema",
              hvis: "stempel_vaat",
              uten: "postkasse_opplaast",
              neste: "stemplet",
              flagg: "postkasse_opplaast",
              tar: "skjema",
            },
            {
              tekst: "Kan du ikke bare stemple nå?",
              hvis: "winter_snakket",
              uten: "stempel_vaat",
              neste: "tort",
            },
            { tekst: "Har du sett Rampenissen?", neste: "rampen" },
            { tekst: "Hvorfor har du tre runder med skjerf?", neste: "skjerf" },
            { tekst: "Ha det, Winter." },
          ],
        },
        kurv: {
          tekst:
            "«Garnkurven. Umerket løsøre, funnet på loftet til IQ, full av ull og klementinskall. Deponert i postkassen i påvente av Skjema 4112-B. Utfylt. Stemplet.»",
          rampenissen: "«POSTKASSEN?! Han har lagt SENGA mi i postkassen!»",
          valg: [
            { tekst: "Hvor får vi tak i et sånt skjema?", neste: "skjema" },
            { tekst: "Og stempelet?", neste: "tort" },
            { tekst: "Takk, vi fikser det." },
          ],
        },
        skjema: {
          tekst:
            "«Skjema 4112-B deles ut i verkstedet til IQ. Han har en hel bunke. Han bruker dem som kaffebrikker. Jeg har sendt tre klager.»",
          rampenissen:
            "«Kaffebrikke! Det e jo helt genialt. Æ meine: fryktelig.»",
          valg: [
            { tekst: "Og stempelet?", neste: "tort" },
            { tekst: "Vi går opp og ser." },
          ],
        },
        tort: {
          tekst:
            "«Stempelputen er tørr. Tørr som julekake fra i fjor. Uten farge, intet stempel. Uten stempel, intet skjema. Uten skjema, ingen kurv. Det er systemet.»",
          rampenissen:
            "«Tørr pute? Da treng vi nåkka vått og rødt. Og helst varmt, for alt her e frossent.»",
          valg: [{ tekst: "Skjønner. Vi finner noe rødt." }],
        },
        rampen: {
          tekst:
            "«Rampenissen. Han som sov på loftet til IQ i elleve måneder og dro uten å feie. Hvis dere har kontakt med ham: han skylder meg toogførti minutter arbeidstid.»",
          rampenissen:
            "«Toogførti minutt? Æ brukte to tima på å stable klementinkassan hans! Han kan få en klementin i posten vess han e snill.»",
          valg: [{ tekst: "Vi skal hilse." }],
        },
        skjerf: {
          tekst:
            "«Én runde for trekken fra tjernet. Én runde for luftingen fra klokketårnet. Og én runde for alminnelig anstendighet. En hals uten skjerf er et åpent sår i kontorlandskapet.»",
          rampenissen: "«Æ har null runda. Æ e et åpent sår.»",
          valg: [{ tekst: "Logisk." }],
        },
        ustemplet: {
          tekst:
            "Winter tar skjemaet med to fingertupper og holder det mot lyset. «Mhm. Felt 7-C, stempel, står tomt. Uten stempel er dette en papirlapp egnet til papirbåter.» Han gir det tilbake.",
          rampenissen: "«Papirbåt! ... Nei. Fokus. Stempel.»",
          valg: [{ tekst: "Vi kommer tilbake." }],
        },
        stemplet: {
          tekst:
            "Winter trykker stempelet i den røde puta og ... SMAKK. Han snuser på avtrykket. «Ureglementert bærlukt. Men til nød gyldig.» Han låser opp postkassen med en liten messingnøkkel og går tilbake til skriveplata.",
          rampenissen:
            "«HAHA! Han LUKTA på det! Fort, kurven, før han ombestemme sæ!»",
          valg: [{ tekst: "Takk, Winter!" }],
        },
      },
    },
    iq: {
      taler: "IQ (gjennom døra)",
      portrett: "iq",
      start: "start",
      noder: {
        start: {
          tekst:
            "«Hvem er det? Hvis det er Rampenissen, så er svaret fortsatt NEI, du får ikke låne sledetegningen!»",
          valg: [
            {
              tekst: "Det er oss! Vi hjelper Rampenissen med garnkurven.",
              neste: "kurv",
            },
            { tekst: "Hvorfor står det IKKE RØR på skiltet?", neste: "skilt" },
            { tekst: "Hva lager du der inne?", neste: "hemmelig" },
            { tekst: "Vi går igjen." },
          ],
        },
        kurv: {
          tekst:
            "«Kurven! Winter tok den. Han sa den var umerket løsøre. Jeg sa den var merket, den luktet jo Rampenissen. Han godtok ikke lukt som merking.»",
          rampenissen: "«Lukt E merking! Det står sikkert i en paragraf.»",
          valg: [
            { tekst: "Har du et skjema til Winter?", neste: "skjema" },
            { tekst: "Takk, IQ!" },
          ],
        },
        skjema: {
          tekst:
            "«Skjema 4112-B? Jeg har en bunke under lampa på sidebordet. Ta ett. Ta ti. Jeg bruker dem som kaffebrikker, de er akkurat passe tykke.»",
          valg: [{ tekst: "Takk!" }],
        },
        skilt: {
          tekst:
            "«Fordi folk rører. Særlig én bestemt person med rød lue. Skiltet gjelder forresten også dere, men dere er sikkert flinkere.»",
          rampenissen:
            "«Æ rørte ikkje. Æ kikka med fingran. Det e nåkka heilt anna.»",
          valg: [{ tekst: "Vi skal ikke røre." }],
        },
        hemmelig: {
          tekst:
            "«Noe hemmelig. Så hemmelig at jeg ikke husker det selv akkurat nå. Det summer, i hvert fall. Det er et godt tegn. Som regel.»",
          valg: [{ tekst: "Lykke til med summingen." }],
        },
      },
    },
  },
  gaater: [
    {
      id: "winter",
      ferdig: "winter_snakket",
      tips: [
        R +
          "«Kurven min e borte fra loftet. Nån på torget veit sikkert nåkka. Han med skjerfet, kanskje?»",
        R + "«SNAKK med Winter ved postkassa. Spør om garnkurven.»",
        R +
          "«Trykk på Winter og velg «Vi leter etter en garnkurv». Han elske å forklare.»",
      ],
    },
    {
      id: "stempel",
      ferdig: "stempel_vaat",
      tips: [
        R +
          "«Stempelputa te Winter e tørr. Vi treng nåkka vått og rødt. Og varmt, for alt e frossent her.»",
        R +
          "«Bæran i boden e røde, men harde som stein. Nåkka varmt oppe hos IQ kan tine dem.»",
        R +
          "«Ta tyttebæran fra boden og kaffekoppen te IQ. Trykk på bæran i lomma, så på koppen. Hell saften på stempelputa ved postkassa.»",
      ],
    },
    {
      id: "skjema",
      ferdig: "postkasse_opplaast",
      tips: [
        R + "«Winter vil ha et skjema. 4112-B. IQ har sånne, trur æ.»",
        R + "«Sjå på det lille sidebordet med lampa oppe i verkstedet.»",
        R +
          "«Ta skjemaet fra sidebordet hos IQ og gi det te Winter når stempelputa e våt.»",
      ],
    },
    {
      id: "luke",
      ferdig: "k1_ferdig",
      tips: [
        R +
          "«Låsen e åpen, men luka sitt fast. Frossen. Ka e det som smelte is?»",
        R + "«Nåkka varmt mot hengslet. Har vi nåkka varmt i lomma?»",
        R + "«Bruk den varme kaffekoppen på postkassa.»",
      ],
    },
  ],
};
