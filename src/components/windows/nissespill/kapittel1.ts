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
  teaser: "Rampenissen har mistet senga si. Og noe som ringer.",
  start: "torget",
  slutt: "k1_ferdig",
  intro: [
    R +
      "«Psst. Dokker trur kanskje æ bare sitt i hylla og glor? Feil. IQ har kobla kameraan i Snøfall te skjermen dokkers, og no e DOKKER Floke: ull-ugla mi med messingbrilla. Dokker ser det ho ser, og folk i Snøfall snakke te ho som om det va dokker. Æ sitt her i hylla og hviske. Ingen der borte hør mæ. Heldigvis.»",
    R +
      "«Saka e sånn: Æ sov i ei garnkurv på loftet te IQ heile året. I kurven ligg lykkebjella mi. Den har hengt på sleden hver julaften sia æ va liten, for lykke. Ikkje for retning, Winter har tall te sånt. For LYKKE. No e kurven BORTE. Æ har mistanka. Han har skjerf.»",
    R +
      "«Dokker kan sånt her. SE, BRUK, SNAKK, lomma nederst. Står dokker fast, trykk på mæ, RAMPENISSEN-knappen nederst, så hviske æ tips. Æ hviske høgt.»",
  ],
  utro:
    R +
    "«Dokker klarte det! Lykkebjella e trygg, og Floke har dytta kurven på plass på loftet igjen. Winter fikk skjemaet sitt, IQ fikk glasset sitt, og æ fikk senga mi. Alle vant. Neste gang treng æ hjelp med nåkka ... kaldere. Æ sei ikkje meir. Over og ut!»",
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
    bolle: {
      id: "bolle",
      navn: "Hjerteruds kanelbolle",
      ikon: "cake",
      se:
        "En kanelbolle, fortsatt varm, med perlesukker på toppen. " +
        R +
        "«Den e te å spis. Ikkje alt e en gåte. Men ikkje spis den FØR dokker e ferdig, da får æ ikkje smak.»",
    },
    syltetoey: {
      id: "syltetoey",
      navn: "IQs syltetøyglass",
      ikon: "potion",
      se: "Et glass rødt syltetøy med lappen «MITT. – IQ». Under lappen står det med mindre skrift: «JA, OGSÅ DU, RAMPENISSEN». Rødt, vått og dessverre eid av noen.",
    },
  },
  fjaerBelonning:
    R +
    "«Seks uglefjær! Floke mista dem ikkje. Ho legg dem igjen med vilje. Det e sånn ho skriv navnet sitt.»",
  puslespill: {
    skrin: {
      type: "laas",
      tittel: "Stempelskrinet",
      flagg: "skrin_aapent",
      tekst:
        "1-6-4-0. Det siste hjulet klikker, og lokket spretter opp. Inni ligger stempelet «SNØFALL POSTVESEN» på rød fløyel, som en liten konge. Winter ser opp: «Tømmetiden. Selvsagt. Eg visste det.» Han visste det ikke.",
      hjul: [
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      ],
      svar: ["1", "6", "4", "0"],
    },
    taarnuret: {
      type: "laas",
      tittel: "Tårnuret",
      flagg: "klokka_stilt",
      tekst:
        "16.40. Urverket tar et dypt pust, tannhjulene griper, og de fire klokkene slår så hele rommet synger. Nede på torget ser Winter opp fra skriveplata, nikker én gang og noterer: «Klokka stemmer.» " +
        R +
        "«Det e ikkje 16.40. Det e det aldri. Men no e det tømmetid når Winter sei det e tømmetid, og det e det viktigaste for han.»",
      hjul: [
        Array.from({ length: 24 }, (_, i) => String(i)),
        Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")),
      ],
      svar: ["16", "40"],
    },
    frostluke: {
      type: "skyv",
      tittel: "Postkortet på luka",
      flagg: "k1_ferdig",
      tekst:
        "Siste bit glir på plass, og torget er helt igjen. KLIKK. Luka svinger opp. Inni ligger garnkurven, og oppi den: lykkebjella. Den klinger ikke. Den gnistrer. Kurven er full av ull, men halve det røde nøstet er borte. Tråden er røket, og enden er stiv av rim. " +
        R +
        "«BJELLA MI! Og kurven lukte fortsatt mæ. Det e et kompliment. Men kor e resten av det røde nøstet? Det va det finaste æ hadde. Æ leite seinar.»",
      bilde: "spill/piksel/torget.png",
      trekk: 14,
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
        "«Tyttebærkaffe! Det der har æ faktisk prøvd. Æ sov ikkje på tre daga. Det va ikkje kaffen, det va bæran.»",
    },
  ],
  scener: [
    {
      id: "torget",
      navn: "Torget i Snøfall",
      bilde: "spill/torget.jpg",
      utganger: [
        {
          til: "verksted",
          navn: "Opp trappa til verkstedet",
          rect: { x: 7, y: 6, w: 12, h: 26 },
        },
        {
          til: "kafeen",
          navn: "Inn på kaféen",
          rect: { x: 42, y: 26, w: 10, h: 20 },
        },
        {
          til: "pakkesentralen",
          navn: "Inn i pakkesentralen",
          rect: { x: 67, y: 8, w: 14, h: 32 },
        },
        {
          til: "klokketaarnet",
          navn: "Opp i klokketårnet",
          rect: { x: 53, y: 44, w: 12, h: 18 },
        },
        {
          til: "julebodene",
          navn: "Bort til julebodene",
          rect: { x: 43, y: 47, w: 9, h: 14 },
        },
      ],
      // In the snow in front of the clock tower, between the stalls and the mailbox
      fjaer: { x: 49, y: 86, w: 4, h: 6 },
      hotspots: [
        {
          id: "trappa",
          navn: "Trappa",
          prat: "Du sier «unnskyld» til trappa før du går opp. Det tredje trinnet knirker likevel. Det er ikke personlig. Det knirker for alle.",
          rect: { x: 0, y: 34, w: 19, h: 58 },
          smart: "bruk",
          gaaTil: "verksted",
          se: "Ei bratt tretrapp opp til loftet. Det tredje trinnet knirker i D-dur. IQ kaller det en alarm. Rampenissen kaller det trinn nummer tre, og hopper over det.",
        },
        {
          id: "bodene",
          navn: "Julebodene",
          prat: "Du roper «hei» bort til bodene. Begge bodnissene vinker. Så ser de at den andre vinket, og slutter samtidig.",
          rect: { x: 20, y: 40, w: 22, h: 42 },
          smart: "bruk",
          se: "To små boder med lanterner. Den ene selger kurver med frosne bær. Den andre selger også frosne bær, under et blankt skilt der det sto «BEDRE» i går. Konkurransen er hard og helt lik.",
          ta: {
            item: "tyttebaer",
            tekst:
              "Du tar ei neve frosne tyttebær fra kurven. Ingen ser det. Bortsett fra Winter, som noterer: «Bær. Ei neve. Kl. 16.40.»",
          },
          bruk: "Du har bær nok. Tar du mer, blir det syltetøy av det, sier Hjerterud, og da må du stå og røre til påske.",
        },
        {
          id: "urtaarnet",
          navn: "Urtårnet",
          rect: { x: 52, y: 0, w: 14, h: 44 },
          smart: "se",
          gaaTil: "klokketaarnet",
          prat: "Du roper «hva er klokka?» opp til tårnet. Klokka slår ett slag, midt mellom to timer, som for å si at det er dens sak.",
          se: "Klokkeskiva har fire visere: timer, minutter, sekunder og «tid til neste julekake». Den fjerde er bøyd fordi noen har prøvd å dytte den framover med en kjepp. Floke kan fly opp dit. Hun er den eneste på torget som kan.",
        },
        {
          id: "husene",
          navn: "Husene",
          prat: "Du uler mot husene. Et vindu går opp, en nisse ser ut, ser ei ugle og lukker igjen. Rolig. Ugler på torget er ikke nyheter i Snøfall.",
          rect: { x: 24, y: 14, w: 18, h: 26 },
          smart: "se",
          gaaTil: "kafeen",
          se: "Fargerike tømmerhus med snø på takene. I et vindu står en nisse og vinker. Nei, han pusser vinduet. Nei, han vinker. Han gjør begge deler. Han er effektiv. Det huset som lukter kanel, er Hjerteruds kafé.",
        },
        {
          id: "postkassen",
          navn: "Postkassen",
          rect: { x: 66, y: 42, w: 16, h: 36 },
          smart: "bruk",
          prat:
            "Du hvisker «hallo?» inn i brevsprekken. Det lukter ull og klementin tilbake. Ingen svarer. " +
            R +
            "«Det e SENGA mi der inne. Senger svare ikkje. Dem lytte.»",
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
                "Du drar i luka. Den rikker seg ikke. Hengslet er frosset fast, og Floke har ikke armer til å dra med. Hun har prøvd. Det er pinlig for alle.",
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
                "Du holder den varme koppen mot hengslet. Det knaker, og luka glir opp en tomme. Innenfor sitter et postkort av torget, skjøvet i ni biter av frosten. Winter: «Frostlås. Paragraf 101. Luka åpnes når bildet er helt.» " +
                R +
                "«Han har PARAGRAF på det! Skyv bitan på plass.»",
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
              "Du dytter et bær inn i brevsprekken. Winter: «Det der er ikkje et brev. Det er ikkje engang et postkort.»",
            skjema:
              "Du dytter skjemaet mot låsen. Ingenting. Winter: «Skjemaet leveres til meg, ikkje til møbler.»",
            skjema_signert:
              "Du vifter med skjemaet foran låsen. Låsen er ikke imponert. Winter: «Eg er låsen. Snakk med meg.»",
            syltetoey:
              "Du holder syltetøyglasset mot postkassen. Winter: «Eg skal late som eg ikkje så det.» Han så det.",
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
          prat: "Du spør puta om den er tørst. Den svarer ikke, men den har aldri sett tørrere ut.",
          rect: { x: 66, y: 78, w: 6, h: 10 },
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
              "Du heller en dråpe kaffe på puta. Brun. Winter: «Brunt er ikkje en godkjent stempelfarge. Brunt er en godkjent kaffefarge. Det er to forskjellige skjemaer.»",
            syltetoey:
              "Du smører en klatt syltetøy på puta. Rødt! Vått! Winter trykker stempelet i det. SMATT. Det sitter fast. «Klissete er ikkje en farge.» Puta er like tørr under klatten. " +
              R +
              "«Nesten! Det må vær tynt og rødt, ikkje tjukt og rødt.»",
          },
        },
        {
          id: "skrinet",
          navn: "Stempelskrinet",
          prat: "Du hvisker «sesam» til skrinet. Winter, uten å se opp: «Det er fire tall. Ikkje et ord. Ord er for brev.»",
          rect: { x: 72, y: 76, w: 7, h: 12 },
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
              "«Ikkje på skrinet! Saften ska på PUTA. Skrinet ska bare åpnes.»",
          },
        },
        {
          id: "winter",
          navn: "Winter",
          rect: { x: 82, y: 22, w: 17, h: 76 },
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
                "Winter leser felt 3-A, nikker, løfter stempelet ut av skrinet, trykker det i puta og ... SMAKK. Han snuser på avtrykket. «Bærlukt. Brunsvidd hjørne. Men til nød gyldig.» Han låser opp postkassen. " +
                R +
                "«Han LUKTA på det! Fort, før han finn en paragraf til!»",
            },
            {
              item: "skjema_signert",
              hvis: "stempel_vaat",
              uten: "skrin_aapent",
              tekst:
                "Winter leser felt 3-A og nikker. Så ser han på den våte puta, og så på skrinet. «Puta er godkjent. Stempelet ligger i skrinet. Skrinet er låst. Eg åpner ikkje skrin i arbeidstiden.» Han gir skjemaet tilbake.",
            },
          ],
          feil: {
            bolle:
              "Winter ser på bollen i fire sekunder. «Eg spiser ikkje i arbeidstiden.» Fire sekunder til. «Legg den på hylla. Til dokumentasjon.» Du beholder den. Han noterer det.",
            skjema:
              "Winter holder skjemaet mot lyset. «Felt 3-A, eier av funnsted: tomt. Felt 7-C, stempel: tomt. To mangler. Eg teller.» Han gir det tilbake.",
            skjema_signert:
              "Winter leser felt 3-A. «IQ. Brunsvidd, men gyldig.» Så felt 7-C. «Tomt. Et halvt skjema er et helt nei.» Han gir det tilbake og peker på den tørre stempelputa uten å se på den.",
            tyttebaer:
              "Winter: «Eg tar ikkje imot bestikkelser. Særlig ikkje frosne. Frosne bestikkelser holder lenger, og det gjør det verre.»",
            kaffekopp:
              "Winter: «Eg drikker ikkje i arbeidstiden. Og slett ikkje av en kopp som kaller noen eksplosiv.»",
            baersaft:
              "Winter: «Hva er DET? Nei. Ikkje svar. Eg vil ikkje ha det i protokollen.»",
            syltetoey:
              "Winter leser lappen. «MITT. – IQ.» Han ser på deg. «Dette er det best merkede løsøret i hele Snøfall. Lever det tilbake før eg må lage et skjema for det.»",
          },
        },
        {
          id: "himmelen",
          navn: "Himmelen",
          rect: { x: 22, y: 0, w: 30, h: 14 },
          smart: "se",
          se: "Svart himmel med stjerner tett i tett, og røyk fra pipene som står rett opp. Ingen vind i kveld. Snøen faller som om den har god tid.",
          prat: "Du uler mot stjernene. Én av dem blinker. Det kan være et fly. Det kan være IQ som tester noe. Det er som regel IQ.",
        },
        {
          id: "snoen",
          navn: "Snøen på torget",
          rect: { x: 24, y: 82, w: 24, h: 18 },
          smart: "se",
          se: "Snøen er tråkket til en sti mellom bodene og postkassen. Ett spor går fram og tilbake så mange ganger at det har blitt en grøft. Winters. Han går samme vei hver dag, på minuttet. Snøen har gitt opp å dekke den.",
          bruk: "Floke tegner en sirkel i snøen med foten. Så en til. Winter ser bort og noterer: «Ugle. Tegner. Sirkler. Ukjent formål.»",
        },
      ],
    },
    {
      id: "verksted",
      navn: "IQs verksted",
      bilde: "spill/iq-verksted.jpg",
      utganger: [{ til: "torget", navn: "Ned trappa til torget" }],
      // On the floor between the coffee cup and the stool
      fjaer: { x: 57, y: 88, w: 4, h: 6 },
      hotspots: [
        {
          id: "sikringsskapet",
          navn: "Sikringsskapet",
          rect: { x: 0, y: 27, w: 14, h: 36 },
          smart: "se",
          se: "Et skap fullt av målere og visere. Alle står pent på midten, som om ingenting noen gang har skjedd her. Noen har limt på en lapp: «ALDRI MER KAFFETRAKTER». Lappen er svidd i kanten.",
          prat: "Du spør skapet om det er trygt. Det svarer med et lite klikk. Det er enten ja eller en sikring. Du går ikke nærmere for å finne ut.",
          bruk: "Du åpner luka og lukker den igjen. Fort. Inni sto det tre sikringer og en liten lapp til: «IKKE DEN RØDE».",
        },
        {
          id: "tavla",
          navn: "Tavla",
          rect: { x: 14, y: 30, w: 13, h: 30 },
          smart: "se",
          se: "Formler, piler og en tegning av noe rundt. Nederst står det «IKKE VISK UT», og rett under har noen visket ut noe. Det som er visket ut, var større enn det som står igjen. Oppe i hjørnet henger en lapp med frostruner, IQs håndskrift: ᚱ:SE OPP",
          prat: "Du sier «hallo» til tavla. Krittstøvet svarer med å drysse. Det er hele svaret, og det er et ærlig et.",
        },
        {
          id: "oscilloskopet",
          navn: "Oscilloskopet",
          rect: { x: 21, y: 57, w: 14, h: 15 },
          smart: "se",
          se: "Den grønne streken tegner en kurve som ser nøyaktig ut som profilen til en gretten grevling. Hver gang noen tråkker på gulvet, hopper halen.",
          prat: "Du snakker til grevlingen på skjermen. Halen hopper når du snakker. Den hopper mer når Rampenissen snakker. Den har god smak.",
          bruk: "Du vrir på en knott. Grevlingen blir et pinnsvin. Du vrir tilbake. Grevlingen ser ikke fornøyd ut, men det gjorde den ikke før heller.",
        },
        {
          id: "radioroerene",
          navn: "Radiorørene",
          rect: { x: 10, y: 65, w: 11, h: 18 },
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
          rect: { x: 51, y: 21, w: 13, h: 39 },
          smart: "se",
          se: "Rim på rutene og snø utenfor. På innsiden har noen tegnet et smilefjes i duggen. Med nesa, ser det ut som. Nesa var kald etterpå, ser det også ut som.",
          prat:
            "Du puster på ruta og får et nytt duggfelt. " +
            R +
            "«Tegn ei ugle! Nei, tegn mæ! Nei, ugle. Æ e ikkje forfengelig. Tegn mæ.»",
        },
        {
          id: "skiltet",
          navn: "Skiltet",
          rect: { x: 67, y: 20, w: 12, h: 10 },
          smart: "se",
          se: "Et blankt treskilt. Det sto «IKKE RØR (GJELDER OGSÅ RAMPENISSEN)» på det en gang. Bokstavene er gnidd bort, akkurat i fingerhøyde for en nisse på tretti centimeter.",
        },
        {
          id: "doera",
          navn: "IQs dør",
          rect: { x: 66, y: 32, w: 14, h: 40 },
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
                "Du skyver skjemaet under døra. Stille. Så: en penn som skraper, et lite PANG, og skjemaet kommer ut med signatur i felt 3-A og et brunsvidd hjørne. IQ: «Ikke spør om hjørnet.» " +
                R +
                "«Han signere alt som kjem under døra. Det e sånn han fikk en rein.»",
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
            bolle:
              "Bollen passer ikke under døra. IQ, innenfra: «Jeg lukter kanel. Det er grusomt å gjøre mot en mann bak en dør.» Han åpner likevel ikke.",
          },
        },
        {
          id: "kaffekoppen",
          navn: "Kaffekoppen",
          rect: { x: 47, y: 70, w: 7, h: 22 },
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
          rect: { x: 15, y: 85, w: 30, h: 15 },
          smart: "se",
          se: "Arket ser blankt ut. Med nebbet helt inntil ser du svake blyantstreker: en slede med to svære trakter bak på meiene. Noen har skrevet «DREVET AV PEPPERKAKEGASS» med blyant, og Julius har satt et stort spørsmålstegn ved siden av med rød fargestift. IQ har satt et utropstegn ved spørsmålstegnet. Diskusjonen pågår.",
        },
        {
          id: "sidebordet",
          navn: "Sidebordet",
          rect: { x: 85, y: 64, w: 15, h: 30 },
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
              "«Det e DET skjemaet! Winter elske det skjemaet. Han har det innramma heime. Trur æ. Æ har ikkje vært heime hos han. Ingen har det.»",
          },
          bruk: "Resten av bunken får ligge. IQ trenger kaffebrikker, og Winter trenger noe å klage på.",
        },
        {
          id: "krakken",
          navn: "Krakken",
          rect: { x: 66, y: 72, w: 8, h: 27 },
          smart: "se",
          se: "IQs krakk. Fire bein, alle litt ulike lange. IQ har kjøpt boka «Balanse for viderekomne» til den. Boka er ikke åpnet.",
          prat: "Du spør krakken hvordan det går med balansen. Den vipper. Det er svaret, og det har vært svaret lenge.",
        },
        {
          id: "hyllene",
          navn: "Hyllene",
          rect: { x: 27, y: 33, w: 23, h: 15 },
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
        {
          id: "lyspaera",
          navn: "Lyspæra",
          rect: { x: 48, y: 0, w: 4, h: 23 },
          smart: "se",
          se: "Én naken lyspære i en ledning fra bjelken. Den har hengt der siden sikring nummer én. Den blunker når IQ tenker. Akkurat nå blunker den fort.",
          bruk: "Du dytter pæra med vingen. Skyggene i verkstedet svinger fram og tilbake, og et øyeblikk ser alt dobbelt så rotete ut. Det er ikke mulig. Det skjer likevel.",
        },
        {
          id: "radioen",
          navn: "Den gamle radioen",
          rect: { x: 39, y: 21, w: 9, h: 11 },
          smart: "se",
          se: "En gammel radio av tre øverst på hylla, med stoff foran høyttaleren og ett eneste ratt. IQs første mottaker, bygd for å høre Julius lese julefortellinger fra kontoret. Den tar fortsatt bare én kanal. Det er den kanalen.",
          prat:
            "Du uler mot radioen. Den knitrer tilbake, og i knitringen er det nesten en stemme. " +
            R +
            "«Det e Julius fra gamle daga. Han les ennå. Radioen glømte å slutte.»",
        },
        {
          id: "skrivebordslampa",
          navn: "Skrivebordslampa",
          rect: { x: 87, y: 45, w: 9, h: 19 },
          smart: "se",
          se: "Ei bøyelig messinglampe over sidebordet. Den er bøyd i tre vinkler for å lyse under, over og bak noe som ikke står der lenger. IQ flyttet det. Lampa fikk ikke beskjed.",
        },
        {
          id: "tengene",
          navn: "Tengene",
          rect: { x: 0, y: 84, w: 15, h: 16 },
          smart: "se",
          se: "Tenger, skrutrekkere og en loddebolt, spredt utover benkekanten i det IQ kaller «systemet». Systemet er at den han trenger, alltid ligger nederst.",
          bruk: "Du dytter en tang. Den drar med seg en skrutrekker, som drar med seg loddebolten, som stopper rett før kanten. Du står helt stille. Systemet holdt.",
        },
        {
          id: "oppfinnelsen",
          navn: "Den lille oppfinnelsen",
          rect: { x: 38, y: 51, w: 11, h: 16 },
          smart: "se",
          se: "Noe lite av messing og glass som gløder på benken. Det har en spole, en knapp og en lapp: «VIRKER. IKKE SPØR HVORDAN.» IQ bygde den for å holde kaffen varm. Den holder rommet varmt. Han tar det som en bonus.",
          bruk: "Du trykker på knappen. Gløden blir sterkere, så svakere, så normal. Innenfra døra: «Hørte jeg knappen?» Du rører den ikke mer.",
          prat:
            R +
            "«Æ snakka te den i fjor. Den svarte ikkje, men kaffen blei kald. Æ trur den blei fornærma.»",
        },
      ],
    },
    {
      id: "kafeen",
      navn: "Sukkerstua",
      bilde: "spill/kafe.jpg",
      utganger: [{ til: "torget", navn: "Ut på torget" }],
      // In the bun basket between the shelves and the window
      fjaer: { x: 67, y: 48, w: 4, h: 6 },
      hotspots: [
        {
          id: "ovnen",
          navn: "Steinovnen",
          rect: { x: 0, y: 16, w: 32, h: 46 },
          smart: "se",
          se:
            "En svær, buet ovn av leire og stein med bjørkeved som gløder inni. Det er det varmeste stedet i Snøfall, og om vinteren sover katten, Pil og tre hansker oppå den. " +
            R +
            "«Sjå på den ovnen der! Den e så varm og god at til og med Winter hadde tatt av sæ skjerfet om han stakk nesa inn.»",
          prat: "Du sier «hei» inn i ovnsluka. Noe oppå ovnen svarer med å strekke seg. Det er katten. Eller Pil. Begge svarer sånn.",
          bruk:
            "Du nærmer deg luka. Det er varmt. Veldig varmt. Fjærene dine krøller seg. " +
            R +
            "«Ikkje inn i ovnen! Æ har prøvd å varm føttan der. Æ hadde ikkje sokka etterpå. Æ hadde knapt føtter.»",
          feil: {
            tyttebaer:
              "Du holder bærene mot ovnen. De tiner, og saften drypper rett ned på gulvet. Hjerterud: «Ikke på gulvet, Floke! Saft må i en KOPP. Noe varmt, i en kopp.» Du har bær igjen. Færre, men nok.",
          },
        },
        {
          id: "veden",
          navn: "Veden under ovnen",
          rect: { x: 4, y: 70, w: 22, h: 30 },
          smart: "se",
          se: "Bjørkeved stablet i buen under ovnen, med barken ut, så tørr at den synger når den brenner. Hjerterud stabler selv. Hun har sendt hjem to nisser som stablet feil vei. De kom tilbake. Alle kommer tilbake.",
          bruk: "Du drar i en vedkubbe. Stabelen svaier. Du dytter den tilbake. Hjerterud har allerede snudd seg. Hun snur seg alltid i tide.",
        },
        {
          id: "hyllene",
          navn: "Spiskammerhyllene",
          rect: { x: 34, y: 4, w: 32, h: 42 },
          smart: "se",
          se: "Hyller fra gulv til tak med leirkrukker, kobberkjeler og kurver med boller. Den øverste kjelen har en bulk. Den er Julius'. Han insisterer på den. Han sier en bulk er et minne. Hjerterud sier det er en bulk.",
          prat: "Du uler opp mot kobberkjelene. De synger tilbake, litt falskt. Hjerterud: «Ikke oppmuntre dem, Floke.»",
          bruk: "Du strekker deg etter en kjele. Hjerterud: «Nei. Jeg har sett ugler med kobberkjeler. Jeg har sett gulvet etterpå.»",
        },
        {
          id: "kakaokanna",
          navn: "Kakaokanna",
          rect: { x: 50, y: 57, w: 8, h: 12 },
          smart: "se",
          se: "En brun leirkanne som damper. Innholdet er varmt, brunt og tykt nok til å stå på egne bein. Hjerterud kaller det kakao. Winter kaller det «ikkje tillatt på torget, paragraf 14».",
          prat: "Du hvisker «snart?» til kakaokanna. Den damper tilbake. Hjerterud: «Når du har spist. Kakao på tom mage er bare brunt.»",
          bruk:
            "Du strekker deg mot kanna. Hjerterud setter den lenger inn. «Varm! Og kakao på en ugle vasker seg ikke ut. Jeg vet det. Spør ikke hvordan jeg vet det.» " +
            R +
            "«Det va mæ. Det e bestandig mæ.»",
          feil: {
            tyttebaer:
              "Du holder bærene over kanna. Hjerterud griper dem i lufta. «Ikke i kakaoen! Kakao med bær er suppe, og suppe er en annen kanne.» Hun gir dem tilbake. Fortsatt frosne.",
            kaffekopp:
              "Du holder IQs kopp fram. Hjerterud ser ned i den. «Skruer. Og en rosin. Nei, Floke, jeg fyller ikke kakao på det der. Det ville vært stygt mot kakaoen.»",
          },
        },
        {
          id: "melkrukkene",
          navn: "Melkrukkene",
          rect: { x: 32, y: 49, w: 18, h: 17 },
          smart: "se",
          se:
            "Store glasskrukker med mel, sukker og kardemomme. Det er et lite fotavtrykk i melet ved siden av. Det har tre tær og hører til en ugle. " +
            R +
            "«Krukke på krukke med hvetemel og kardemomme. Om Lille-Pjokk velte ei sånn, kjem han te å sjå ut som en snøball resten av desember!»",
          bruk: "Du dytter nebbet i ei krukke. Hvitt nebb. Hjerterud ler så krukkene klirrer. «Nå ser du ut som en snøugle!»",
        },
        {
          id: "arbeidsbordet",
          navn: "Arbeidsbordet",
          rect: { x: 25, y: 67, w: 48, h: 33 },
          smart: "se",
          se: "Et tungt, skuret trebord med spor etter kjevler og elting, mel over alt, en kjevle og en stabel knekkebrød. Det lå fire boller her i stad. Nå ligger det tre. Ingen sier noe.",
          prat: "Du sier «hallo» til knekkebrødet. Det sier ingenting, men det knaser litt når du lener deg på det, og det er et slags svar.",
          bruk: "Du triller kjevla med nebbet. Den ruller over bordkanten. Hjerterud fanger den uten å se. «Spør, så får du. Det er regelen her. Det er den eneste regelen her.»",
        },
        {
          id: "sirupen",
          navn: "Krukka med nissesirup",
          rect: { x: 74, y: 68, w: 10, h: 17 },
          smart: "se",
          se:
            "Ei lita, rav-glasert krukke med gyllen sirup og ei treøse i. Det renner en tråd ned på bordet. Den har rent der siden i fjor. " +
            R +
            "«Aha! Ekte, klissete nissesirup! Én dråpe av det der på et tørt knekkebrød, så kan du lokke med deg sjølvaste Rudolf heilt te Fauske!»",
          bruk: "Du stikker nebbet i sirupen. Det sitter fast. Det sitter fast lenge. Hjerterud løsner deg med tresleiva. «Sirup er for knekkebrød, vennen. Ikke for ugler.»",
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 74, y: 20, w: 18, h: 35 },
          smart: "se",
          se: "Rim på rutene og blått vintermørke utenfor. I karmen brenner lysene. Hjerterud tenner dem tidlig.",
          prat: "Du banker på ruta. Utenfor ser Winter opp fra postkassen, finner deg i vinduet og noterer. Hjerterud, uten å snu seg: «La ham. Han har så lite.»",
        },
        {
          id: "kafekroken",
          navn: "Kafékroken",
          rect: { x: 76, y: 56, w: 10, h: 12 },
          smart: "se",
          se: "Et lite bord under vinduet med kubbelys og et fat boller. På det ligger en lapp: «Reservert Julius». Lappen er fra forrige jul. Hjerterud tar den ikke bort. Han kommer kanskje.",
          bruk: "Du blåser på det ene lyset. Det blafrer og blir stående. Hjerteruds lys slukker ikke. Det har de aldri gjort.",
        },
        {
          id: "hjerterud",
          figur: "hjerterud",
          navn: "Hjerterud",
          rect: { x: 86, y: 58, w: 13, h: 40 },
          smart: "snakk",
          snakk: "hjerterud",
          se: "Hjerterud i lenestolen i kafékroken med en kurv nystekte boller på fanget. Kinnene er røde av ovnen, det er mel på nesa, og forkleet har mer mel enn stoff. Hun smiler før hun ser hvem det er. Hun smiler alltid før.",
          bruk: "Du prikker Hjerterud på armen. Hun ser ned. «Floke! Har du spist? Du har ikke spist. Ugler spiser ikke nok.» Hun legger en bolle på bordet. Du har ikke spurt. Det trengs ikke.",
          feil: {
            bolle:
              "Hjerterud dytter bollen tilbake. «Nei, nei, den er DIN. Spis. Har du spist? Du har ikke spist.»",
            syltetoey:
              "Hjerterud leser lappen. «MITT. – IQ.» Hun ler. «Han skrev det samme på en stol en gang. Stolen står her ennå. Sett glasset tilbake før han merker det, vennen.»",
            skjema:
              "Hjerterud holder skjemaet med to fingre. «4112-B. Winter. Jeg skriver ikke under på noe jeg ikke har bakt.» Hun gir det tilbake med et melavtrykk i hjørnet.",
          },
        },
      ],
    },
    {
      id: "pakkesentralen",
      navn: "Winters pakkesentral",
      bilde: "spill/pakkesentralen.jpg",
      utganger: [{ til: "torget", navn: "Ut på torget" }],
      // On the floor between the machine and the desk
      fjaer: { x: 65, y: 90, w: 4, h: 6 },
      hotspots: [
        {
          id: "skjemahyllene",
          navn: "Skjemahyllene",
          rect: { x: 0, y: 0, w: 29, h: 58 },
          smart: "se",
          se: "Hyller fra gulv til tak med skjemaer i bunker, alle nøyaktig like høye. Alle bortsett fra én. Plassen for 4112-B er tom. En lapp: «Utlånt til IQ. Brukes som kaffebrikker. Klage sendt. Klage brukt som kaffebrikke. Ny klage sendt.»",
          bruk: "Du drar forsiktig i et skjema. Hele hylla ser på deg. Du legger det tilbake på millimeteren. Det er fortsatt skjevt. Det kommer Winter til å merke.",
          prat: "Du spør hyllene om de har et 4112-B til overs. Lappen svarer for dem: IQ har alle. IQ har alltid alle.",
          feil: {
            skjema:
              "Du prøver å legge skjemaet tilbake på plassen sin. Nei. Det er DITT skjema nå. Winter vil ha det utfylt, ikke lagt bort.",
          },
        },
        {
          id: "samlebaandet",
          navn: "Samlebåndet",
          rect: { x: 0, y: 60, w: 44, h: 40 },
          smart: "se",
          se: "Et samlebånd av tre og messing som går i en stor sløyfe gjennom hallen. Pakkene reiser inn i maskinen, kommer ut igjen og reiser inn på nytt. Noen av dem har reist siden i fjor. De ser ikke ut til å ha noe imot det.",
          prat: "Du sier «stopp» til båndet. Det ruller videre. Du sier «vær så snill». Det ruller videre, litt saktere. Det var høflighet, ikke lydighet.",
          bruk: "Du hopper opp på båndet. Det ruller deg sakte mot maskinen. Du hopper av igjen rett før trakta. Hjertet dunker. Det var det morsomste du har gjort i dag.",
        },
        {
          id: "pakkene",
          navn: "Pakkene",
          rect: { x: 14, y: 64, w: 14, h: 16 },
          smart: "se",
          se: "Brune pakker med hyssing. Den øverste er adressert «Rampenissen, hylla i stua, Landås». Avsender: «H.» Den lukter knekkebrød. Under den ligger en pakke merket «IQ – IKKE RIST». Den tikker ikke. Den summer.",
          prat: "Du hvisker til pakken som summer. Summingen går opp en tone. Du går ett skritt tilbake. Den går ned igjen. Dere har en avtale.",
          bruk: "Du rister forsiktig på pakken til Rampenissen. Det knaser. Knekkebrød. Du rister ikke på den andre.",
          feil: {
            bolle:
              "Du legger bollen oppå pakken til Rampenissen. Det ser riktig ut. Så tar du den tilbake. Hjerterud sa den var din.",
          },
        },
        {
          id: "maskinen",
          navn: "Maskinen",
          rect: { x: 38, y: 0, w: 28, h: 86 },
          smart: "se",
          se: "Winters stolthet: en messingmaskin med tre trakter, fire hjul og en liten luke merket «VENTER». Den ordner pakker etter vekt, adresse, lukt og paragraf. Mest paragraf. Alt som er i tvil, går i «VENTER». «VENTER» er full.",
          bruk:
            "Du drar i spaken. Maskinen tenker seg om, sukker med damp og slipper en pakke ned i «VENTER». Utenfra, gjennom vinduet, roper Winter: «Eg hørte det!» " +
            R +
            "«Han hør alt. Han hørte mæ spis en klementin gjennom to vegga i 2022.»",
          prat: "Du uler lavt mot maskinen. Den summer tilbake i samme tone. Dere har en forståelse nå.",
          feil: {
            tyttebaer:
              "Du slipper et bær i trakta. Maskinen klikker, veier, snuser og legger det i «VENTER». Du får det ikke tilbake. Du har bær nok likevel.",
            skjema:
              "Du mater skjemaet inn i trakta. Maskinen spytter det ut igjen med en gang. Tomme skjemaer har ingen adresse. Maskinen er enig med Winter i alt.",
            skjema_signert:
              "Du prøver skjemaet i trakta. Maskinen spytter det ut. På baksiden står det nå, stemplet med maskinskrift: «IKKE EN PAKKE».",
          },
        },
        {
          id: "protokollene",
          navn: "Protokollene",
          rect: { x: 69, y: 20, w: 12, h: 40 },
          smart: "se",
          se: "Tunge, innbundne protokoller i rekke: «Klager på IQ, bind 1 til 14», «Klager på Rampenissen, bind 1 til 31», og én tynn liten en: «Ros». Den er ikke åpnet. Den er ikke støvete heller. Winter tørker den.",
          prat: "Du spør protokollene om det står noe om deg. Fra bind 31 stikker det ut en lapp: «Ugle: se Rampenissen, side 400 og utover.» Du åpner den ikke.",
          bruk: "Du drar ut «Ros». Det står én linje i den: «Hjerterud. Bollene. Alltid.» Så lukker du den fort, før noen ser at du så.",
        },
        {
          id: "pulten",
          navn: "Winters pult",
          rect: { x: 72, y: 56, w: 28, h: 36 },
          smart: "se",
          se: "En høy skrivepult med grønn lampe, en bunke papir som er så rett at du blir svimmel, og en liste merket «I DAG». Punkt 1: Tømme postkassen. Punkt 2: Stille klokka i tårnet etter tømmingen. Punkt 3: Spisse blyant. Punkt 3 er krysset av. Tre ganger.",
          prat: "Du spør pulten hvor Winter er. Lista «I DAG» svarer for ham: punkt 1 er ikke krysset av. Han står ute til det er gjort. Han kommer til å stå der lenge.",
          bruk: "Du dytter bunken en millimeter. Den ser verre ut enn den burde. Du dytter den tilbake. Den ser fortsatt verre ut. Du går derfra i håp om at det var innbilning.",
          feil: {
            skjema_signert:
              "Du legger skjemaet på pulten. Det ligger der. Winter er ikke her. Han er ute ved postkassen. Skjemaer som ligger uten Winter, blir ikke stemplet, de blir bare kalde.",
            skjema:
              "Du legger skjemaet på pulten og venter. Ingenting. Winter står ute på torget. Han stempler ikke per post.",
          },
        },
        {
          id: "stemplene",
          navn: "Stemplene",
          rect: { x: 80, y: 53, w: 8, h: 9 },
          smart: "se",
          se: "Fire stempler i rekke: «GODKJENT», «AVVIST», «VENTER» og ett som bare sier «HM». Det er pakkestempler. Postvesenets eget stempel ligger ikke her. Det ligger i skrinet på hylla utenfor, låst, mellom hver stempling.",
          prat: "Du sier «HM» til stemplene. «HM» ser ut som det er enig.",
          bruk: "Du trykker «HM» mot pulten. HM. Det kjennes riktig. Utenfra: «Eg hørte det!»",
          feil: {
            skjema_signert:
              "Du stempler skjemaet med «HM». Winter, gjennom vinduet, uten å snu seg: «Feil stempel. Feil pute. Feil person.» Blekket er tørt uansett, og det lille HM-et teller ikke.",
            skjema:
              "Du prøver «GODKJENT» på skjemaet. Puta på pulten er like tørr som den ute. Winter har brukt opp det røde blekket. På klager.",
          },
        },
        {
          id: "blekkhuset",
          navn: "Blekkhuset",
          rect: { x: 88, y: 58, w: 5, h: 8 },
          smart: "se",
          se: "Et lite blekkhus med etiketten «RØDT. Til stempelputa.» Det er tomt. Helt tomt. Bunnen er skrapt med en blyant. Den siste dråpen gikk med til en klage på IQ, understreket to ganger.",
          bruk: "Du snur blekkhuset. Ingenting kommer ut. Ikke engang lukt. Hvis puta skal bli rød, må det rødt fra et annet sted.",
          feil: {
            tyttebaer:
              "Du dytter et frossent bær ned i blekkhuset. Det sitter fast. Hardt, rødt og helt tørt. Du fisker det opp igjen. Frosne bær gir ikke fra seg noe før de tiner.",
            baersaft:
              "Du heller litt saft i blekkhuset. Winter, gjennom vinduet: «Det der er ikkje blekk. Det er bær. Blekkhuset er for blekk. Puta er for farge.» Saften er fortsatt varm. Puta står ute.",
          },
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 88, y: 20, w: 12, h: 30 },
          smart: "se",
          se: "Gjennom vinduet ser du husene rundt torget og snøen som faller. Winter ser du ikke, men du hører blyanten hans der ute: «Ugle. Innendørs. Kl. 16.41.»",
          prat: "Du vinker til Winter gjennom ruta. Han løfter blyanten til hilsen. Det er det nærmeste han kommer å vinke, og det er mer enn de fleste får.",
          bruk: "Du banker på ruta. Winter banker tilbake. Én gang. Presist.",
        },
        {
          id: "lampa",
          navn: "Den grønne lampa",
          rect: { x: 75, y: 40, w: 9, h: 13 },
          smart: "se",
          se: "Ei bankierlampe med grønn skjerm, den eneste i Snøfall. Winter bestilte den fra en katalog i 1987 og fylte ut skjema for import, toll og «grønt lys innendørs». Han godkjente alle tre selv. Det var en lang dag.",
          bruk: "Du trekker i snora. Lampa slukner. Hallen blir blå. Du trekker igjen. Grønn. Utenfra: «Eg SÅ det!»",
        },
        {
          id: "gulvet",
          navn: "Gulvet",
          rect: { x: 44, y: 86, w: 20, h: 14 },
          smart: "se",
          se: "Gulvplanker bonet så blanke at du ser deg selv nedenfra. Det går en stripe slitasje fra pulten til maskinen og tilbake. Winters. Ingen andre går i den. Ingen andre tør.",
        },
      ],
    },
    {
      id: "klokketaarnet",
      navn: "Klokketårnet",
      bilde: "spill/klokketarnet.jpg",
      utganger: [{ til: "torget", navn: "Ned til torget" }],
      // On the floor under the big clock face
      fjaer: { x: 72, y: 89, w: 4, h: 6 },
      hotspots: [
        {
          id: "urverket",
          navn: "Urverket",
          rect: { x: 0, y: 0, w: 16, h: 44 },
          smart: "se",
          se: "Tannhjul i alle størrelser, fra tallerken til knapp, som griper i hverandre og tikker. Ett av de minste er av tre. Det er IQs. Det var en nødløsning i 2019. Det går fortsatt. Ingen tør å bytte det.",
          prat: "Du sier «tikk» til urverket. Det sier «takk». Det er det høfligste i hele tårnet.",
          bruk:
            "Du stikker nebbet mot det største hjulet. Det stopper ikke. Det tar deg med en kvart runde før du slipper. " +
            R +
            "«Æ satt fast der i to tima en gang. Klokka gikk baklengs. Winter måtte stille heile landsbyen.»",
        },
        {
          id: "skiva",
          navn: "Den lille skiva",
          rect: { x: 7, y: 46, w: 8, h: 18 },
          smart: "bruk",
          puslespill: "taarnuret",
          se: [
            {
              hvis: "klokka_stilt",
              tekst:
                "Den lille messingskiva viser 16.40 og tikker fornøyd. Over den en plate: «Tårnuret stilles etter tømmingen av postkassen. Ikke omvendt. – W.»",
            },
            {
              tekst:
                "En liten messingskive med to visere, koblet til hele urverket. Den har stoppet. Over den sitter en gravert plate: «Tårnuret stilles etter tømmingen av postkassen. Ikke omvendt. – W.» Visere kan vris på. Tiden står et annet sted.",
            },
          ],
          bruk: "Klokka er stilt. Du lar den være. Winter har allerede notert at den stemmer, og det får han ikke oppleve ofte.",
        },
        {
          id: "loddet",
          navn: "Loddet",
          rect: { x: 15, y: 50, w: 6, h: 12 },
          smart: "se",
          se: "Et tungt lodd av jern i en kjetting. Det synker en tomme i timen og trekkes opp hver søndag. Av Winter. Med hansker. Han har en egen hanske for lodd.",
          bruk: "Du henger deg på loddet. Det synker en tomme. Klokka går ett minutt fortere. Winter kommer til å merke det neste søndag. Du skal være langt unna neste søndag.",
        },
        {
          id: "lanterna",
          navn: "Lanterna",
          rect: { x: 25, y: 28, w: 7, h: 18 },
          smart: "se",
          se: "En lanterne på en krok. Den som tenner den, er den som er først oppe om morgenen. Det er alltid Winter. Han har en liste over hvem som har vært først oppe. Den har ett navn.",
          prat: "Du hvisker «god natt» til lanterna. Flammen bukker. Den har gjort det for Winter hver kveld i tretti år. Han har aldri sett det. Han ser ned i lista.",
          bruk: "Du blåser på flammen. Den bøyer seg og retter seg opp igjen. Den har vært med på verre. Den har vært med på Rampenissen.",
        },
        {
          id: "klokkene",
          navn: "Klokkene",
          rect: { x: 29, y: 0, w: 48, h: 28 },
          smart: "se",
          se: "Fire messingklokker i bjelkene: to store, en mellomstor og en liten. Den lille er sprukket og klinger litt skjevt. Det er den alle i Snøfall liker best. Den høres ut som noen som ler.",
          bruk: "Du dytter til den lille klokka. KLING. Nede på torget ser Winter opp. Han ser rett på tårnet. Han ser rett på deg. Du står helt stille. Han noterer.",
          prat: "Du uler mot den store klokka. Den svarer med en dyp, lang tone som varer lenger enn den burde. Floke blåser seg opp. Hun har fått svar.",
        },
        {
          id: "utsikten",
          navn: "Utsikten",
          rect: { x: 36, y: 30, w: 28, h: 50 },
          smart: "se",
          se: [
            {
              hvis: "k1_ferdig",
              tekst:
                "Hele Snøfall under deg: snødekte tak, lanterner, røyk fra pipene og bodene nede på torget. Postkassen står med luka på gløtt, tom. Og på loftet hos IQ brenner det lys i vinduet igjen. Noen sover der. Snart.",
            },
            {
              tekst:
                "Hele Snøfall under deg: snødekte tak, lanterner, røyk fra pipene og bodene på torget som to små lysende esker. Bak husene ligger tjernet som en mørk flekk. Lenger borte, muren og porten. Og langt der ute, helt i kanten, noe du ikke kan se, men vet er der: linja hjem.",
            },
          ],
          bruk:
            "Du lener deg ut i buen. Vinden tar i fjærene. Du kunne fløyet herfra. Du kunne fløyet HVOR SOM HELST herfra. " +
            R +
            "«Ikkje fly nån plass! Æ har bare det ene kameraet, og IQ har bare den ene ugla. Kom ned igjen når dokker e ferdig med å se.»",
          prat: "Du roper «HALLO» ut over landsbyen. Ekkoet svarer «hallo». Noen nede på torget roper «hallo» tilbake. Winter noterer at noen ropte.",
        },
        {
          id: "stigen",
          navn: "Stigen",
          rect: { x: 17, y: 60, w: 15, h: 40 },
          smart: "bruk",
          gaaTil: "torget",
          se: "En bratt stige ned gjennom luka i gulvet, med trinn slitt av tre hundre år med Winter-forgjengere. Floke trenger ikke stigen. Hun bruker den likevel. Det er høflig.",
        },
        {
          id: "luka",
          navn: "Luka i gulvet",
          rect: { x: 31, y: 84, w: 13, h: 13 },
          smart: "se",
          se: "En firkantet luke i gulvet med stigen ned. Fra åpningen kommer det kald luft og lyden av Winter som kremter ved postkassen. Lyden bærer godt oppover. Det vet han.",
          prat: "Du roper «hallo» ned gjennom luka. Nede på torget svarer Winter: «Ikkje rop i luka.» Han så ikke opp. Han trengte ikke.",
          bruk: "Du titter ned gjennom luka. Mørkt, så lysere, så torget. Og øverst på postkassen, Winters flosshatt sett ovenfra. Tømming av postkassen er en offisiell anledning. Det meste er det, for Winter.",
        },
        {
          id: "urskiva",
          navn: "Den store urskiva",
          prat: "Du spør den store urskiva hva klokka er. Den viser det. Den har vist det i tre hundre år, og det er fortsatt det eneste den sier.",
          rect: { x: 83, y: 8, w: 17, h: 72 },
          smart: "se",
          se: [
            {
              hvis: "klokka_stilt",
              tekst:
                "Baksiden av den store urskiva, lysende gul av lampene bak. Viserne står på 16.40. Alle fire. Også den bøyde julekake-viseren, som nå peker på 16.40 av ren lojalitet.",
            },
            {
              tekst:
                "Baksiden av den store urskiva, lysende gul av lampene bak. Viserne ses som mørke streker gjennom glasset. Den fjerde, den bøyde, peker på «tid til neste julekake». " +
                R +
                "«Æ nådde den. Én gang. Det e derfor den e bøyd. Og det e derfor julekakan kom tre tima for tidlig i 2023. Ingen klagde.»",
            },
          ],
          bruk: "Du legger vingen mot glasset. Det er lunkent av lampene. Utenfor går snøen forbi viserne som små lys. Du blir stående litt. Det er lov.",
        },
        {
          id: "istappene",
          navn: "Istappene",
          rect: { x: 16, y: 0, w: 13, h: 8 },
          smart: "se",
          se: "Istapper i rad langs bjelken, lange som strikkepinner. De drypper ikke. Det er for kaldt til å dryppe, og det har vært det siden første desember. Winter har målt dem. Den lengste har navn.",
          bruk: "Du dytter til en istapp. Den klirrer mot naboen som en liten klokke. Det er en lyd Snøfall aldri har hørt før, og du er den eneste som hørte den.",
        },
        {
          id: "gulvet",
          navn: "Gulvet",
          rect: { x: 45, y: 80, w: 26, h: 10 },
          smart: "se",
          se:
            "Slitte gulvplanker med snø i sprekkene. Midt på gulvet er det en lysere flekk, firkantet, der noe har stått lenge og nettopp er flyttet. En kasse, kanskje. En kurv. " +
            R +
            "«Ei KURV? ... Winter sa kurven min va i postkassa. Han sa ikkje kor den va FØR.»",
        },
      ],
    },
    {
      id: "julebodene",
      navn: "Julebodene",
      bilde: "spill/julebodene.jpg",
      utganger: [{ til: "torget", navn: "Tilbake til torget" }],
      // In the trampled snow between the stalls
      fjaer: { x: 51, y: 73, w: 4, h: 6 },
      hotspots: [
        {
          id: "lanterna",
          navn: "Lanterna",
          rect: { x: 5, y: 35, w: 6, h: 14 },
          smart: "se",
          se: "En lanterne i takskjegget, med en flamme som er mer gul enn varm. Bodnissen har hengt den der for å se bærene. Bærene ser like ut i mørket. De ser like ut i lyset også.",
          prat: "Du sier «lys her» til lanterna. Den lyser der. Den gjorde det før også, men nå er det på bestilling.",
          bruk: "Du dytter lanterna. Den svinger, og skyggen av to boder, to bodnisser og én ugle danser over snøen. Uglen er størst. Det er skyggens fortjeneste.",
        },
        {
          id: "bodnisse_v",
          navn: "Bodnissen til venstre",
          rect: { x: 11, y: 37, w: 13, h: 25 },
          smart: "snakk",
          se: "En rund, skjeggete bodnisse i ullsjal, med et smil som når helt opp til lua. Han har solgt bær på torget i førti år. De samme bærene, hevder naboen. Han hevder det motsatte, like lenge.",
          bruk: "Du prikker bodnissen på armen. Han ser på deg, så på bærene, så på deg. «Ei neve er gratis for ugler. To never er handel.»",
          prat: [
            {
              hvis: "tok_tyttebaer",
              tekst:
                "«Fikk du bær? Bra. Mine er best. Ikke hør på ham med skiltet. Han kjøper av meg.» Han sier det høyt nok. Naboen hører det. Naboen sier ingenting, men skiltet hans ser litt mindre ut.",
            },
            {
              tekst:
                "«Frosne tyttebær! Harde som småstein og røde som ... ja, som tyttebær. De tiner ikke her ute, ikke før mai. Vil du ha saft av dem, må du slippe dem i noe varmt. Ta ei neve, ugler får ei neve.»",
            },
          ],
        },
        {
          id: "baerkurvene_v",
          navn: "Bærkurvene",
          rect: { x: 6, y: 57, w: 30, h: 16 },
          smart: "bruk",
          se: "Kurver med røde og blå frosne bær, stablet så høyt at de nederste kurvene aldri har sett dagslys. De øverste bærene glitrer av rim. Hvert bær er et lite, hardt løfte om saft en gang i framtida.",
          ta: {
            item: "tyttebaer",
            tekst:
              "Du tar ei neve frosne tyttebær fra kurven nærmest. Bodnissen nikker. Fra torget, langt borte, hører du Winter notere: «Bær. Ei neve. Boden til venstre.»",
          },
          bruk: "Du har bær nok. Bodnissen løfter et øyenbryn under lua. Ett øyenbryn er alt han har å si om saken.",
        },
        {
          id: "klementinene",
          navn: "Klementinkassa",
          prat:
            "Du uler lavt mot klementinene. " +
            R +
            "«Ikkje snakk te dem. Æ har snakka te en klementin. Ho svare ikkje, men ho ser ut som ho veit nåkka.»",
          rect: { x: 17, y: 83, w: 19, h: 17 },
          smart: "se",
          se:
            "En trekasse full av klementiner, med grønne blad på. Det er en fordypning midt i kassa, akkurat stor nok til en nisse på tretti centimeter. " +
            R +
            "«Æ har aldri ligge i den kassa. Æ har ligge VED SIDA av den kassa. Det e en viktig forskjell for en som lukte klementin.»",
          bruk: "Du dytter en klementin med nebbet. Den triller ut av kassa, over snøen og stopper mot boden til høyre. Bodnissen til høyre tar den opp, smiler og legger den på disken sin. Han selger ikke klementiner. Nå gjør han det.",
        },
        {
          id: "vottene",
          navn: "Vottekurven",
          rect: { x: 36, y: 79, w: 15, h: 21 },
          smart: "se",
          se: "En kurv med strikkede votter i alle farger. Ingen av dem har make. Hjerterud strikker én og én, når hun venter på at noe skal heve. Så går hun. Vottene er like lange som en bolle tar.",
          prat: "Du spør vottene hvor makene deres er. Hjerterud vet det. Hjerterud sier det ikke. Hun sier at en vott alene er en halv gave, og at halve gaver også er gaver.",
          bruk: "Du drar fram en grønn vott med nebbet. Den passer ikke på en ugle. Du prøver likevel. Bodnissen til venstre ler så skjegget rister. Det var verdt det.",
        },
        {
          id: "taarnet",
          navn: "Klokketårnet",
          rect: { x: 54, y: 0, w: 9, h: 58 },
          smart: "se",
          gaaTil: "klokketaarnet",
          se: "Klokketårnet rett bak bodene, gyllent mot natta. Herfra ser du at det er lys i rommet øverst, og en luke som står åpen. Floke kan fly opp dit.",
        },
        {
          id: "gryta",
          navn: "Gryta",
          rect: { x: 63, y: 80, w: 11, h: 18 },
          smart: "se",
          se: "En liten messinggryte på et bord, med damp som stiger opp. Du kikker nedi. Tom. Det er bare dampen igjen. Bodnissen til høyre: «Utsolgt siden tre. Dampen er gratis.»",
          prat: "Du sier «hallo» ned i gryta. Det kommer et ekko. Et lite ett. Gryta er tom, men den har akustikk.",
          bruk: "Du holder vingene over gryta. Dampen er varm, men den varmer ikke noe. Hadde det vært noe i gryta, hadde det vært noe å tine bær i. Det er ikke noe i gryta.",
          feil: {
            tyttebaer:
              "Du slipper et bær i gryta. Det klirrer mot bunnen. Tom gryte tiner ingenting. Bodnissen til høyre fisker det opp og legger det i sin kurv. Han har tjent ett bær i dag.",
            kaffekopp:
              "Du setter koppen i gryta. Nå står det en kopp i en gryte. Bodnissen til høyre: «Det er ikke sånn det virker.» Du tar koppen tilbake. Den er fortsatt varm.",
          },
        },
        {
          id: "bodnisse_h",
          navn: "Bodnissen til høyre",
          rect: { x: 77, y: 36, w: 11, h: 25 },
          smart: "snakk",
          se: "En høy, tynn bodnisse med langt fjes og et uttrykk som om han har vunnet noe. Han har et skilt. Det er det han har vunnet.",
          bruk: "Du prikker bodnissen på armen. Han bøyer seg ned og hvisker: «Mine er bedre. Jeg sier ikke hvorfor. Da hadde det ikke vært en hemmelighet.»",
          prat: [
            {
              hvis: "tok_tyttebaer",
              tekst:
                "«Tok du av HANS bær?» Han ser dypt skuffet ut i to sekunder. Så: «Det går bra. De er like. Ikke si det til noen. Særlig ikke til ham.»",
            },
            {
              tekst:
                "«Bedre bær! Det sto på skiltet i går. Jeg har stått her i førti år ved siden av ham, og mine har alltid vært bedre. Samme skog, samme frost, samme kurv. Men bedre. Ta ei neve, så skjønner du.»",
            },
          ],
        },
        {
          id: "baerkurvene_h",
          navn: "De bedre bærkurvene",
          rect: { x: 65, y: 57, w: 27, h: 16 },
          smart: "bruk",
          se: "Kurver med røde og blå frosne bær, nøyaktig like dem til venstre. Nøyaktig. Du ser fram og tilbake tre ganger. Rampenissen ser fram og tilbake tre ganger. Winter har en protokoll om saken. Den er tom.",
          ta: {
            item: "tyttebaer",
            tekst:
              "Du tar ei neve frosne tyttebær fra den bedre kurven. De er like harde og like røde. Bodnissen til høyre smiler som om du har valgt riktig. Bodnissen til venstre ser en annen vei.",
          },
          bruk: "Du har bær nok. Bodnissen til høyre nikker forståelsesfullt. «Man trenger ikke mer enn det beste.»",
        },
        {
          id: "skiltet",
          navn: "Skiltet",
          rect: { x: 86, y: 36, w: 12, h: 16 },
          smart: "se",
          se: "Et blankt treskilt. I går sto det «BEDRE» på det. I natt malte noen over. Bodnissen til høyre maler det på nytt hver morgen, men i dag har han ikke rukket det. Under ligger førti lag med «BEDRE».",
          prat: "Du leser det blanke skiltet høyt. Det tar ikke lang tid. Bodnissen til venstre, uten å snu seg: «Les baksiden.» Bodnissen til høyre: «IKKE les baksiden.»",
          bruk: "Du snur skiltet med nebbet. På baksiden står det, med mindre bokstaver: «LIKE». Du snur det fort tilbake. Noen ting skal to bodnisser få ordne opp i selv.",
        },
        {
          id: "himmelen",
          navn: "Himmelen",
          rect: { x: 25, y: 0, w: 28, h: 18 },
          smart: "se",
          se: "Stjerner mellom bodtakene og ett lite, mørkt punkt som flytter seg. En brevfugl på vei til postkassen, med noe i nebbet som er større enn nebbet. De klarer det alltid. I foten blafrer en liten merkelapp. Winter merker alle som lander.",
          prat: "Du uler mot brevfuglen der oppe. Den svinger én gang over bodene og flyr videre. Det var en hilsen. Brevfugler hilser kort, de har mye å bære.",
        },
        {
          id: "lanterne_h",
          navn: "Lanterna til høyre",
          rect: { x: 63, y: 38, w: 5, h: 11 },
          smart: "se",
          se: "Lanterna i den bedre boden. Den er nøyaktig like stor som den til venstre. Bodnissen til høyre pusser glasset to ganger om dagen, så den skal lyse bedre. Den lyser likt. Han pusser likevel.",
        },
        {
          id: "hjoernekurven",
          navn: "Kurven i hjørnet",
          rect: { x: 88, y: 78, w: 12, h: 22 },
          smart: "se",
          se: "En kurv med blå bær i hjørnet av den bedre boden, bortgjemt under disken. Bodnissen til høyre: «De er til meg. Man må smake på varene. Hver dag. Flere ganger.» Han har blå tunge. Det har han hatt i førti år.",
          bruk: "Du prøver å nå et blått bær. Bodnissen flytter kurven en tomme. Du prøver igjen. En tomme til. Det er en dans, og han kan den.",
        },
        {
          id: "huset",
          navn: "Huset bak bodene",
          rect: { x: 36, y: 24, w: 17, h: 20 },
          smart: "se",
          se: "Et grønt tømmerhus med balkong og lys i alle vinduer, rett bak bodene. Der bor bodnissene. Begge. I hver sin etasje. De har bodd over hverandre i førti år og krangler gjennom gulvet om hvem som har de beste bærene. Gulvet er nøytralt.",
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
                "«Postkassen er låst opp i henhold til nødparagraf 99. Resten er deres problem. Og hengslets. Hengslet er ikkje mitt ansvar. Det står i paragraf 100.»",
            },
            {
              hvis: "winter_snakket",
              tekst:
                "«Dere igjen. Skjema 4112-B. Utfylt, signert av eier av funnsted, stemplet. Eg gjentar ikkje mer enn tre ganger, og dette var nummer to.»",
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
            { tekst: "Kjenner du Rampenissen?", neste: "rampen" },
            { tekst: "Hvorfor har du tre runder med skjerf?", neste: "skjerf" },
            { tekst: "Ha det, Winter." },
          ],
        },
        kurv: {
          tekst:
            "«Garnkurven. Funnet på loftet til IQ, full av ull og klementinskall. Umerket løsøre. Den ligger i postkassen til eg får Skjema 4112-B: utfylt, signert av eieren av funnstedet, og stemplet. Tre ting.»",
          rampenissen:
            "«POSTKASSEN?! Han har lagt SENGA mi i postkassen! Og ‘umerka’? Den lukte mæ! Lukt e merking!»",
          valg: [
            { tekst: "Hvor får vi tak i et sånt skjema?", neste: "skjema" },
            { tekst: "Hvem er eieren av funnstedet?", neste: "eier" },
            { tekst: "Og stempelet?", neste: "tort" },
            { tekst: "Takk, vi fikser det." },
          ],
        },
        skjema: {
          tekst:
            "«Skjema 4112-B deles ut i verkstedet til IQ. Han har en hel bunke. Han bruker dem som kaffebrikker. Eg har sendt tre klager. Han bruker klagene som kaffebrikker også.»",
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
            "«Loftet tilhører IQ. Altså signerer IQ, i felt 3-A. Han åpner ikkje døra for noen, men han signerer alt som kommer under den. Eg har sett ham signere en pizzaeske.»",
          rampenissen:
            "«Under døra. Æ har prøvd å kom under den døra sjøl. Æ e for tjukk. Det e klementinan.»",
          valg: [
            { tekst: "Og stempelet?", neste: "tort" },
            { tekst: "Skjønner." },
          ],
        },
        tort: {
          tekst:
            "«Stempelputa er tørr. Tørr som julekake fra i fjor. Uten farge, intet stempel. Uten stempel, intet skjema. Uten skjema, ingen kurv. Det er ikkje meg. Det er systemet. Eg er bare systemets skjerf.»",
          rampenissen:
            "«Tørr pute? Da treng vi nåkka vått og rødt. Tynt. Og helst varmt, for alt her e frossent, inkludert Winter.»",
          valg: [
            { tekst: "Og selve stempelet?", neste: "skrin" },
            { tekst: "Skjønner. Vi finner noe rødt." },
          ],
        },
        skrin: {
          tekst:
            "«Stempelet ligger i skrinet på hylla. Låst, selvsagt. Skrinet åpnes med tømmetiden. Eg husker ikkje tømmetiden. Den står på skiltet. Eg skriver skilt, eg leser dem ikkje.»",
          rampenissen:
            "«Tallhjul og et skilt. Det e nesten for lett. Æ sei nesten.»",
          valg: [{ tekst: "Vi leser skiltet." }],
        },
        skrin_laast: {
          tekst:
            "Winter kikker på puta. «Våt. Godkjent rød.» Så på skrinet. «Låst. Eg åpner ikkje skrin i arbeidstiden. Tømmetiden står på skiltet. Hjulene står på skrinet. Resten er hoderegning, og det er ikkje min paragraf.»",
          rampenissen:
            "«Han veit koden sjøl og lar oss gjør jobben. Æ har respekt for det. Litt.»",
          valg: [{ tekst: "Vi åpner skrinet." }],
        },
        rampen: {
          tekst:
            "«Rampenissen. Han som sov på loftet til IQ i elleve måneder og dro uten å feie. Hvis dere har kontakt med ham: han skylder meg førtito minutter arbeidstid og én blyant.»",
          rampenissen:
            "«Ikkje sei at æ sitt her og hør på! ... Førtito minutt? Æ brukte to tima på å stable klementinkassan hans! Og blyanten tygde æ på i søvne. Det telle ikkje.»",
          valg: [{ tekst: "Vi skal hilse." }],
        },
        skjerf: {
          tekst:
            "«Én runde for trekken fra tjernet. Én runde for luftingen fra klokketårnet. Og én runde fordi det er pent. En hals uten skjerf er en hals som fryser.»",
          rampenissen: "«Æ har null runda. Æ e en hals med lue.»",
          valg: [{ tekst: "Logisk." }],
        },
        ustemplet: {
          tekst:
            "Winter holder skjemaet mot lyset. «Felt 3-A, eier av funnsted: tomt. Felt 7-C, stempel: tomt. Uten de to er dette en papirbåt.» Han gir det tilbake. «Eieren signerer. Stempelet står der borte. Puta er tørr. Lykke til.»",
          rampenissen:
            "«Papirbåt! ... Nei. Fokus. Signatur OG stempel. Han e grundig, det ska han ha. Æ ska ikkje gi han nåkka anna.»",
          valg: [{ tekst: "Vi kommer tilbake." }],
        },
        signert_tort: {
          tekst:
            "Winter leser felt 3-A. «IQ. Brunsvidd hjørne. Han har signert pizzaesker penere.» Så løfter han stempelet, trykker det i puta og holder det opp. Ingenting. «Tørr. Eg stempler ikkje med luft. Luft er ikkje sporbart.»",
          rampenissen: "«Luft e ikkje sporbart. Æ ska huske den.»",
          valg: [{ tekst: "Vi fikser puta." }],
        },
        stemplet: {
          tekst:
            "Winter leser felt 3-A, nikker, trykker stempelet i den røde puta og ... SMAKK. Han snuser på avtrykket. «Bærlukt. Brunsvidd hjørne. Men til nød gyldig.» Han låser opp postkassen med en liten messingnøkkel.",
          rampenissen:
            "«HAHA! Han LUKTA på det! Fort, kurven, før han finn en paragraf til!»",
          valg: [{ tekst: "Takk, Winter!" }],
        },
      },
    },
    hjerterud: {
      taler: "Hjerterud",
      portrett: "hjerterud",
      start: "start",
      noder: {
        start: {
          tekst: [
            {
              hvis: "k1_ferdig",
              tekst:
                "«Jeg hørte bjella helt hit! Rampenissen har fått senga si, og Winter har fått skjemaet sitt. Det er det nærmeste Winter kommer en klem. Sett deg, Floke. Du har fortjent en bolle. Du har fortjent to.»",
            },
            {
              hvis: "hjerterud_snakket",
              tekst:
                "«Floke igjen! Kom inn, kom inn. Det er trekk ved døra og varmt ved ovnen, så velg ovnen. Hva trenger du, vennen?»",
            },
            {
              tekst:
                "«Nei, men se! En ugle i kaféen! Du er den ulluglen til Rampenissen, det ser jeg på brillene. Kom inn før varmen går ut. Har du spist? Du har ikke spist.»",
            },
          ],
          valg: [
            {
              tekst: "Vi leter etter Rampenissens garnkurv.",
              neste: "kurv",
              flagg: "hjerterud_snakket",
            },
            {
              tekst: "Hvordan tiner man frosne bær?",
              hvis: "hjerterud_snakket",
              neste: "tine",
            },
            {
              tekst: "Kan vi få en bolle?",
              uten: "tok_bolle",
              neste: "bolle",
              flagg: "tok_bolle",
              gir: "bolle",
            },
            {
              tekst: "Hvordan går det med Rampenissen hjemme hos oss?",
              neste: "rampen",
            },
            { tekst: "Ha det, Hjerterud." },
          ],
        },
        kurv: {
          tekst:
            "«Garnkurven! Den med bjella. Winter bar den over torget i går, med armene rett ut, som om den kunne bite. Han har lagt den i postkassen og vil ha skjema. Han vil alltid ha skjema. Og stempel. Stempelputa hans har vært tørr siden i fjor, for han bruker det røde blekket på klager.»",
          rampenissen:
            "«Som om den kunne BITE? Kurven min? Den har ikkje bete nån sia ... nei, den har aldri bete nån.»",
          valg: [
            { tekst: "Tørr stempelpute? Hva gjør vi med det?", neste: "pute" },
            { tekst: "Takk, vi snakker med Winter." },
          ],
        },
        pute: {
          tekst:
            "«Puta trenger noe rødt og vått. Tynt, ikke tykt, ellers blir stempelet klissete, og Winter har et eget ansikt for klissete. Jeg lager rød saft hver morgen: frosne bær i noe varmt, så smelter de av seg selv. Kakaoen min får du ikke ta med ut, Winter har en paragraf mot den.»",
          rampenissen:
            "«Frosne bær i nåkka varmt. Bær har bodan. Nåkka varmt ... IQ har bestandig en kopp som ryk. Han merke ikkje om den forsvinn. Han merke knapt om HAN forsvinn.»",
          valg: [{ tekst: "Bær i noe varmt. Skjønner!" }],
        },
        tine: {
          tekst:
            "«Legg dem i noe varmt, så smelter de til saft av seg selv. Ikke på ovnen, da brenner de. Ikke i kakaoen, da blir det suppe. I en kopp med noe varmt. Hvem har alltid en varm kopp stående? Han oppe i loftet. Han glemmer dem over alt.»",
          rampenissen:
            "«IQ. Ho meine IQ. Koppen hans ryk ennå når æ kjem heim te påske.»",
          valg: [{ tekst: "Takk, Hjerterud!" }],
        },
        bolle: {
          tekst:
            "Hjerterud legger en bolle på bordet før du er ferdig med å spørre. «Kanel, nystekt, med perlesukker. Den er din. Ikke til Winter, ikke til IQ, din. Og hvis Rampenissen sier noe, så si at jeg sender en til ham også. I posten. Når posten går igjen.»",
          rampenissen:
            "«I POSTEN? Ho veit at Winter har postkassa! Det e en vits. Ho vitse om mæ. Æ e stolt.»",
          valg: [{ tekst: "Takk!" }],
        },
        rampen: {
          tekst:
            "«Rampenissen? Han sitter i hylla hos dere og hvisker, sier IQ. Jeg sendte med ham tre poser knekkebrød og en kakaoboks ned linjen. Si fra om han har spist dem. Si fra om han IKKE har spist dem. Da sender jeg flere.»",
          rampenissen:
            "«Æ har spist dem. Alle tre. Første natta. Ikkje sei det. Sei at æ sparer.»",
          valg: [{ tekst: "Vi skal hilse." }],
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
            { tekst: "Hvorfor er skiltet ditt blankt?", neste: "skilt" },
            { tekst: "Hva lager du der inne?", neste: "hemmelig" },
            { tekst: "Vi går igjen." },
          ],
        },
        kurv: {
          tekst:
            "«Kurven! Winter tok den. Han sa den var umerket løsøre. Jeg sa den var merket, den luktet jo Rampenissen. Han godtok ikke lukt som merking. Han godtok heller ikke klementinskall som adresse.»",
          rampenissen:
            "«Lukt E merking! Det står sikkert i en paragraf. En av dem gode.»",
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
            "«Det sto IKKE RØR på det. Folk rørte likevel, særlig én bestemt person med rød lue, og nå er bokstavene borte. Skiltet gjelder forresten også dere, men dere er sikkert flinkere. Dere har i hvert fall ikke klistremerker.»",
          rampenissen:
            "«Æ rørte ikkje. Æ kikka med fingran. Det e nåkka heilt anna. Det e vitenskap.»",
          valg: [{ tekst: "Vi skal ikke røre." }],
        },
        hemmelig: {
          tekst:
            "«Noe hemmelig. Så hemmelig at jeg ikke husker det selv akkurat nå. Det summer, i hvert fall. Det er et godt tegn. Som regel. Sist det summet sånn, fikk Hjerterud ny kjøkkenvegg.»",
          valg: [{ tekst: "Lykke til med summingen." }],
        },
      },
    },
  },
  gaater: [
    {
      id: "winter",
      ferdig: "winter_snakket",
      maal: "Finn ut hvem som tok garnkurven. Han med skjerfet vet noe.",
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
      maal: "Gjør stempelputa til Winter våt. Noe rødt og tynt.",
      kjent: { hvis: "winter_snakket" },
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
      maal: "Få Skjema 4112-B signert av IQ.",
      kjent: { hvis: "winter_snakket" },
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
      maal: "Åpne stempelskrinet på hylla.",
      kjent: { hvis: "stempel_vaat" },
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
      maal: "Lever det signerte skjemaet til Winter.",
      kjent: { hvis: "skjema_signert" },
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
      maal: "Få opp den frosne luka på postkassen.",
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
      maal: "Legg postkortet i luka riktig, så kurven kan hentes.",
      tips: [
        R +
          "«Postkortet på innsida av luka e i ni bita. Winter vil ha bildet heilt før luka går opp. Sjølsagt vil han det.»",
        R +
          "«Trykk på en bit ved sida av det tomme feltet, så glir han dit. Få hjørnan på plass først, så resten.»",
        R +
          "«Øverste rad først: trapp, hus, urtårn. Så midten. Dem to siste bitan nederst går rundt det tomme feltet te dem sitt. Ta dæ tid, æ har heile dagen. Æ har ikkje nåkka anna.»",
      ],
    },
    {
      id: "klokka",
      ferdig: "klokka_stilt",
      kjent: { hvis: "winter_snakket" },
      maal: "Still den lille skiva i klokketårnet.",
      tips: [
        R +
          "«Klokka ska stilles etter nåkka. Det står på plata over skiva. Winter har skrevet den sjøl, så det e regla.»",
        R +
          "«Etter tømminga av postkassa. Når tømmes ho? Det står på skiltet på postkassa nede på torget.»",
        R +
          "«Klokka 16.40. Sett det første hjulet på 16 og det andre på 40. Så slår klokkan, og Winter får en god dag.»",
      ],
    },
  ],
};
