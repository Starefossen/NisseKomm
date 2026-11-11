/**
 * Kapittel 1: «Senga i postkassen» (dag 4). Rampenissen slept in a yarn basket on
 * IQ's loft all year; Winter has impounded it in the village mailbox. Written for
 * Håkon (9) and Kristian (12): the form needs IQ's signature under the door and a
 * stamp from a pad that must be wetted with thawed berries; the jam jar is a red
 * herring. Side story only: no clues or codes for the daily puzzles. Rampenissen
 * speaks nordlandsk (docs/manus/rampenissen-radio-2026.md «Skrivemåte»),
 * everyone else bokmål.
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
      "«Psst. Dokker trur kanskje æ bare sitt i hylla og glor? Feil. IQ har kobla kameraan i Snøfall te skjermen dokkers, og no styre dokker Knerten: ull-ugla mi med messingbrilla. Ho sitt på torget. Ho e smartare enn ho ser ut. Det e ikkje vanskelig.»",
    R +
      "«Saka e sånn: Æ sov i ei garnkurv på loftet te IQ heile året. I kurven ligg lykkebjella mi. Uten den finn ikkje sleden fram te stua dokkers på julaften. Og no e kurven BORTE. Nån har tatt senga mi. Æ har mistanka. Han har skjerf.»",
    R +
      "«Dokker kan sånt her. SE, BRUK, SNAKK, lomma nederst. Står dokker fast, e TIPS-knappen mæ som hviske. Æ hviske høgt.»",
  ],
  utro:
    R +
    "«Dokker klarte det! Lykkebjella e trygg, og Knerten flyg kurven opp på loftet igjen. Winter fikk skjemaet sitt, IQ fikk glasset sitt, og æ fikk senga mi. Alle vant. Winter mest, han har et brunsvidd skjema med bærlukt i arkivet. Neste gang treng æ hjelp med nåkka ... kaldere. Æ sei ikkje meir. Over og ut!»",
  gjenstander: {
    tyttebaer: {
      id: "tyttebaer",
      navn: "Frosne tyttebær",
      ikon: "heart",
      se: "Ei neve frosne tyttebær. Harde som småstein og røde som nesa til Rudolf. Prøver du å knuse ett, vinner bæret.",
    },
    kaffekopp: {
      id: "kaffekopp",
      navn: "IQs kaffekopp",
      ikon: "coffee",
      se: "Koppen har påskriften «VERDENS BESTE OPPFINNER». Noen har strøket over BESTE og skrevet MEST EKSPLOSIVE med tusj. Kaffen ryker fortsatt. Den har sannsynligvis rukket å bli farlig.",
    },
    baersaft: {
      id: "baersaft",
      navn: "Kopp med tyttebærsaft",
      ikon: "fire",
      se: "Varm, rød og klissete tyttebærsaft i en kaffekopp. Lukter jul og litt kaffe. Fargen er nøyaktig den fargen Winter kaller «godkjent rød» i paragraf 9.",
    },
    skjema: {
      id: "skjema",
      navn: "Skjema 4112-B",
      ikon: "file",
      se: "«Skjema 4112-B: Utlevering av umerket løsøre.» Sju felt, tre underskrifter og et felt merket «Stempel (obligatorisk)». Felt 3-A heter «Eier av funnsted». Noen har brukt baksiden som kaffebrikke.",
    },
    skjema_signert: {
      id: "skjema_signert",
      navn: "Skjema 4112-B, signert",
      ikon: "file",
      se: "Samme skjema, nå med IQs underskrift i felt 3-A og et brunsvidd hjørne. Signaturen ser ut som en fjær som har gått på et tannhjul. Felt 7-C, stempel, er fortsatt tomt og hvitt.",
    },
    syltetoey: {
      id: "syltetoey",
      navn: "IQs syltetøyglass",
      ikon: "potion",
      se: "Et glass rød syltetøy med lappen «MITT. – IQ». Under lappen står det med mindre skrift: «JA, OGSÅ DU, RAMPENISSEN». Rødt, vått og dessverre eid av noen.",
    },
  },
  fjaerBelonning:
    R +
    "«To uglefjær! Knerten mista dem ikkje. Ho legg dem igjen med vilje. Det e sånn ho skriv navnet sitt.»",
  puslespill: {
    skrin: {
      type: "laas",
      tittel: "Stempelskrinet",
      flagg: "skrin_aapent",
      tekst:
        "1-6-4-0. Det siste hjulet klikker, og lokket spretter opp. Inni ligger stempelet «SNØFALL POSTVESEN» på rød fløyel, som en liten konge. Winter ser opp fra skriveplata: «Tømmetiden. Selvsagt. Jeg visste det.» Han visste det ikke.",
      hjul: [
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      ],
      svar: ["1", "6", "4", "0"],
    },
    frostluke: {
      type: "skyv",
      tittel: "Postkortet på luka",
      flagg: "k1_ferdig",
      tekst:
        "Siste bit glir på plass, og torget er helt igjen. KLIKK. Luka svinger opp. Inni ligger garnkurven, og oppi den: lykkebjella. Den klinger ikke. Den gnistrer. " +
        R +
        "«BJELLA MI! Og kurven lukte fortsatt mæ. Det e et kompliment. Æ tar det som et kompliment.»",
      bilde: "spill/torget.jpg",
      trekk: 30,
    },
  },
  kombinasjoner: [
    {
      a: "tyttebaer",
      b: "kaffekopp",
      gir: "baersaft",
      tekst:
        "Du slipper de frosne bærene i den varme kaffen. Det freser, det damper, og kaffen blir knallrød. " +
        R +
        "«Tyttebærkaffe! Det der har æ faktisk prøvd. Æ sov ikkje på tre dager. Det va ikkje kaffen, det va bæran.»",
    },
  ],
  scener: [
    {
      id: "torget",
      navn: "Torget i Snøfall",
      bilde: "spill/torget.jpg",
      utganger: [{ til: "verksted", navn: "Opp trappa til verkstedet" }],
      // In the snow in front of the clock tower, between the stalls and the mailbox
      fjaer: { x: 49, y: 86, w: 4, h: 6 },
      hotspots: [
        {
          id: "trappa",
          navn: "Trappa",
          rect: { x: 0, y: 8, w: 19, h: 84 },
          smart: "bruk",
          gaaTil: "verksted",
          se: "Ei bratt tretrapp opp til loftet. Det tredje trinnet knirker i D-dur. IQ kaller det en alarm. Rampenissen kaller det trinn nummer tre, og hopper over det.",
        },
        {
          id: "bodene",
          navn: "Julebodene",
          rect: { x: 20, y: 40, w: 22, h: 42 },
          smart: "bruk",
          se: "To små boder med lanterner. Den ene selger kurver med frosne bær. Den andre selger også frosne bær, men med skilt: «BEDRE». Konkurransen er hard og helt lik.",
          ta: {
            item: "tyttebaer",
            tekst:
              "Du tar ei neve frosne tyttebær fra kurven. Ingen ser det. Bortsett fra Winter, som noterer: «Bær. Ei neve. Kl. 16.40.»",
          },
          bruk: "Du har bær nok. Tar du mer, blir det syltetøy av det, sier Nissemor, og da må du stå og røre til påske.",
        },
        {
          id: "urtaarnet",
          navn: "Urtårnet",
          rect: { x: 52, y: 0, w: 14, h: 62 },
          smart: "se",
          se: "Klokkeskiva har fire visere: timer, minutter, sekunder og «tid til neste julekake». Den fjerde er bøyd fordi noen har prøvd å dytte den framover med en kjepp.",
          bruk:
            "Du når ikke opp til klokka. " +
            R +
            "«Æ nådde den. Én gang. Det e derfor den e bøyd. Og det e derfor julekakan kom tre tima for tidlig i 2023. Ingen klagde.»",
        },
        {
          id: "husene",
          navn: "Husene",
          rect: { x: 24, y: 14, w: 28, h: 26 },
          smart: "se",
          se: "Fargerike tømmerhus med snø på takene. I et vindu står en nisse og vinker. Nei, han pusser vinduet. Nei, han vinker. Han gjør begge deler. Han er effektiv.",
        },
        {
          id: "postkassen",
          navn: "Postkassen",
          rect: { x: 66, y: 42, w: 16, h: 36 },
          smart: "bruk",
          vis: { uten: "hengsel_tint" },
          se: [
            {
              hvis: "postkasse_opplaast",
              tekst:
                "Låsen er åpen, men luka sitter bom fast. Rimfrost rundt hele hengslet. Frosten bryr seg ikke om paragrafer.",
            },
            {
              tekst:
                "En rød postkasse med messingkant. På siden henger et skilt: «Brev til Julius legges her. Tømmes kl. 16.40. Klager på havregrynsgrøten sendes til feieren.» Innenfra lukter det ... ull? Og klementin.",
            },
          ],
          bruk: [
            {
              hvis: "postkasse_opplaast",
              tekst:
                "Du drar i luka. Den rikker seg ikke. Hengslet er frosset fast, og Knerten har ikke armer til å dra med. Hun har prøvd. Det er pinlig for alle.",
            },
            {
              tekst:
                "Låst. Winter kremter høyt bak deg uten å se opp fra skriveplata. Han har et eget kremt for postkasser.",
            },
          ],
          bruker: [
            {
              item: "kaffekopp",
              hvis: "postkasse_opplaast",
              flagg: "hengsel_tint",
              forbruker: true,
              tekst:
                "Du holder den varme koppen mot hengslet. Det drypper, det knaker ... og luka glir opp en tomme. Så stopper den. På innsiden av luka har Winter limt et postkort av torget, og frosten har skjøvet det i ni biter. Winter: «Frostlås. Paragraf 101. Luka åpnes når bildet er helt.» " +
                R +
                "«Han har PARAGRAF på det! Skyv bitan på plass, så e vi inne.»",
            },
            {
              item: "kaffekopp",
              uten: "postkasse_opplaast",
              tekst:
                "Winter løfter én finger uten å se opp: «Varme drikker inntil offentlig postkasse er regulert i paragraf 14. Låst er låst, også for kaffe.»",
            },
          ],
          feil: {
            baersaft:
              R +
              "«Ikkje søl saft på postkassa! Winter kjem te å notere det i tre protokolla og en kalender.»",
            tyttebaer:
              "Du dytter et bær inn i brevsprekken. Winter: «Det der er ikke et brev. Det er ikke engang et postkort.»",
            skjema:
              "Du dytter skjemaet mot låsen. Ingenting. Winter: «Skjemaet leveres til meg, ikke til møbler.»",
            skjema_signert:
              "Du vifter med skjemaet foran låsen. Låsen er ikke imponert. Winter: «Jeg er låsen. Snakk med meg.»",
            syltetoey:
              "Du holder syltetøyglasset mot postkassen. Winter: «Jeg skal late som jeg ikke så det.» Han så det.",
          },
        },
        {
          id: "luka",
          navn: "Luka",
          rect: { x: 66, y: 42, w: 16, h: 36 },
          smart: "bruk",
          vis: { hvis: "hengsel_tint" },
          puslespill: "frostluke",
          se: [
            {
              hvis: "k1_ferdig",
              tekst:
                "Tom. Bortsett fra ett brev til Julius og en uleselig klage på grøten. Klagen er signert «R.». Du sier ingenting.",
            },
            {
              tekst:
                "Luka står på gløtt. På innsiden sitter et postkort av torget i ni biter, skjøvet hulter til bulter av frosten. Én rute er tom. Bitene kan skyves dit.",
            },
          ],
          bruk: "Kurven er hentet. Luka står og slenger. Winter ser på den som om den skylder ham penger.",
        },
        {
          id: "stempelputa",
          navn: "Stempelputa",
          rect: { x: 65, y: 78, w: 8, h: 12 },
          smart: "se",
          se: [
            {
              hvis: "stempel_vaat",
              tekst:
                "Puta er knallrød og våt. Skrinet ved siden av ser nesten lettet ut. Det har ventet på dette siden i fjor.",
            },
            {
              tekst:
                "På messinghylla på postkassen ligger ei stempelpute og et lite skrin. Puta er tørr som en kjeks fra i fjor. Det lukter svakt av rødt, hvis rødt har en lukt. Det har det her.",
            },
          ],
          bruk: "Du trykker fingeren mot puta. Tørr. Ikke en flekk. Stempelet ligger i skrinet ved siden av og venter.",
          bruker: [
            {
              item: "baersaft",
              uten: "stempel_vaat",
              flagg: "stempel_vaat",
              gir: "kaffekopp",
              forbruker: true,
              tekst:
                "Du heller den varme tyttebærsaften over puta. Den suger til seg alt og blir knallrød. Winter snuser i lufta: «Lukter det ... skogsbær?» Koppen er fortsatt varm. Du beholder den. Man vet aldri.",
            },
          ],
          feil: {
            tyttebaer:
              "Du gnir et frossent bær mot puta. Det spretter av og treffer Winter i skjerfet. " +
              R +
              "«Dem e for harde. Dem må tines, sjø. Nåkka varmt.»",
            kaffekopp:
              "Du heller en dråpe kaffe på puta. Brun. Winter: «Brunt er ikke en godkjent stempelfarge. Brunt er en godkjent kaffefarge. Det er to forskjellige skjemaer.»",
            syltetoey:
              "Du smører en klatt syltetøy på puta. Det er rødt! Det er vått! Winter trykker stempelet i det, og stempelet blir sittende fast. SMATT. Han drar det løs. «Klissete er ikke en farge.» Puta er like tørr under klatten. " +
              R +
              "«Nesten. NESTEN. Det må vær tynt og rødt, ikkje tjukt og rødt.»",
          },
        },
        {
          id: "skrinet",
          navn: "Stempelskrinet",
          rect: { x: 74, y: 78, w: 8, h: 12 },
          smart: "bruk",
          puslespill: "skrin",
          se: [
            {
              hvis: "skrin_aapent",
              tekst:
                "Skrinet står åpent. Stempelet ligger på rød fløyel og ser viktig ut. Hjulene står på 1-6-4-0. Winter har allerede notert at noen åpnet det.",
            },
            {
              tekst:
                "Et lite messingskrin med fire tallhjul, fastskrudd i hylla. Gravert i lokket: «STEMPEL. ÅPNES VED TØMMING.» Winter låser inn stempelet mellom hver stempling. Hver eneste.",
            },
          ],
          bruk: "Skrinet står åpent. Stempelet får ligge, det er Winter som skal bruke det. Han har et eget grep for stempler.",
          feil: {
            kaffekopp:
              "Du setter koppen på skrinet. Det blir en ring. Winter: «Det der skrinet har stått ringfritt siden 1987.» Du tørker den vekk. Han noterer likevel.",
            baersaft:
              R +
              "«Ikkje på skrinet! Saften ska på PUTA. Skrinet ska bare opnes.»",
          },
        },
        {
          id: "winter",
          navn: "Winter",
          rect: { x: 82, y: 28, w: 18, h: 70 },
          smart: "snakk",
          snakk: "winter",
          se: "Winter står rank som en tinnsoldat. Skjerfet er surret tre ganger. Han har spisset blyanten så mye at den er halvparten så lang som i morges. Han har en reserveblyant. Den er også spisset.",
          bruk: "Du prikker Winter på armen. Han noterer: «Prikket. Kl. 16.42.» Så noterer han at han noterte.",
          bruker: [
            {
              item: "skjema_signert",
              alle: [{ hvis: "stempel_vaat" }, { hvis: "skrin_aapent" }],
              uten: "postkasse_opplaast",
              flagg: "postkasse_opplaast",
              forbruker: true,
              tekst:
                "Winter tar skjemaet med to fingertupper, leser felt 3-A, nikker, løfter stempelet ut av skrinet, trykker det i puta og ... SMAKK. Et knallrødt avtrykk. Han snuser på det. «Ureglementert bærlukt. Brunsvidd hjørne. Men til nød gyldig.» Han låser opp postkassen med en liten messingnøkkel. " +
                R +
                "«HAHA! Han lukta på det! Fort, før han finn en paragraf til!»",
            },
            {
              item: "skjema_signert",
              hvis: "stempel_vaat",
              uten: "skrin_aapent",
              tekst:
                "Winter leser felt 3-A og nikker. Så ser han på den våte puta, og så på skrinet. «Puta er godkjent. Stempelet ligger i skrinet. Skrinet er låst. Jeg åpner ikke skrin i arbeidstiden.» Han gir skjemaet tilbake.",
            },
          ],
          feil: {
            skjema:
              "Winter holder skjemaet mot lyset. «Felt 3-A, eier av funnsted: tomt. Felt 7-C, stempel: tomt. To mangler. Jeg teller.» Han gir det tilbake.",
            skjema_signert:
              "Winter leser felt 3-A. «IQ. Brunsvidd, men gyldig.» Så felt 7-C. «Tomt. Et halvt skjema er et helt nei.» Han gir det tilbake og peker på den tørre stempelputa uten å se på den.",
            tyttebaer:
              "Winter: «Jeg tar ikke imot bestikkelser. Særlig ikke frosne. Frosne bestikkelser holder lenger, og det gjør det verre.»",
            kaffekopp:
              "Winter: «Jeg drikker ikke i arbeidstiden. Og slett ikke av en kopp som kaller noen eksplosiv.»",
            baersaft:
              "Winter: «Hva er DET? Nei. Ikke svar. Jeg vil ikke ha det i protokollen.»",
            syltetoey:
              "Winter leser lappen. «MITT. – IQ.» Han ser på deg. «Dette er det best merkede løsøret i hele Snøfall. Lever det tilbake før jeg må lage et skjema for det.»",
          },
        },
      ],
    },
    {
      id: "verksted",
      navn: "IQs verksted",
      bilde: "spill/iq-verksted.jpg",
      utganger: [{ til: "torget", navn: "Ned trappa til torget" }],
      // On the bench between the blackboard and the coffee cup
      fjaer: { x: 38, y: 62, w: 4, h: 6 },
      hotspots: [
        {
          id: "sikringsskapet",
          navn: "Sikringsskapet",
          rect: { x: 0, y: 22, w: 20, h: 40 },
          smart: "se",
          se: "Et skap fullt av målere og visere. Alle står pent på midten, som om ingenting noen gang har skjedd her. Noen har limt på en lapp: «ALDRI MER KAFFETRAKTER». Lappen er svidd i kanten.",
          bruk: "Du åpner luka og lukker den igjen. Fort. Inni sto det tre sikringer og en liten lapp til: «IKKE DEN RØDE».",
        },
        {
          id: "tavla",
          navn: "Tavla",
          rect: { x: 22, y: 25, w: 13, h: 26 },
          smart: "se",
          se: "Formler, piler og en tegning av noe rundt. Nederst står det «IKKE VISK UT», og rett under har noen visket ut noe. Det som er visket ut, var større enn det som står igjen.",
        },
        {
          id: "oscilloskopet",
          navn: "Oscilloskopet",
          rect: { x: 20, y: 58, w: 9, h: 18 },
          smart: "se",
          se: "Den grønne streken tegner en kurve som ser nøyaktig ut som profilen til en gretten grevling. Hver gang noen tråkker på gulvet, hopper halen.",
          bruk: "Du vrir på en knott. Grevlingen blir et pinnsvin. Du vrir tilbake. Grevlingen ser ikke fornøyd ut, men det gjorde den ikke før heller.",
        },
        {
          id: "radioroerene",
          navn: "Radiorørene",
          rect: { x: 7, y: 70, w: 13, h: 16 },
          smart: "se",
          se: "Tre glødende rør i rødt, grønt og oransje. De summer i tre forskjellige toner. Sammen blir det nesten en julesang. Nesten. Mer som en julesang som har gått seg vill.",
          bruk:
            "Varmt! Du trekker fingeren til deg. " +
            R +
            "«Ja. Det va sånn æ lærte det òg. Og sånn æ lærte det andre gangen.»",
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 54, y: 18, w: 10, h: 28 },
          smart: "se",
          se: "Rim på rutene og snø utenfor. På innsiden har noen tegnet et smilefjes i duggen. Med nesa, ser det ut som. Nesa var kald etterpå, ser det også ut som.",
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
          se: "IQs dør. Innenfra høres klirring, summing og en mann som forhandler med en skrutrekker. Det er en sprekk under døra, akkurat bred nok til et ark. Eller en veldig flat nisse.",
          bruk: "Låst. En lapp: «BANK TRE GANGER. IKKE FIRE.» Noen har banket fire ganger, for det er en bulk nederst. Bulken er på størrelse med en rød lue.",
          bruker: [
            {
              item: "skjema",
              uten: "skjema_signert",
              flagg: "skjema_signert",
              gir: "skjema_signert",
              forbruker: true,
              tekst:
                "Du skyver skjemaet inn under døra. Stille. Så: en penn som skraper, et lite PANG, og skjemaet kommer ut igjen med en signatur i felt 3-A og et brunsvidd hjørne. IQ: «Ikke spør om hjørnet.» " +
                R +
                "«Han signere alt som kjem under døra. Det e sånn han endte opp med en rein.»",
            },
          ],
          feil: {
            skjema_signert:
              "Du skyver skjemaet under døra igjen. Det kommer tilbake med en gang. IQ: «Jeg har signert. Jeg signerer ikke to ganger. Det ser desperat ut.»",
            syltetoey:
              "Du holder glasset opp mot døra. IQ, innenfra, uten å se: «Er det glasset mitt? Det er glasset mitt. Sett det TILBAKE.» Du vet ikke hvordan han vet. Han vet.",
            kaffekopp:
              "Du skyver koppen mot døra. Den passer ikke under. IQ: «Hvis det er kaffen min: behold den. Jeg har en til. Jeg har alltid en til.»",
            tyttebaer:
              "Du triller et bær under døra. Det kommer tilbake. Raskere. IQ har en fjær der inne.",
          },
        },
        {
          id: "kaffekoppen",
          navn: "Kaffekoppen",
          rect: { x: 45, y: 74, w: 9, h: 13 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_kaffekopp",
              tekst:
                "En våt ring på benken der koppen sto. Og tre skruer. Og rosinen. Rosinen vant.",
            },
            {
              tekst:
                "En kaffekopp som fortsatt ryker. Oppi flyter tre skruer og noe som kanskje er en rosin. Kanskje. Ingen har hatt mot til å sjekke.",
            },
          ],
          ta: {
            item: "kaffekopp",
            tekst:
              "Du tar koppen. Den er varm. Du fisker ut skruene og legger dem pent på benken. Rosinen får bli. Rosinen har bodd der lenger enn deg.",
          },
          bruk: "Her sto koppen. Nå er det bare en varm ring igjen, og tre skruer som savner den.",
        },
        {
          id: "tegningen",
          navn: "Tegningen",
          rect: { x: 36, y: 86, w: 17, h: 14 },
          smart: "se",
          se: "En tegning av en slede med to svære trakter bak på meiene. Noen har skrevet «DREVET AV PEPPERKAKEGASS» med blyant, og Julius har satt et stort spørsmålstegn ved siden av med rød fargestift. IQ har satt et utropstegn ved spørsmålstegnet. Diskusjonen pågår.",
        },
        {
          id: "sidebordet",
          navn: "Sidebordet",
          rect: { x: 78, y: 50, w: 14, h: 22 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_skjema",
              tekst:
                "Lampa, en loddebolt og en kaffering uten kopp. Resten av bunken ligger og venter på kaffe.",
            },
            {
              tekst:
                "Et lite bord med skrivebordslampe. Under lampa ligger en bunke skjemaer med en kaffering på toppen. IQ bruker dem som kaffebrikker. Winter har sendt tre klager. De ligger i bunken.",
            },
          ],
          ta: {
            item: "skjema",
            tekst:
              "Du tar det øverste skjemaet. «Skjema 4112-B». Kafferingen er heldigvis bare på baksiden. " +
              R +
              "«Det e DET skjemaet! Winter elske det skjemaet. Han har det innramma heime. Trur æ. Æ har ikkje vore heime hos han. Ingen har det.»",
          },
          bruk: "Resten av bunken får ligge. IQ trenger kaffebrikker, og Winter trenger noe å klage på.",
        },
        {
          id: "krakken",
          navn: "Krakken",
          rect: { x: 67, y: 65, w: 10, h: 15 },
          smart: "se",
          se: "IQs krakk. Den har tre bein og en bok under det fjerde. Boka heter «Balanse for viderekomne». Den er ikke åpnet.",
        },
        {
          id: "hyllene",
          navn: "Hyllene",
          rect: { x: 40, y: 8, w: 16, h: 16 },
          smart: "bruk",
          se: [
            {
              hvis: "syltetoey_tilbake",
              tekst:
                "Syltetøyglass fulle av skruer og tannhjul, og ett med syltetøy som står på plass igjen. Lappen «MITT. – IQ» er snudd mot døra, så han ser den. Han ser den.",
            },
            {
              hvis: "tok_syltetoey",
              tekst:
                "Syltetøyglass fulle av skruer og tannhjul, og en rund, klissete ring der det ene glasset sto. Det glasset hadde navn på seg. Dette kommer til å bli lagt merke til.",
            },
            {
              tekst:
                "Syltetøyglass fulle av skruer, tannhjul og ett som faktisk inneholder syltetøy. Rødt syltetøy. Det glasset har en lapp: «MITT. – IQ»",
            },
          ],
          ta: {
            item: "syltetoey",
            tekst:
              "Du tar syltetøyglasset. Det er rødt og vått og har navn på seg. " +
              R +
              "«Æ sa ingenting. Æ så ingenting. Æ har aldri smakt det glasset. Det e løgn, men æ står for det.»",
          },
          bruker: [
            {
              item: "syltetoey",
              uten: "syltetoey_tilbake",
              flagg: "syltetoey_tilbake",
              forbruker: true,
              tekst:
                "Du setter glasset tilbake på hylla med lappen ut. Innenfra døra: «Takk.» IQ har tydeligvis et kamera på syltetøyet også.",
            },
          ],
          bruk: "Skruene og tannhjulene får stå. De har ikke navn på seg, men de ser ut som de hører til.",
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
                "«Postkassen er låst opp i henhold til nødparagraf 99. Resten er deres problem. Og hengslets. Hengslet er ikke mitt ansvar. Det står i paragraf 100.»",
            },
            {
              hvis: "winter_snakket",
              tekst:
                "«Dere igjen. Skjema 4112-B. Utfylt, signert av eier av funnsted, stemplet. Jeg gjentar ikke mer enn tre ganger, og dette var nummer to.»",
            },
            {
              tekst:
                "«Halt! Torget er for post i dag. Paragraf 12. Har dere et ærend, eller er dere bare her og drysser snø på arbeidsplassen min?»",
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
              neste: "ustemplet",
              flagg: "winter_snakket",
            },
            {
              tekst: "Signert skjema! Stempel det.",
              harItem: "skjema_signert",
              uten: "stempel_vaat",
              neste: "signert_tort",
              flagg: "winter_snakket",
            },
            {
              tekst: "Puta er våt! Stempel nå.",
              harItem: "skjema_signert",
              hvis: "stempel_vaat",
              uten: "skrin_aapent",
              neste: "skrin_laast",
            },
            {
              tekst: "Vær så god: signert skjema, våt pute og åpent skrin!",
              harItem: "skjema_signert",
              alle: [{ hvis: "stempel_vaat" }, { hvis: "skrin_aapent" }],
              uten: "postkasse_opplaast",
              neste: "stemplet",
              flagg: "postkasse_opplaast",
              tar: "skjema_signert",
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
            "«Garnkurven. Funnet på loftet til IQ, full av ull og klementinskall. Umerket løsøre. Den ligger i postkassen til jeg får Skjema 4112-B: utfylt, signert av eieren av funnstedet, og stemplet. Tre ting. Jeg har skrevet dem opp for dere.» Han gjør ikke det.",
          rampenissen:
            "«POSTKASSEN?! Han har lagt SENGA mi i postkassen! Og 'umerka'? Den lukte mæ! Lukt e merking!»",
          valg: [
            { tekst: "Hvor får vi tak i et sånt skjema?", neste: "skjema" },
            { tekst: "Hvem er eieren av funnstedet?", neste: "eier" },
            { tekst: "Og stempelet?", neste: "tort" },
            { tekst: "Takk, vi fikser det." },
          ],
        },
        skjema: {
          tekst:
            "«Skjema 4112-B deles ut i verkstedet til IQ. Han har en hel bunke. Han bruker dem som kaffebrikker. Jeg har sendt tre klager. Han bruker klagene som kaffebrikker også.»",
          rampenissen:
            "«Kaffebrikke! Det e jo helt genialt. Æ meine: fryktelig. Fryktelig genialt.»",
          valg: [
            { tekst: "Hvem skal signere?", neste: "eier" },
            { tekst: "Og stempelet?", neste: "tort" },
            { tekst: "Vi går opp og ser." },
          ],
        },
        eier: {
          tekst:
            "«Loftet tilhører IQ. Altså signerer IQ, i felt 3-A. Han åpner ikke døra for noen, men han signerer alt som kommer under den. Jeg har sett ham signere en pizzaeske.»",
          rampenissen:
            "«Under døra. Æ har prøvd å kom under den døra sjøl. Æ e for tjukk. Det e klementinan.»",
          valg: [
            { tekst: "Og stempelet?", neste: "tort" },
            { tekst: "Skjønner." },
          ],
        },
        tort: {
          tekst:
            "«Stempelputa er tørr. Tørr som julekake fra i fjor. Uten farge, intet stempel. Uten stempel, intet skjema. Uten skjema, ingen kurv. Det er ikke meg. Det er systemet. Jeg er bare systemets skjerf.»",
          rampenissen:
            "«Tørr pute? Da treng vi nåkka vått og rødt. Tynt. Og helst varmt, for alt her e frossent, inkludert Winter.»",
          valg: [
            { tekst: "Og selve stempelet?", neste: "skrin" },
            { tekst: "Skjønner. Vi finner noe rødt." },
          ],
        },
        skrin: {
          tekst:
            "«Stempelet ligger i skrinet på hylla. Låst, selvsagt. Skrinet åpnes med tømmetiden. Jeg husker ikke tømmetiden. Den står på skiltet. Jeg skriver skilt, jeg leser dem ikke.»",
          rampenissen:
            "«Tallhjul og et skilt. Det e nesten for lett. Æ sei nesten.»",
          valg: [{ tekst: "Vi leser skiltet." }],
        },
        skrin_laast: {
          tekst:
            "Winter kikker på puta. «Våt. Godkjent rød.» Så på skrinet. «Låst. Stempelet ligger der inne, og jeg åpner ikke skrin i arbeidstiden. Tømmetiden står på skiltet. Hjulene står på skrinet. Resten er hoderegning, og hoderegning er ikke min paragraf.»",
          rampenissen:
            "«Han veit koden sjøl og lar oss gjør jobben. Æ har respekt for det. Litt.»",
          valg: [{ tekst: "Vi åpner skrinet." }],
        },
        rampen: {
          tekst:
            "«Rampenissen. Han som sov på loftet til IQ i elleve måneder og dro uten å feie. Hvis dere har kontakt med ham: han skylder meg toogførti minutter arbeidstid og én blyant.»",
          rampenissen:
            "«Toogførti minutt? Æ brukte to tima på å stable klementinkassan hans! Og blyanten tygde æ på i søvne. Det telle ikkje.»",
          valg: [{ tekst: "Vi skal hilse." }],
        },
        skjerf: {
          tekst:
            "«Én runde for trekken fra tjernet. Én runde for luftingen fra klokketårnet. Og én runde fordi det er pent. En hals uten skjerf er et åpent sår.»",
          rampenissen: "«Æ har null runda. Æ e et åpent sår med lue.»",
          valg: [{ tekst: "Logisk." }],
        },
        ustemplet: {
          tekst:
            "Winter tar skjemaet med to fingertupper og holder det mot lyset. «Felt 3-A, eier av funnsted: tomt. Felt 7-C, stempel: tomt. Uten de to er dette en papirlapp egnet til papirbåter.» Han gir det tilbake. «Eieren signerer. Stempelet står der borte. Puta er tørr. Lykke til.»",
          rampenissen:
            "«Papirbåt! ... Nei. Fokus. Signatur OG stempel. Han e grundig, det ska han ha. Æ ska ikkje gi han nåkka anna.»",
          valg: [{ tekst: "Vi kommer tilbake." }],
        },
        signert_tort: {
          tekst:
            "Winter leser felt 3-A. «IQ. Brunsvidd hjørne. Han har signert pizzaesker penere.» Så løfter han stempelet, trykker det i puta og holder det opp. Ingenting. «Tørr. Jeg stempler ikke med luft. Luft er ikke sporbart.»",
          rampenissen: "«Luft e ikkje sporbart. Æ ska huske den.»",
          valg: [{ tekst: "Vi fikser puta." }],
        },
        stemplet: {
          tekst:
            "Winter leser felt 3-A, nikker, trykker stempelet i den røde puta og ... SMAKK. Han snuser på avtrykket. «Ureglementert bærlukt. Brunsvidd hjørne. Men til nød gyldig.» Han låser opp postkassen med en liten messingnøkkel og går tilbake til skriveplata.",
          rampenissen:
            "«HAHA! Han LUKTA på det! Fort, kurven, før han finn en paragraf til!»",
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
          tekst: [
            {
              hvis: "skjema_signert",
              tekst:
                "«Signert og levert! Hvis Winter spør om hjørnet, så var det sånn da jeg fikk det. Det er ikke sant, men si det.»",
            },
            {
              tekst:
                "«Hvem er det? Hvis det er Rampenissen, så er svaret fortsatt NEI, du får ikke låne sledetegningen, og du får ikke syltetøyet!»",
            },
          ],
          valg: [
            {
              tekst: "Det er oss! Vi hjelper Rampenissen med garnkurven.",
              neste: "kurv",
              flagg: "iq_snakket",
            },
            {
              tekst: "Winter vil ha signaturen din på et skjema.",
              hvis: "iq_snakket",
              uten: "skjema_signert",
              neste: "signer",
            },
            { tekst: "Hvorfor står det IKKE RØR på skiltet?", neste: "skilt" },
            { tekst: "Hva lager du der inne?", neste: "hemmelig" },
            { tekst: "Vi går igjen." },
          ],
        },
        kurv: {
          tekst:
            "«Kurven! Winter tok den. Han sa den var umerket løsøre. Jeg sa den var merket, den luktet jo Rampenissen. Han godtok ikke lukt som merking. Han godtok heller ikke klementinskall som adresse.»",
          rampenissen:
            "«Lukt E merking! Det står sikkert i en paragraf. En av de gode.»",
          valg: [
            { tekst: "Har du et skjema til Winter?", neste: "skjema" },
            { tekst: "Winter vil ha signaturen din.", neste: "signer" },
            { tekst: "Takk, IQ!" },
          ],
        },
        skjema: {
          tekst:
            "«Skjema 4112-B? Jeg har en bunke under lampa på sidebordet. Ta ett. Ta ti. Jeg bruker dem som kaffebrikker, de er akkurat passe tykke. Winters klager er litt for tynne.»",
          valg: [{ tekst: "Takk!" }],
        },
        signer: {
          tekst:
            "«Signere? Gjerne. Men jeg åpner ikke døra, det er trykk her inne. Skyv det under. Jeg signerer alt som kommer under døra. Det er sånn jeg fikk Rudolf.»",
          rampenissen:
            "«Han sei det som om det va en god ting. Rudolf åt sofaen hans.»",
          valg: [{ tekst: "Under døra. Skjønner." }],
        },
        skilt: {
          tekst:
            "«Fordi folk rører. Særlig én bestemt person med rød lue. Skiltet gjelder forresten også dere, men dere er sikkert flinkere. Dere har i hvert fall ikke klistremerker.»",
          rampenissen:
            "«Æ rørte ikkje. Æ kikka med fingran. Det e nåkka heilt anna. Det e vitenskap.»",
          valg: [{ tekst: "Vi skal ikke røre." }],
        },
        hemmelig: {
          tekst:
            "«Noe hemmelig. Så hemmelig at jeg ikke husker det selv akkurat nå. Det summer, i hvert fall. Det er et godt tegn. Som regel. Sist det summet sånn, fikk Nissemor ny kjøkkenvegg.»",
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
          "«Kurven min e borte fra loftet. Nån på torget veit sikkert nåkka. Han med skjerfet står og glor på postkassa som om han eie ho.»",
        R + "«SNAKK med Winter ved postkassa. Spør om garnkurven.»",
        R +
          "«Trykk på Winter og velg «Vi leter etter en garnkurv». Han elske å forklare. Han elske ingenting anna.»",
      ],
    },
    {
      id: "stempel",
      ferdig: "stempel_vaat",
      tips: [
        R +
          "«Stempelputa te Winter e tørr. Vi treng nåkka vått og rødt og tynt. Ikkje syltetøy, det e tjukt. Og varmt, for alt e frossent her.»",
        R +
          "«Bæran i boden e røde, men harde som stein. Nåkka varmt oppe hos IQ kan tine dem. Han har en kopp som ryk.»",
        R +
          "«Ta tyttebæran fra boden og kaffekoppen te IQ. Trykk på bæran i lomma, så på koppen. Hell saften på stempelputa ved postkassa.»",
      ],
    },
    {
      id: "signatur",
      ferdig: "skjema_signert",
      tips: [
        R +
          "«Winter vil ha skjema 4112-B, signert av han som eie loftet. Det e IQ. IQ har skjemaan sjøl, oppe i verkstedet, under lampa.»",
        R +
          "«IQ åpne ikkje døra. Men det e ei sprekk under den. Ka får du inn under ei dør? Nåkka flatt.»",
        R +
          "«Ta skjemaet fra sidebordet hos IQ og BRUK det på døra hans. Han signere alt som kjem under.»",
      ],
    },
    {
      id: "skrin",
      ferdig: "skrin_aapent",
      tips: [
        R +
          "«Stempelet ligg i skrinet på hylla, med fire tallhjul. Det står nåkka gravert på lokket. SE på det.»",
        R +
          "«Åpnes ved tømming. Når tømmes postkassa? Det står på skiltet på postkassa. SE på ho.»",
        R +
          "«Tømmes klokka 16.40. Still hjulan på 1, 6, 4 og 0. Winter later som han ikkje ser på.»",
      ],
    },
    {
      id: "skjema",
      ferdig: "postkasse_opplaast",
      tips: [
        R +
          "«Signert skjema, våt pute og åpent skrin. No mangle bare at Winter gjør jobben sin.»",
        R +
          "«Gi det signerte skjemaet te Winter, eller SNAKK med han og vis det fram.»",
        R +
          "«Bruk «Skjema 4112-B, signert» på Winter når stempelputa e våt og skrinet e åpent. Han stemple, og han låse opp.»",
      ],
    },
    {
      id: "hengsel",
      ferdig: "hengsel_tint",
      tips: [
        R +
          "«Låsen e åpen, men luka sitt fast. Frossen. Ka e det som smelte is? Ikkje paragrafa.»",
        R + "«Nåkka varmt mot hengslet. Har vi nåkka varmt i lomma ennå?»",
        R + "«Bruk den varme kaffekoppen på postkassa.»",
      ],
    },
    {
      id: "luke",
      ferdig: "k1_ferdig",
      tips: [
        R +
          "«Postkortet på innsida av luka e i ni bita. Winter vil ha bildet heilt før luka går opp. Sjølsagt vil han det.»",
        R +
          "«Trykk på en bit ved sida av det tomme feltet, så glir han dit. Få hjørnan på plass først, så resten.»",
        R +
          "«Øverste rad først: trapp, hus, urtårn. Så midten. Dem to siste bitan nederst går rundt det tomme feltet te dem sitt. Ta deg tid, æ har heile dagen. Æ har ikkje nåkka anna.»",
      ],
    },
  ],
};
