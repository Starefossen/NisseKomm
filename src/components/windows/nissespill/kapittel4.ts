/**
 * Kapittel 4: «Klar til avgang» (dag 22). The gate has stood open since the
 * solstice and Winter holds the departure list: Julius' glasses (a letter bird
 * broods on them), Rampenissen's lucky bell from chapter 1 (behind the wood
 * box), and the screaming right gate wing (tallow from the gate lantern).
 * Written for Håkon (9) and Kristian (12): the three points can be done in any
 * order (one `alle` condition on Winter's check), the magnet line must be
 * guided down the gap behind the wood box (route), and the chapter ends when
 * the children stamp the three fields of the departure form themselves (lock
 * with words). The nut is a red herring for the bird. Side story only: no
 * clues or codes for the daily puzzles. Rampenissen speaks nordlandsk,
 * everyone else bokmål.
 *
 * Images: reuses spill/port-aapen.jpg and feed/julius-kontor.jpg.
 */
import type { Kapittel } from "./motor";

const R = "Rampenissen: ";

export const KAPITTEL_4: Kapittel = {
  n: 4,
  tittel: "Klar til avgang",
  dag: 22,
  klar: true,
  teaser: "Sleden pakkes. Winter har en liste og to blyanter.",
  start: "porten",
  slutt: "k4_ferdig",
  intro: [
    R +
      "«Dokker! Det e snart. Porten står åpen, sleden e pakka, og Winter står ved porten med ei LISTE. Tre punkt. Ingen flyg før alle tre e kryssa av. Han har to blyanta. Det betyr alvor.»",
    R +
      "«Julius finn ikkje brillan sine. Lykkebjella mi, den vi redda fra postkassen, e BORTE fra knaggen. Og porten hyle som en katt hver gang nån tar i den. Æ har hørt den heilt te Bergen. Naboen trudde det va mæ.»",
    R +
      "«Floke står ved porten. Winter har lista, Julius har kontoret, og dokker har hodan. Dokker kan dette no. Æ sitt her og spise klementin og e nervøs. Det e sånn æ hjelpe.»",
  ],
  utro:
    R +
    "«Briller, bjelle, port. Tre av tre, i den rekkefølgen dokker valgte sjøl. Winter godtok det. WINTER. Lykkebjella heng der ho ska, så Julius finn fram te stua dokkers. Det va dokker som gjord det. Æ må gå og finn ei klementin. Det e nåkka i øyet. Over og ut. Og god jul!»",
  gjenstander: {
    fjaer: {
      id: "fjaer",
      navn: "Fjærpenn",
      ikon: "feather",
      se: "Julius' fjærpenn, med grønt blekk på spissen og en veldig myk fjær i den andre enden. Den kiler bare av å se på den. Floke ser på den og rister på seg.",
    },
    klementin: {
      id: "klementin",
      navn: "Klementin",
      ikon: "sun",
      se: "En rund, blank klementin fra skåla i vinduskarmen. Rampenissen ser på den gjennom skjermen. Du hører ham svelge. To ganger.",
    },
    noett: {
      id: "noett",
      navn: "Hasselnøtt",
      ikon: "circle",
      se: "Ei rund, brun hasselnøtt fra skåla. Rund, ja. Blank? Nei. Den ser ut som noe som har ligget i en lomme. Den har sannsynligvis det.",
    },
    briller: {
      id: "briller",
      navn: "Julius' briller",
      ikon: "sunglasses",
      se: "Runde lesebriller med gullinnfatning. Litt varme, og med ei lita fjær på det ene glasset. Noen har ruget på dem. De har tatt det pent.",
    },
    magnet: {
      id: "magnet",
      navn: "Hestesko-magnet",
      ikon: "zap",
      se: "En rød hestesko-magnet. Den holdt fast tre lapper på skapet til taletrakten. Nå holder den fast i Flokes fot. Hun får den løs. Så vidt. Den vil ha foten tilbake.",
    },
    hyssing: {
      id: "hyssing",
      navn: "Rød hyssing",
      ikon: "spinner",
      se: "En lang rød tråd fra brevbunken. Sterk nok til å holde hundre brev fra Bergen sammen, og de er tunge av regn og lange av hilsener.",
    },
    fiskesnoere: {
      id: "fiskesnoere",
      navn: "Magnet i hyssing",
      ikon: "fish",
      se: "Hestesko-magneten knyttet fast i enden av den røde hyssingen. Ei fiskestang for ting som ikke er fisk. Det er de beste fiskestengene.",
    },
    bjelle: {
      id: "bjelle",
      navn: "Lykkebjella",
      ikon: "bell",
      se: "Rampenissens lykkebjelle, med den røde garntråden fra garnkurven. Litt støv, litt vedflis, én nøtt som satt fast. Den gnistrer fortsatt. Nøtta gjør ikke det.",
    },
    talgstump: {
      id: "talgstump",
      navn: "Talgstump",
      ikon: "fire",
      se: "En myk, fet stump av talglyset fra lanterna. Lukter litt sau. Glir mellom fingrene. Akkurat det et rustent hengsel drømmer om, hvis hengsler drømmer. Dette hyler, så det er mulig.",
    },
  },
  fjaerBelonning:
    R +
    "«Siste fjær! Åtte te sammen, heile veien fra postkassa te porten. Floke sei ingenting. Ho ser bare på dokker med dem store brillan. Det e takk, det. På ugle.»",
  puslespill: {
    fiskevei: {
      type: "rute",
      tittel: "Snora bak vedkassa",
      flagg: "snoere_fram",
      tekst:
        "Den siste kubben vipper til side, og snora glir rett ned. KLIKK. Magneten har fått tak i noe der nede. Noe som gnistrer. " +
        R +
        "«Æ hørte KLIKK! Det e det fineste klikket i Snøfall. Dra! Forsiktig! Dra forsiktig fort!»",
      rutenett: ["S..", "LL.", ".|L", ".LM"],
    },
    avgangsstempel: {
      type: "laas",
      tittel: "Avgangsskjemaet",
      flagg: "k4_ferdig",
      tekst:
        "LEST. HENGT. SMURT. Tre stempler, tre felt. Oppe i kontorvinduet løfter Julius tommelen. Winter løfter sin. Han tar den ned fort, men dere så det. " +
        R +
        "«TOMMEL OPP FRA JULIUS! Og fra WINTER! Det finnes ikkje nåkka høgare i Snøfall. Æ har sjekka.»",
      hjul: [
        ["SETT", "LEST", "HENGT", "SMURT", "TALT"],
        ["SETT", "LEST", "HENGT", "SMURT", "TALT"],
        ["SETT", "LEST", "HENGT", "SMURT", "TALT"],
      ],
      svar: ["LEST", "HENGT", "SMURT"],
    },
  },
  kombinasjoner: [
    {
      a: "magnet",
      b: "hyssing",
      gir: "fiskesnoere",
      tekst:
        "Du knytter hyssingen rundt magneten med en dobbel knute. Floke strammer med nebbet. " +
        R +
        "«Fiskestang! Æ fiska en gang. Æ fikk en sokk. Det va min egen sokk. Æ hadde den på mæ da æ kasta ut.»",
    },
  ],
  scener: [
    {
      id: "porten",
      navn: "Porten til Snøfall",
      bilde: "spill/port-aapen.jpg",
      utganger: [{ til: "kontor", navn: "Fly opp til Julius' kontor" }],
      // In the snow by the wall, bottom left of the road
      fjaer: { x: 8, y: 86, w: 4, h: 6 },
      hotspots: [
        {
          id: "himmelen",
          navn: "Himmelen",
          rect: { x: 0, y: 0, w: 100, h: 12 },
          smart: "se",
          se: "Grønne slør over takene og stjerner mellom dem. Det er den slags himmel en slede liker. Sleden har ikke sagt det, men den står og peker oppover.",
        },
        {
          id: "urtaarnet",
          navn: "Urtårnet",
          rect: { x: 56, y: 10, w: 8, h: 20 },
          smart: "se",
          se: "Urtårnet med de fire viserne. Den fjerde viseren, «tid til neste julekake», er fortsatt bøyd. Den peker nå på «snart». Det stemmer. Den har stemt siden første desember, men nå mener den det.",
        },
        {
          id: "husene_v",
          navn: "Husene til venstre",
          rect: { x: 0, y: 14, w: 30, h: 32 },
          smart: "se",
          se: "Gule og røde tømmerhus med røyk fra pipene. I ett vindu står en nisse og pakker. I et annet står en nisse og pakker opp det den første pakket. De er brødre. De har gjort dette i førti år. Ingen har sagt noe.",
        },
        {
          id: "husene_h",
          navn: "Husene til høyre",
          rect: { x: 66, y: 12, w: 34, h: 34 },
          smart: "se",
          se: "Bak muren ligger hele Snøfall med lys i alle vinduer. Et sted der inne står IQs verksted. Det summer ikke i kveld. Det er første gang. IQ sover. Det er også første gang.",
        },
        {
          id: "portbuen",
          navn: "Portbuen",
          rect: { x: 38, y: 12, w: 24, h: 30 },
          smart: "se",
          se: "En portbue av stein og tømmer, med snø på taket og to drager skåret ut øverst. Dragene ser på hverandre. De har gjort det i tre hundre år. De er ikke ferdige med å snakke. Den ene har tydeligvis sagt noe dumt rundt år 1800.",
        },
        {
          id: "lanterne_v",
          navn: "Lanterna til venstre",
          rect: { x: 36, y: 52, w: 7, h: 13 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_talgstump",
              tekst:
                "Lanterna lyser videre, med et litt kortere lys. Haspen er lukket igjen. Winter lukket den selv. Han sjekket to ganger.",
            },
            {
              tekst:
                "Ei lanterne av jern og glass med et tykt talglys inni. Flammen er gul og rolig, og talgen renner mykt ned langs lyset. Lanterna er lukket med en liten hasp. Haspen er ikke låst. Haspen er Winter.",
            },
          ],
          ta: {
            item: "talgstump",
            hvis: "winter_talg",
            tekst:
              "Winter åpner haspen med to fingre og ser en annen vei. Du klyper av en myk stump av talglyset. Én. Han sa én. Du vurderer to. Du ser på Winter. Én.",
          },
          bruk: [
            {
              hvis: "tok_talgstump",
              tekst:
                "Du har fått din stump. Winter telte. Winter teller fortsatt.",
            },
            {
              tekst:
                "Lanterna er lukket med en liten hasp. Winter ser på deg. Du ser på Winter. Winter ser på haspen. Haspen ser på ingen, den er en hasp. Spør ham.",
            },
          ],
          feil: {
            fjaer:
              "Du kiler haspen med fjærpennen. Haspen ler ikke. Winter gjør det heller ikke. Nesten.",
            fiskesnoere:
              "Du fisker etter haspen. Magneten klikker fast i lanterna. Winter: «Offentlig belysning er ikke fiskevann.» Du drar den løs.",
          },
        },
        {
          id: "lanterne_h",
          navn: "Lanterna til høyre",
          rect: { x: 60, y: 52, w: 6, h: 13 },
          smart: "se",
          se: "Samme lanterne som til venstre, bare speilvendt. Flammen inni lener seg mot venstre, som om den savner noen. Haspen her er rustet fast. Den har aldri vært åpnet. Winter har et skjema for det også.",
        },
        {
          id: "sleden",
          navn: "Sleden",
          rect: { x: 44, y: 54, w: 10, h: 20 },
          smart: "bruk",
          prat:
            "Du ønsker sleden god tur. Den knirker vennlig. " +
            R +
            "«Den sa takk. Æ kan sledespråk. Æ bodde under en i to vintra.»",
          se: [
            {
              hvis: "bjelle_montert",
              tekst:
                "Julius' slede står rett innenfor porten, pakket og pusset, og i tømmene henger lykkebjella og gnistrer. Nå finner den fram. Den vet allerede hvor stua ligger. Det er bjella som bekrefter.",
            },
            {
              tekst:
                "Julius' slede står rett innenfor porten, pakket og pusset. Det mangler noe i tømmene. Noe lite som pleier å gnistre, og som en viss nisse snakker om i søvne.",
            },
          ],
          bruk: "Du klapper på sleden. Den er kald og blank og klar. Den venter bare på en bjelle og en nisse. Og at Winter er ferdig med lista. Den venter mest på det siste.",
          bruker: [
            {
              item: "bjelle",
              uten: "bjelle_montert",
              flagg: "bjelle_montert",
              forbruker: true,
              tekst:
                "Du knytter lykkebjella fast i tømmene med den røde garntråden. Den klinger ikke. Den gnistrer. Winter krysser av punkt to uten å se opp. " +
                R +
                "«BJELLA MI! På sleden! No finn han HEIM. Te stua dokkers, meine æ. Det e det samme.»",
            },
          ],
          feil: {
            klementin:
              "Du legger klementinen i sleden. Winter: «Proviant registreres av Hjerterud, ikke av ugler.» Du tar den igjen. Klementinen hadde gledet seg.",
            noett:
              "Du legger nøtta i sleden. Winter: «Nei.» Han sa det før du var ferdig. Du tar den igjen.",
            fiskesnoere:
              "Du fisker i sleden. Du får en vott. Winter noterer: «Vott. Funnet. Eier: ukjent. Farge: rød. Alle votter i Snøfall er røde. Dette blir vanskelig.»",
            talgstump:
              "Du smører talg på sleden. Nå er sleden glatt. Den var glatt fra før. Du har gjort den glattere, og Julius har ikke fått nytt sete.",
          },
        },
        {
          id: "hengslet",
          navn: "Hengslet på høyre portfløy",
          rect: { x: 53, y: 56, w: 6, h: 20 },
          smart: "bruk",
          se: [
            {
              hvis: "port_smurt",
              tekst:
                "Høyre portfløy står vidåpen og stille. Hengslet skinner av talg. Winter har notert «smurt» med stor, pen skrift, og understreket det. To ganger.",
            },
            {
              tekst:
                "Høyre portfløy står halvveis åpen, og hengslet er rødt av rust. Hver gang vinden tar i porten, hyler den så hele Snøfall hører det. Rudolf svarer hver gang. Han tror det er en venn.",
            },
          ],
          bruk: [
            {
              hvis: "port_smurt",
              tekst:
                "Du dytter portfløyen. Ikke en lyd. Winter nikker. Rudolf, et sted langt borte, savner vennen sin.",
            },
            {
              tekst:
                "Du dytter portfløyen. HYYYYL. Winter holder seg for ørene. Rudolf, et sted langt borte, svarer. Så svarer noe annet, enda lenger borte. Du slutter.",
            },
          ],
          bruker: [
            {
              item: "talgstump",
              uten: "port_smurt",
              flagg: "port_smurt",
              forbruker: true,
              tekst:
                "Du gnir talg inn i hengslet. En gang. To. Portfløyen glir opp, stille som snø, og står vidåpen. Winter krysser av punkt tre og hører etter. Ingenting. Han ser nesten skuffet ut. " +
                R +
                "«Hørte dokker det? Ingenting! Det e den fineste lyden en port kan lage.»",
            },
          ],
          feil: {
            klementin:
              "Du gnir klementinskall på hengslet. Nå hyler det og lukter godt. Det er en forbedring, men ikke den rette.",
            noett:
              "Du dytter nøtta inn i hengslet. Nå hyler det med knekkelyd. Du får den ut igjen. Den er litt flatere.",
            fiskesnoere:
              "Du fisker etter hengslet. Magneten klikker fast. Du drar. Hengslet hyler. Du slipper. Hengslet hyler litt til, for sikkerhets skyld.",
            bjelle:
              "Du henger bjella på hengslet. Nå hyler det med bjelle på. Winter: «Nei.» Rampenissen: «NEI.» De er enige. Det er første gang.",
            fjaer:
              "Du stikker fjærpennen i hengslet. Grønt blekk på rust. Nå er det et rustent, hylende, grønt hengsel.",
          },
        },
        {
          id: "skiene",
          navn: "Skiene",
          rect: { x: 64, y: 58, w: 6, h: 22 },
          smart: "se",
          se: "To par ski lent mot muren. Det ene paret er for en nisse. Det andre er for en rein. Rudolf har aldri brukt dem. Han vil ikke snakke om det. IQ vil gjerne snakke om det. Ingen spør IQ.",
        },
        {
          id: "winter",
          navn: "Winter",
          rect: { x: 72, y: 58, w: 14, h: 28 },
          smart: "snakk",
          snakk: "winter",
          se: "Winter står ved høyre portstolpe med skriveplate og blyant. To runder med skjerf i dag. Bare to. Blyanten er spisset til en nål, og reserveblyanten er spisset til en mindre nål.",
          bruk: "Du prikker Winter på armen. Han noterer: «Prikket. Igjen. Kl. 17.12.» Han har en egen side for prikk. Den er nesten full.",
          feil: {
            bjelle:
              "Du viser Winter bjella. «Punkt to henger på sleden, ikke på meg. Jeg er ikke en slede. Jeg har sjekket.»",
            briller:
              "Du viser Winter brillene. «Punkt én er Julius' øyne, ikke mine. Jeg ser utmerket. Jeg ser alt. Det er problemet.»",
            talgstump:
              "Du holder talgstumpen mot Winter. Han tar et skritt bakover. «Hengslet. Ikke skjerfet.»",
            klementin:
              "Winter ser på klementinen. «Bestikkelse nummer to i år. Den første var frossen. Denne er bedre. Fortsatt nei.»",
          },
        },
        {
          id: "skriveplata",
          navn: "Skriveplata",
          rect: { x: 86, y: 72, w: 8, h: 12 },
          smart: "bruk",
          vis: { hvis: "klar_til_stempel" },
          puslespill: "avgangsstempel",
          se: [
            {
              hvis: "k4_ferdig",
              tekst:
                "Avgangsskjemaet med tre røde stempler og tre kryss. Winter har lagt det øverst på skriveplata, der han kan se det. Han ser på det ofte.",
            },
            {
              tekst:
                "Avgangsskjemaet har tre felt: «1. Snill-listen er ___». «2. Bjella er ___». «3. Porten er ___». Ved siden av ligger stempelblokka: tre hjul med ord, ett for hvert felt. Winter ser på deg og sier ingenting. Det er hans måte å si «vær så god» på.",
            },
          ],
          bruk: "Skjemaet er stemplet. Winter tar skriveplata tilbake, forsiktig, som om den er varm.",
        },
        {
          id: "muren",
          navn: "Muren",
          rect: { x: 0, y: 50, w: 36, h: 24 },
          smart: "se",
          se: "En lav steinmur med snø på toppen, bygd for lenge siden av noen som ville holde varmen inne, ikke folk ute. Steinen er varm der sola har vært. Det har den ikke vært på lenge. Steinen husker likevel.",
        },
        {
          id: "veien",
          navn: "Veien",
          rect: { x: 20, y: 80, w: 60, h: 20 },
          smart: "se",
          se: "Snøen foran porten er tråkket flat av støvler og hover. Ett spor går i sirkel tre ganger og ender ved lanterna. Det er reinsdyrspor. Han ville bare se på lyset. Og smake på det. Det er et bittemerke i snøen under lanterna.",
          bruk: "Floke tegner en ugle i snøen med foten. Den ligner. Litt. Den ligner mer på Winter. Du visker den ut før han ser.",
        },
      ],
    },
    {
      id: "kontor",
      navn: "Julius' kontor",
      bilde: "spill/julius-kontor.jpg",
      utganger: [{ til: "porten", navn: "Ned til porten" }],
      // On the shelf edge between the lamp and the bear
      fjaer: { x: 40, y: 46, w: 4, h: 6 },
      hotspots: [
        {
          id: "juletreet",
          navn: "Juletreet",
          rect: { x: 4, y: 0, w: 30, h: 76 },
          smart: "se",
          se: "Juletreet, nå med fire småkaker færre enn sist. Floke ser i gulvet. Floke vet ingenting om småkaker. Floke har smuler på nebbet.",
        },
        {
          id: "vedkassa",
          navn: "Vedkassa",
          rect: { x: 0, y: 78, w: 16, h: 22 },
          smart: "bruk",
          vis: { en_av: [{ uten: "snoere_nede" }, { hvis: "snoere_fram" }] },
          se: [
            {
              hvis: "tok_bjelle",
              tekst:
                "Vedkassa ved foten av treet. Sprekken bak den er tom nå, bortsett fra to nøtter og en knapp. De får ligge. Knappen er Winters. Du sier det ikke.",
            },
            {
              hvis: "snoere_fram",
              tekst:
                "Snora går rett ned i sprekken, og nede i mørket sitter magneten fast i noe som gnistrer. Det er bare å dra.",
            },
            {
              tekst:
                "Ei vedkasse av tre ved foten av treet. Mellom kassa og veggen er det en sprekk, smal som en blyant. Noe blinker der nede. Noe som gnistrer. Og noe rundt ved siden av, som ikke gnistrer.",
            },
          ],
          ta: {
            item: "bjelle",
            hvis: "snoere_fram",
            tekst:
              "Du drar forsiktig opp, og der kommer lykkebjella, med rød garntråd, litt vedflis og ei nøtt som har hengt seg på. " +
              R +
              "«DER E HO! Æ visste det. Æ visste det ikkje. Men æ håpa høgt.»",
          },
          bruk: [
            {
              hvis: "tok_bjelle",
              tekst: "Tom sprekk. To nøtter. En knapp. Fred.",
            },
            {
              tekst:
                "Floke stikker nebbet ned i sprekken. For trangt. Hun stikker foten ned. For trangt. Hun stikker hodet ned. Nei. " +
                R +
                "«For trangt for hender og ugler. Men ikkje for nåkka på ei snor. Nåkka som bjella vil HENGE på.»",
            },
          ],
          bruker: [
            {
              item: "fiskesnoere",
              uten: "snoere_nede",
              flagg: "snoere_nede",
              forbruker: true,
              tekst:
                "Du senker magneten ned i sprekken. Den svinger, leter ... og setter seg fast mellom to kubber halvveis nede. Sprekken går i sikksakk mellom kubbene, og kubbene kan vippes. " +
                R +
                "«Det e en labyrint der nede. Vipp på kubban så snora finn veien. Ikkje dra ennå!»",
            },
          ],
          feil: {
            magnet:
              "Du slipper magneten ned i sprekken. KLIKK, den sitter fast i bjella der nede. Og du når ikke ned. Floke river den opp igjen med nebbet, med nød og neppe. Du trenger noe å senke den ned MED. Og dra opp med.",
            hyssing:
              "Du senker hyssingen ned. Den henger der og gjør ingenting. Bjella er ikke imponert. Noe må sitte i enden. Noe bjeller liker.",
            fjaer:
              "Du stikker fjærpennen ned i sprekken. Det kiler bjella. Den ler ikke. Bjeller ler ikke, de ringer, og denne gjør ikke det engang.",
            klementin:
              "Du triller klementinen inn i sprekken. Nå er det to ting der nede. Floke får den ut igjen etter en stund. Dette gikk feil vei.",
            noett:
              "Du triller nøtta inn i sprekken. Den finner en venn der nede. Nå er de to nøtter. Du har ikke hjelp av noen av dem.",
          },
        },
        {
          id: "sprekken",
          navn: "Sprekken bak vedkassa",
          rect: { x: 0, y: 78, w: 16, h: 22 },
          smart: "bruk",
          vis: { alle: [{ hvis: "snoere_nede" }, { uten: "snoere_fram" }] },
          puslespill: "fiskevei",
          se: "Snora går ned i sprekken og stopper mellom to kubber. Under dem ligger flere kubber på kryss og tvers, og helt nederst, i mørket, gnistrer det. Hver kubbe kan vippes så det blir en åpning den ene eller andre veien.",
          bruk: "Vipp kubbene så snora finner veien fra toppen og helt ned til det som gnistrer.",
        },
        {
          id: "lampa",
          navn: "Lampa",
          rect: { x: 36, y: 14, w: 7, h: 14 },
          smart: "se",
          se: "Vegglampa lyser som vanlig. Under den henger en tom knagg. Det er der bjella pleier å henge. Pleide. Det er et hovavtrykk på veggen under knaggen. Høyt oppe. Han sto på bakbeina.",
        },
        {
          id: "bokhylla",
          navn: "Bokhylla",
          rect: { x: 42, y: 0, w: 12, h: 30 },
          smart: "se",
          se: "«Alt om sirup» er lånt ut. Det står en lapp i hullet: «LÅNT. – IQ». Under står det «LÅNT FRA IQ. – RUDOLF». Rudolf kan ikke skrive. Noen hjalp ham. Skriften er Rampenissens. Ingen sier noe.",
        },
        {
          id: "bamsen",
          navn: "Bamsen",
          rect: { x: 43, y: 30, w: 8, h: 10 },
          smart: "se",
          prat: "Du gratulerer bamsen med sløyfa. Han sier ingenting, men sløyfa sitter litt rettere etterpå.",
          se: "Bamsen med ett øye har fått ny sløyfe til jul. Han ser ikke mer begeistret ut enn vanlig. Innvendig jubler han. Han har jublet innvendig siden 1920.",
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 56, y: 0, w: 40, h: 40 },
          smart: "se",
          se: "Gjennom buevinduet ser du porten der nede, vidåpen og gul av lys, og en liten figur med skriveplate som ikke har rørt seg på en time. Han rørte seg nettopp. Han rettet på skjerfet. Nå står han stille igjen.",
        },
        {
          id: "lysene",
          navn: "Lysene i vinduskarmen",
          rect: { x: 65, y: 46, w: 11, h: 13 },
          smart: "se",
          se: "Begge lysene brenner i kveld. Hjerterud sier de skal brenne hver kveld til sleden er hjemme igjen. Hun har kjøpt inn mange lys. Hun har kjøpt inn flere lys enn Snøfall har kvelder.",
        },
        {
          id: "skaala",
          navn: "Skåla i vinduskarmen",
          rect: { x: 76, y: 50, w: 8, h: 10 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_klementin",
              tekst:
                "Skåla med nøtter og én klementin mindre. Nøttene merker ingenting. Nøtter merker sjelden noe.",
            },
            {
              tekst:
                "Ei skål med nøtter og klementiner. Klementinene er runde og blanke og ser ut som små soler. Nøttene er runde og brune og ser ut som nøtter. Rampenissen sukker gjennom skjermen. Ikke over nøttene.",
            },
          ],
          ta: {
            item: "klementin",
            tekst:
              "Du tar den rundeste klementinen. " +
              R +
              "«Ikkje spis den. Ikkje spis den. Æ sei det te mæ sjøl òg. Æ sei det til skjermen. Skjermen høre ikkje.»",
          },
          bruk: "Én klementin er nok. Resten er til Julius. Han trenger energi, og nøttene teller ikke, sier han.",
        },
        {
          id: "noettene",
          navn: "Nøttene i skåla",
          rect: { x: 76, y: 56, w: 8, h: 5 },
          smart: "bruk",
          se: "Hasselnøtter nederst i skåla, under klementinene. Runde. Brune. Ikke blanke. De er der mest for at skåla skal se full ut.",
          ta: {
            item: "noett",
            tekst:
              "Du tar ei nøtt. Rund! " +
              R +
              "«Rund, ja. Men ser den ut som et egg? Æ veit ikkje ka brevfugla tenke. Æ veit ikkje ka æ tenke.»",
          },
          bruk: "Resten av nøttene får ligge. De er til Julius. Han spiser dem ikke. De er til skåla.",
        },
        {
          id: "taletrakten",
          navn: "Taletrakten",
          rect: { x: 84, y: 36, w: 16, h: 46 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_magnet",
              tekst:
                "Taletrakten og skapet med plugger. Tre lapper ligger på skapet nå som magneten er borte. Den øverste: «RING LANDÅS JULAFTEN. IKKE GLEM.» Den nederste: «IKKE GLEM LAPPEN.»",
            },
            {
              tekst:
                "Taletrakten og skapet med plugger. På skapdøra holder en rød hestesko-magnet tre lapper fast. Den øverste: «RING LANDÅS JULAFTEN. IKKE GLEM.» Magneten holder godt. Den holder alt av jern i nærheten. Den holder nesten i Floke.",
            },
          ],
          ta: {
            item: "magnet",
            tekst:
              "Du tar hestesko-magneten. Tre lapper seiler ned på gulvet. Du legger dem pent på skapet. Julius glemmer ikke. Han har tre lapper. Og Hjerterud.",
          },
          bruk: "Du blåser i trakten. Ute ved tjernet sier IQ «hva i all verden». Han sier det hver gang. Han sover. Han sier det i søvne.",
        },
        {
          id: "julius",
          navn: "Julius",
          rect: { x: 48, y: 57, w: 17, h: 16 },
          smart: "snakk",
          snakk: "julius",
          se: [
            {
              hvis: "briller_levert",
              tekst:
                "Julius sitter i stolen med brillene på nesa og listen i fanget. Han leser sakte og smiler for hvert navn. Noen navn smiler han ekstra for. Tre av dem bor i Bergen.",
            },
            {
              tekst:
                "Julius sitter i stolen og myser mot den åpne boka. Han holder den helt opp mot nesa. Så langt fra nesa. Så opp igjen. Det hjelper ikke. Han prøver med ett øye. Det hjelper halvparten så lite.",
            },
          ],
          bruk: "Du setter deg på Julius' skulder. Han klapper deg på hodet uten å se. «Floke. Du lukter talg. Eller klementin. Eller begge.»",
          bruker: [
            {
              item: "briller",
              uten: "briller_levert",
              flagg: "briller_levert",
              forbruker: true,
              tekst:
                "Julius tar brillene, blåser bort ei fjær og setter dem på nesa. «Å.» Han ser på listen. «Å!» Han ser på deg. «Floke, du har sot på nebbet.» Nede ved porten krysser Winter av punkt én. " +
                R +
                "«Han ser! Han ser lista! Han ser alt! Æ må gjømme klementinskallet.»",
            },
          ],
          feil: {
            klementin:
              "Julius tar klementinen, takker og legger den i lomma. Så gir han den tilbake. «Du trenger den til noe, tror jeg. Jeg ser det på deg. Jeg ser ikke mye, men det ser jeg.»",
            noett:
              "Julius tar nøtta, knekker den med tennene og gir deg kjernen. «Takk. Hva var spørsmålet?» Du spiser kjernen. Nøtta er borte. Du har en nøtt mindre og et spørsmål mer.",
            fjaer:
              "Du kiler Julius under nesa med fjærpennen. Han nyser så listen flyr. Du henter den. Han nyser igjen. Du henter den igjen. Du legger fjæra bort.",
            bjelle:
              "Julius lytter. «Rampenissens bjelle. Den skal på sleden, ikke på meg. Jeg har prøvd å fly med bjelle på. Det ble en lang kveld.»",
            fiskesnoere:
              "Du fisker etter Julius. Magneten setter seg fast i brillekjedet hans. Det er ikke briller i det. Bare kjede. Han har hatt kjedet uten briller i to dager.",
            talgstump:
              "Du holder talgstumpen fram. Julius snuser. «Sau. Noen har gitt deg talg. Winter? Da er det virkelig snart jul.»",
          },
        },
        {
          id: "brevbunken",
          navn: "Brevbunken",
          rect: { x: 22, y: 70, w: 20, h: 12 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_hyssing",
              tekst:
                "Brevbunken fra Bergen ligger løs nå. Den holder seg likevel. Brevene liker hverandre. De er fra samme by.",
            },
            {
              tekst:
                "Brev til Julius, bundet med en lang rød hyssing. Bunken fra Bergen er tykkest. Den er alltid tykkest. Hyssingen er lang nok til å gå rundt tre ganger og ned i en sprekk.",
            },
          ],
          ta: {
            item: "hyssing",
            tekst:
              "Du løsner den røde hyssingen fra bunken og vikler den opp. Lang. Sterk. Brevene blir liggende pent. De har vært på reise, de vet hvordan man oppfører seg.",
          },
          bruk: "Brevene ligger løst og pent. Du lar dem ligge. Det øverste er fra noen som heter Håkon. Du leser ikke videre.",
        },
        {
          id: "boka",
          navn: "Den tykke boka",
          rect: { x: 17, y: 78, w: 12, h: 12 },
          smart: "se",
          se: "Den brune boka uten tittel. Du åpner den igjen. «Takk, se: det man sier når noen har gjort noe uten å bli bedt.» Du lukker den. Det var hele siden. De er korte, sidene i den boka. De trenger ikke være lange.",
        },
        {
          id: "blekkhuset",
          navn: "Blekkhuset",
          rect: { x: 35, y: 81, w: 6, h: 9 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_fjaer",
              tekst:
                "Blekkhuset uten penn. Blekket er fortsatt grønt. Det venter. Blekk er tålmodig.",
            },
            {
              tekst:
                "Blekkhuset med fjærpennen i. Fjæra er lang og myk og vipper hver gang noen puster. Floke puster. Den vipper. Floke puster igjen. Dette kan hun holde på med lenge.",
            },
          ],
          ta: {
            item: "fjaer",
            tekst:
              "Du drar fjærpennen opp av blekkhuset. En grønn dråpe faller på skrivebordet og blir til en liten gran. Nesten. Mer som en gran som har hatt en vanskelig vinter.",
          },
          bruk: "Grønt blekk. Du dypper ikke nebbet. Du har lært det også. Det tok tre dager å få det av.",
        },
        {
          id: "brevfuglen",
          navn: "Brevfuglen",
          rect: { x: 56, y: 84, w: 9, h: 10 },
          smart: "bruk",
          prat: "«Hei, du.» Brevfuglen svarer med en lav kurring som betyr enten «hei» eller «ikke rør». Du velger å tro det første.",
          se: [
            {
              hvis: "tok_briller",
              tekst:
                "Brevfuglen ruger på klementinen med lukkede øyne og dyp tilfredshet. Hun tror det er verdens fineste egg. Ingen sier noe annet. Ingen har hjerte til det, og hun har et godt nebb.",
            },
            {
              hvis: "fugl_kilt",
              tekst:
                "En liten grå brevfugl sitter på skrivebordet ved den åpne boka. Du vet hva hun ruger på nå: briller. Runde, blanke briller. Hun vet at du vet. Hun flytter seg ikke. Hun har tid. Hun har mer tid enn deg.",
            },
            {
              tekst:
                "En liten grå brevfugl sitter på skrivebordet ved den åpne boka og ruger. På hva? Hun sitter helt i ro og ser på deg med ett øye. Det andre sover. Under henne glimter noe, men hun flytter seg ikke en fjær.",
            },
          ],
          bruk: [
            {
              hvis: "tok_briller",
              tekst:
                "Du stryker fuglen over ryggen. Hun kurrer. Klementinen er trygg. Den kommer aldri til å klekke, og det er greit for alle.",
            },
            {
              tekst:
                "Du dytter forsiktig på fuglen. Hun dytter ikke tilbake. Hun bare blir. Brevfugler er laget av tålmodighet og fjær, og mest tålmodighet.",
            },
          ],
          bruker: [
            {
              item: "fjaer",
              uten: "fugl_kilt",
              flagg: "fugl_kilt",
              tekst:
                "Du kiler fuglen under vingen med fjærpennen. Hun fniser og letter en centimeter. Under henne: Julius' briller! Runde og blanke. Så setter hun seg igjen. " +
                R +
                "«Brevfugla ruge på alt som e rundt OG blankt. Gi ho nåkka ANNA som e det, så flytte ho sæ.»",
            },
            {
              item: "fjaer",
              hvis: "fugl_kilt",
              tekst:
                "Du kiler henne igjen. Hun fniser igjen. Brillene glimter igjen. Hun setter seg igjen. Dette kan dere holde på med hele kvelden. Hun har ingen planer.",
            },
            {
              item: "klementin",
              uten: "tok_briller",
              flagg: "tok_briller",
              gir: "briller",
              forbruker: true,
              tekst:
                "Du legger klementinen ved siden av fuglen. Hun ser på den. Hun ser på brillene. Klementinen er rundere. Og blankere. Hun flytter seg over med et fornøyd pip, og du plukker opp brillene. " +
                R +
                "«Byttehandel! Og ho fikk den beste delen, spør du mæ. Spør mæ.»",
            },
          ],
          feil: {
            noett:
              "Du legger nøtta ved siden av fuglen. Hun ser på den. Rund, ja. Blank? Hun ser på deg. Hun ser på nøtta. Hun dytter den utfor kanten med nebbet. Den triller under vedkassa. Hun har standarder, og de er blanke.",
            hyssing:
              "Du legger hyssingen rundt fuglen. Hun ser på den som om du har gitt henne et skjerf. Det er ikke helt feil. Hun ser litt ut som Winter nå.",
            magnet:
              "Brevfugler er ikke magnetiske. Du sjekket. Nå vet du. Hun vet også. Hun er ikke fornøyd med å vite det.",
            fiskesnoere:
              "Du fisker etter fuglen. Hun ser på magneten som svinger forbi, og gjesper. Brevfugler har sett verre fiskestenger. De har sett Rampenissens.",
            talgstump:
              "Du holder talgstumpen fram. Fuglen lukker begge øynene. Det er en tydelig anmeldelse.",
          },
        },
        {
          id: "lupa",
          navn: "Lupa",
          rect: { x: 46, y: 74, w: 16, h: 7 },
          smart: "se",
          se: "Julius' lupe, tilbake på plass siden sist. Han har prøvd å lese listen med den. Bokstavene ble store, men like uklare. Store og uklare er verre. Han har sagt det til lupa.",
        },
        {
          id: "listen",
          navn: "Den åpne boka",
          rect: { x: 65, y: 76, w: 18, h: 18 },
          smart: "se",
          se: [
            {
              hvis: "briller_levert",
              tekst:
                "Snill-listen ligger åpen, og Julius leser den selv nå. Du kikker ikke. Floke kikker ikke. Nesten ikke. Det står en H øverst på siden. Det kan være hvem som helst.",
            },
            {
              tekst:
                "Snill-listen ligger åpen på skrivebordet. Julius holder hånda over den. «Ikke før brillene. Jeg vil lese den selv.» Han har holdt hånda der i to dager. Den er litt stiv.",
            },
          ],
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
              hvis: "k4_ferdig",
              tekst:
                "«Avgangslisten er komplett. Tre av tre. Jeg har aldri hatt tre av tre. Jeg vet ikke helt hva jeg skal gjøre med hendene. Jeg tror jeg skal ta av en runde til.»",
            },
            {
              hvis: "klar_til_stempel",
              tekst:
                "«Tre av tre, bekreftet. Skjemaet ligger på skriveplata. Stempelblokka ligger ved siden av. Jeg ser på. Jeg ser alltid på, men nå ser jeg på med vilje.»",
            },
            {
              hvis: "winter_snakket",
              tekst:
                "«Avgangslisten. Punkt én: briller. Punkt to: bjelle. Punkt tre: port. Rekkefølgen er veiledende. Det er nytt i år. Jeg prøver noe. Si fra når dere mener dere er ferdige, så sjekker jeg.»",
            },
            {
              tekst:
                "«Halt. Porten er reservert for avgangsforberedelser. Jeg har en liste. Listen har tre punkter. Ingen flyr før alle tre er krysset av. Ikke engang Julius. Særlig ikke Julius.»",
            },
          ],
          valg: [
            {
              tekst: "Hva står på listen?",
              neste: "liste",
              flagg: "winter_snakket",
            },
            {
              tekst: "Alt på lista er gjort. Sjekk!",
              alle: [
                { hvis: "briller_levert" },
                { hvis: "bjelle_montert" },
                { hvis: "port_smurt" },
              ],
              uten: "klar_til_stempel",
              neste: "stempel",
              flagg: "klar_til_stempel",
            },
            {
              tekst: "Vi tror vi er ferdige. Sjekk!",
              hvis: "winter_snakket",
              en_av: [
                { uten: "briller_levert" },
                { uten: "bjelle_montert" },
                { uten: "port_smurt" },
              ],
              neste: "ikkeferdig",
            },
            {
              tekst: "Kan vi få litt talg fra lanterna?",
              hvis: "winter_snakket",
              uten: "winter_talg",
              neste: "talg",
              flagg: "winter_talg",
            },
            {
              tekst: "Hvorfor hyler porten?",
              hvis: "winter_snakket",
              neste: "hyl",
            },
            { tekst: "Har du det bra, Winter?", neste: "skjerf" },
            { tekst: "Ha det, Winter." },
          ],
        },
        liste: {
          tekst:
            "«Punkt én: Julius leser Snill-listen. Han finner ikke brillene sine. Punkt to: lykkebjella henger på sleden. Den er borte fra knaggen. Punkt tre: høyre portfløy smøres. Den hyler. Begynn hvor dere vil. Jeg sa det. Det gjorde vondt, men jeg sa det.»",
          rampenissen:
            "«Bjella MI? Æ hang ho på knaggen hos Julius! ... Æ trur æ hang ho der. Æ hang NÅKKA der. Og ‘begynn kor dokker vil’? Fra WINTER? Det snør oppover.»",
          valg: [
            { tekst: "Hvorfor ikke i rekkefølge i år?", neste: "rekkefolge" },
            { tekst: "Vi fikser det." },
          ],
        },
        rekkefolge: {
          tekst:
            "«I fjor sto Julius og ventet på punkt én mens punkt tre hylte, og ingen gjorde noe, for rekkefølgen. Det var ikke byråkrati. Det var dumt. Jeg skrev det opp.» Han viser lappen. Det står «DUMT». Understreket.",
          rampenissen:
            "«Han har skrive ‘dumt’ på ei lapp om sæ sjøl. Det e det modigaste æ har sett i Snøfall.»",
          valg: [{ tekst: "Respekt, Winter." }],
        },
        talg: {
          tekst:
            "«Lanternene er offentlig belysning, paragraf 14.» Han ser på listen. På porten. På deg. «Paragraf 15: avgangen går foran alt. Jeg åpner haspen på den venstre. Ta en stump. Én. Den høyre har jeg ikke paragraf for.»",
          rampenissen:
            "«ÉN. Han sa én. Ta én. Ikkje to. Æ kjenne dokker. Æ kjenne mæ sjøl.»",
          valg: [{ tekst: "Én stump. Takk, Winter." }],
        },
        hyl: {
          tekst:
            "«Fordi ingen har smurt den siden den sist var helt åpen. Det er lenge siden. Jeg har sendt tre klager. Til meg selv. Jeg har ikke svart. Jeg har begynt på et svar. Det er på side fire.»",
          rampenissen:
            "«Han klage te sæ sjøl og svare ikkje. Æ elske han litt. Ikkje si det te han.»",
          valg: [{ tekst: "Vi finner noe fett." }],
        },
        skjerf: {
          tekst:
            "Winter ser ned på skjerfet. «To runder i dag. Det er mildere. Jeg vet ikke hvorfor. Det er ingen paragraf for det.» Han retter på skriveplata. «Jeg har det bra. Takk for at du spurte. Ingen spør. Jeg har et skjema for det, og det er tomt.»",
          rampenissen:
            "«Han har tatt av en runde! Det e tøvær i Winter! Nån må ring IQ, det e sikkert vitenskap.»",
          valg: [{ tekst: "Vi spør igjen i morgen." }],
        },
        stempel: {
          tekst:
            "Winter løfter blyanten. «Punkt én.» Julius vinker fra kontorvinduet, briller på nesa. «Punkt to.» Bjella gnistrer i tømmene. «Punkt tre.» Han dytter portfløyen med én finger. Stille. «Tre av tre. Paragraf 16: den som gjorde jobben, stempler. Det er dere. Jeg ser på.»",
          rampenissen:
            "«Vi får STEMPLE? Med Winter sitt stempel? Æ må sett mæ. Æ sitt allerede. Æ må sett mæ meir.»",
          valg: [{ tekst: "Vi stempler." }],
        },
        ikkeferdig: {
          tekst: [
            {
              uten: "briller_levert",
              tekst:
                "Winter ser opp mot kontorvinduet. Julius myser mot ruta uten briller og vinker til feil vindu. «Punkt én mangler. Jeg har stått her siden i morges. Jeg kan stå litt til. Jeg er flink til å stå.» Han står.",
            },
            {
              uten: "bjelle_montert",
              tekst:
                "Winter ser bort på sleden. Tømmene er tomme. «Punkt to mangler. Jeg har stått her siden i morges. Jeg kan stå litt til. Jeg er flink til å stå.» Han står.",
            },
            {
              tekst:
                "Winter dytter høyre portfløy med én finger. HYYYYL. «Punkt tre mangler. Det hørte hele Snøfall. Jeg har stått her siden i morges. Jeg kan stå litt til.» Han står.",
            },
          ],
          rampenissen:
            "«Han e flink te å stå. Det e sant. Gå og bli ferdig, så får han sitte.»",
          valg: [{ tekst: "Vi kommer tilbake." }],
        },
      },
    },
    julius: {
      taler: "Julius",
      portrett: "julius",
      start: "start",
      noder: {
        start: {
          tekst: [
            {
              hvis: "k4_ferdig",
              tekst:
                "«Tre av tre, sier Winter. Jeg har aldri sett ham så ... fornøyd? Han smilte nesten. Nesten. Og du, Floke: hils Rampenissen og si at bjella henger. Han vet det. Si det likevel. Si det to ganger.»",
            },
            {
              hvis: "briller_levert",
              tekst:
                "«Brillene! Nå ser jeg listen. Og nå ser jeg deg, Floke. Du har fortsatt sot på nebbet. Og klementin. Og noe som kan være talg. Du har hatt en kveld.»",
            },
            {
              tekst:
                "«Floke! Kom hit. Jeg ser ikke stort uten brillene mine. Jeg la dem her ved boka i går kveld, og nå er det bare ... fjær der. Og noe som ser på meg. Med ett øye. Det er verre enn to.»",
            },
          ],
          valg: [
            {
              tekst: "Hvor er brillene dine?",
              uten: "briller_levert",
              neste: "briller",
            },
            { tekst: "Hva med lykkebjella?", neste: "bjelle" },
            { tekst: "Hva står på listen?", neste: "liste" },
            { tekst: "Ha det, Julius." },
          ],
        },
        briller: {
          tekst:
            "«Ved boka. Under den brevfuglen. Hun kom med et brev fra Landås i natt, så brillene mine, og bestemte at de var et egg. Jeg har ikke hjerte til å jage henne. Hun har fløyet langt. Og hun har et godt nebb.»",
          rampenissen:
            "«Brevfugla ruge på alt som e rundt og blankt. Vil du ha nåkka fra ei brevfugl, må du gi ho nåkka ho like bedre. Det e sånn med alle.»",
          valg: [{ tekst: "Vi finner noe hun liker bedre." }],
        },
        bjelle: {
          tekst:
            "«Rampenissens bjelle? Den hang på knaggen under lampa. Så kom Rudolf innom for å låne en bok, reiste seg på bakbeina, og nå ligger den bak vedkassa. For trangt for hender. Og for ugler, er jeg redd. Jeg har prøvd med en pinne. Pinnen er der også nå.»",
          rampenissen:
            "«Rudolf. Sjølsagt. For trangt for hender, ugler og pinna. Men bjella e av messing. Ka e det som like messing og jern?»",
          valg: [{ tekst: "Vi finner på noe." }],
        },
        liste: {
          tekst:
            "«Navn. Alle som har hjulpet noen i år uten å bli bedt om det. Det er en lang liste. Den blir lengre hvert år, og det gjør meg gladere hvert år. I år er det tre navn jeg gleder meg spesielt til å lese. Jeg sier ikke hvilke.»",
          rampenissen:
            "«Står æ der? Ikkje svar. Jo, svar. Nei. Ikkje svar. Blunk én gang vess æ står der.»",
          valg: [{ tekst: "Det er en fin liste." }],
        },
      },
    },
  },
  gaater: [
    {
      id: "briller",
      ferdig: "briller_levert",
      maal: "Lista, punkt 1: Finn brillene til Julius.",
      kjent: {},
      tips: [
        R +
          "«Julius finn ikkje brillan. Spør han kor han la dem. Han veit det, han ser dem bare ikkje. Det e nån som sitt på dem.»",
        R +
          "«Brevfugla på skrivebordet ruge på nåkka rundt og blankt. Kil ho med fjærpennen fra blekkhuset, så ser dokker ka. Og gi ho nåkka ANNA rundt og blankt. Ikkje nøtta. Nøtta e ikkje blank.»",
        R +
          "«Ta klementinen fra skåla i vinduskarmen og gi den te brevfugla. Så gir dokker brillan te Julius.»",
      ],
    },
    {
      id: "fiske",
      ferdig: "snoere_nede",
      maal: "Lista, punkt 2: Få tak i lykkebjella bak vedkassa hos Julius.",
      kjent: {},
      tips: [
        R +
          "«Bjella ligg bak vedkassa hos Julius. For trangt for hender og ugler. Men ikkje for nåkka på ei snor, med nåkka i enden som bjella heng sæ fast på.»",
        R +
          "«Magneten på skapet ved taletrakten, og den røde hyssingen rundt brevbunken. I lag blir det ei fiskestang.»",
        R +
          "«Kombiner magneten og hyssingen, og bruk fiskestanga på vedkassa.»",
      ],
    },
    {
      id: "sprekk",
      ferdig: "snoere_fram",
      maal: "Få snøret løs fra kubbene i sprekken.",
      kjent: { hvis: "snoere_nede" },
      tips: [
        R +
          "«Snora sitt fast mellom kubban. Sprekken går i sikksakk. BRUK sprekken bak vedkassa og vipp på kubban.»",
        R +
          "«Start øverst ved S. Hver kubbe har to åpninga. Vipp dem te åpninga peke mot neste kubbe, heilt ned te M.»",
        R +
          "«Fra S rett ned, så te høyre, så ned gjennom den rette kubben, og det nederste hjørnet snur te høyre inn på M. De to andre kubban e bare i veien.»",
      ],
    },
    {
      id: "bjelle",
      ferdig: "bjelle_montert",
      maal: "Heng lykkebjella på sleden innenfor porten.",
      kjent: { hvis: "snoere_fram" },
      tips: [
        R +
          "«Magneten har tak i bjella. Dra ho opp, og tenk på kor ho ska henge. Winter sa det. Æ sa det. Sleden sa det nesten.»",
        R + "«BRUK vedkassa for å dra opp bjella. Så ned te porten.»",
        R + "«Bruk lykkebjella på sleden innenfor porten.»",
      ],
    },
    {
      id: "talg",
      ferdig: "tok_talgstump",
      maal: "Lista, punkt 3: Få fett til porthengslet. Lanterna ved porten brenner talg.",
      kjent: {},
      tips: [
        R +
          "«Porten hyle. Hengslet treng fett. Ka e det som brenn i lanternan ved porten? Talg. Fett. Det renn jo nedover.»",
        R +
          "«Lanterna e lukka med hasp. Winter passe haspen. Spør han pent. Han e mild i år, han har bare to runda skjerf.»",
        R +
          "«SNAKK med Winter og spør om talg fra lanterna. Så BRUK lanterna te venstre og ta en stump.»",
      ],
    },
    {
      id: "port",
      ferdig: "port_smurt",
      maal: "Smør hengslet på høyre portfløy.",
      kjent: { hvis: "tok_talgstump" },
      tips: [
        R + "«Talg i lomma, hengsel som hyle. Dokker veit ka som skjer no.»",
        R + "«Høyre portfløy. Hengslet.»",
        R + "«Bruk talgstumpen på hengslet på høyre portfløy.»",
      ],
    },
    {
      id: "liste",
      ferdig: "klar_til_stempel",
      maal: "Få Winter til å krysse av hele lista.",
      kjent: {
        alle: [
          { hvis: "briller_levert" },
          { hvis: "bjelle_montert" },
          { hvis: "port_smurt" },
        ],
      },
      tips: [
        R + "«Alt e gjort? Da må nån krysse av. Han med lista og to blyanta.»",
        R +
          "«SNAKK med Winter og sei at alt på lista e gjort. Han sjekke alle tre.»",
        R + "«Trykk på Winter og velg «Alt på lista er gjort. Sjekk!».»",
      ],
    },
    {
      id: "stempel",
      ferdig: "k4_ferdig",
      maal: "Still hjulene på skriveplata og stemple avgangen.",
      tips: [
        R +
          "«Tre felt på skjemaet, tre hjul på blokka. Les felta. Ordet som mangle i hvert felt, e ordet som ska stå på hjulet.»",
        R +
          "«Snill-lista blir LEST. Bjella HENG. Porten e SMURT. I den rekkefølgen.»",
        R +
          "«BRUK skriveplata ved Winter og still hjulan på LEST, HENGT og SMURT.»",
      ],
    },
  ],
};
