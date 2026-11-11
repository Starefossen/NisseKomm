/**
 * Kapittel 2: «Antenna i permafrost» (dag 10). The turning gear at the tarn
 * antenna has frozen because Rudolf chewed through the heater cable, so the
 * picture to Landås stutters. Written for Håkon (9) and Kristian (12): the tin
 * box is heated on the tubes and carried in the oven glove, and it has to be
 * reheated for the frozen water cup; the hand warmer is a red herring. Side
 * story only: ordinary frost and a bored reindeer, nothing from the main story.
 * Rampenissen speaks nordlandsk (docs/manus/rampenissen-radio-2026.md
 * «Skrivemåte»), everyone else bokmål.
 *
 * Images: reuses feed/antenne-tarn.png and feed/iq-verksted.png.
 */
import type { Kapittel } from "./motor";

const R = "Rampenissen: ";

export const KAPITTEL_2: Kapittel = {
  n: 2,
  tittel: "Antenna i permafrost",
  dag: 10,
  klar: true,
  start: "tjernet",
  slutt: "k2_ferdig",
  intro: [
    R +
      "«Psst, dokker! Det e kaldt, og bildet fra Snøfall HAKKE. Knerten sitt ute ved tjernet, og æ ser bare halve ugla. Den bakerste halvdelen. Det e ikkje den beste.»",
    R +
      "«Antenna ved tjernet har frøse fast. Og veit dokker kem som står og TYGG på kabelen? Rudolf. Sjølvaste Rudolf, han med nesa. Han tygg på alt når han kjede sæ. I fjor åt han ei dørmatte og halve Winter sin skriveplate.»",
    R +
      "«Vi må få Rudolf vekk, tine antenna og peile ho mot Landås igjen. IQ sitt bak døra si som vanlig og roper. TIPS-knappen e fortsatt mæ, men dokker treng den sikkert ikkje. Sikkert.»",
  ],
  utro:
    R +
    "«Antenna peke mot Landås, bildet e skarpt, og Rudolf tygg på knekkebrød i staden for kabel. Dokker e gode! IQ sei han ska lage ei egen hylle te knekkebrødet, med lås. Rudolf har allereie sett på låsen. Neste gang treng æ hjelp med nåkka ... mørkt. Æ sei ikkje meir. Over og ut!»",
  gjenstander: {
    noekkel: {
      id: "noekkel",
      navn: "Hyttenøkkel",
      ikon: "key",
      se: "En liten jernnøkkel med en lapp: «HYTTA. LEGG TILBAKE. – IQ». Lappen er våt av snø, og noen har skrevet «NEI» under med reinsdyrhov. Det kan man ikke, men det står der.",
    },
    blikkboks: {
      id: "blikkboks",
      navn: "Blikkboks",
      ikon: "box",
      se: "En tung blikkboks full av gamle skruer. Iskald. På lokket står det «SKRUER (DIVERSE)», og under har noen skrevet «OG ÉN MUTTER». Mutteren er ikke merket. Den skal finnes.",
    },
    grytevott: {
      id: "grytevott",
      navn: "Grytevott",
      ikon: "hand",
      se: "En rutete grytevott med et brennmerke formet som et radiorør. Nissemor har sydd «IQ» på kanten, så den finner veien hjem. Det har den ikke gjort.",
    },
    boks_i_vott: {
      id: "boks_i_vott",
      navn: "Blikkboks i grytevott",
      ikon: "box",
      se: "Blikkboksen, holdt med grytevotten. Kald boks, varm hånd. Nå kan du sette den på noe varmt uten å angre.",
    },
    varmboks: {
      id: "varmboks",
      navn: "Glovarm blikkboks",
      ikon: "fire",
      se: "Blikkboksen ryker. Skruene inni klirrer av varme. Du holder den med grytevotten og er glad for det. Den holder seg varm akkurat lenge nok til én ting.",
    },
    knekkebroed: {
      id: "knekkebroed",
      navn: "Knekkebrød",
      ikon: "cake",
      se: "To skiver knekkebrød fra IQs nødrasjon. Tørre nok til å slukke en brann. Rudolf har sett på dem før og valgt kabel.",
    },
    sirup: {
      id: "sirup",
      navn: "Sirupsflaske",
      ikon: "potion",
      se: "Ei flaske mørk sirup. Lapp: «TIL VAFLER. IKKE TIL EKSPERIMENT. – NISSEMOR». Noen har tegnet et vaffelhjerte under. Noen andre har tegnet et reinsdyr som spiser vaffelhjertet.",
    },
    sirupbroed: {
      id: "sirupbroed",
      navn: "Knekkebrød med sirup",
      ikon: "cake",
      se: "Knekkebrød med et tykt lag sirup. Det drypper. Det lukter så godt at Knerten blunker to ganger og Rampenissen blunker tre.",
    },
    magnetnaal: {
      id: "magnetnaal",
      navn: "Magnetnål",
      ikon: "target",
      se: "Ei tynn nål stukket gjennom en kork. Den ene enden er malt rød. Legger du den i vann, snur den rød enden mot nord. I is snur den ingenting. Is er ikke vann, uansett hva isen selv mener.",
    },
    haandvarmer: {
      id: "haandvarmer",
      navn: "IQs håndvarmer",
      ikon: "heart",
      se: "Ei lita pose med lappen «RIST FOR VARME». Du rister. Den blir lunken. Det er alt den har å by på. Den har vært brukt. Mange ganger.",
    },
  },
  kombinasjoner: [
    {
      a: "sirup",
      b: "knekkebroed",
      gir: "sirupbroed",
      tekst:
        "Du heller sirup over knekkebrødet til det renner over kanten. " +
        R +
        "«Det der hadde æ spist sjøl. Æ hadde spist kabelen òg, med nok sirup på. Men greit. Rudolf først.»",
    },
    {
      a: "blikkboks",
      b: "grytevott",
      gir: "boks_i_vott",
      tekst:
        "Du tar votten på og griper boksen. Kald boks, varm hånd. " +
        R +
        "«No kan den bli så varm den vil. Det e votten som tar støyten. Takk, Nissemor.»",
    },
  ],
  scener: [
    {
      id: "tjernet",
      navn: "Antenna ved tjernet",
      bilde: "feed/antenne-tarn.png",
      utganger: [{ til: "verksted", navn: "Fly til verkstedet" }],
      hotspots: [
        {
          id: "himmelen",
          navn: "Himmelen",
          rect: { x: 0, y: 0, w: 44, h: 30 },
          smart: "se",
          se: "Grønt lys bølger over fjella. Stjernene står tett. Én av dem er nordstjerna, og du aner ikke hvilken. Det gjør ikke Knerten heller. Hun er ei ugle, ikke et kart.",
        },
        {
          id: "fjella",
          navn: "Fjella",
          rect: { x: 56, y: 16, w: 44, h: 14 },
          smart: "se",
          se: "Lave fjell med snø helt ned. Et sted bak dem ligger Nordtoppen. Et sted langt bak dem igjen ligger Landås, en sofa, og en nisse som venter på bedre bilde og har spist opp ventesnacksen.",
        },
        {
          id: "lampa",
          navn: "Lampa på toppen",
          rect: { x: 46, y: 6, w: 8, h: 8 },
          smart: "se",
          se: "Ei rød lampe på toppen av masta. Den blinker. IQ sier det er så flyene ser antenna. Rampenissen sier det er så Julius finner hjem. Rudolf tror det er en veldig høy nese.",
        },
        {
          id: "peileskiva",
          navn: "Peileskiva på masta",
          rect: { x: 44, y: 30, w: 12, h: 26 },
          smart: "bruk",
          se: [
            {
              hvis: "k2_ferdig",
              tekst:
                "Skiva står på L. Antenna peker rett mot Landås. Nåla i koppen snurrer fornøyd rundt seg selv, som en hund som har funnet sofaen.",
            },
            {
              hvis: "kopp_tint",
              tekst:
                "Ei rund messingskive med en liten kopp i midten. Koppen har vann i nå, ekte, vått vann. IQ har risset inn en L et sted på kanten. Men hvilken vei er nord? Skiva har ingen anelse. Den er en skive.",
            },
            {
              hvis: "tannhjul_tint",
              tekst:
                "Ei rund messingskive med en liten kopp i midten. Koppen er full av is. IQ har risset inn en L et sted på kanten, og en N rett overfor. Nord skulle ha vært der N står. Det er det ikke. Skiva vet ikke hvor nord er, og isen hjelper ingen.",
            },
            {
              tekst:
                "Ei rund messingskive midt på masta, dekket av rim, med en liten kopp i midten. Den skal kunne snurre. Den snurrer ikke. Noe nede ved foten holder igjen.",
            },
          ],
          bruk: [
            {
              hvis: "k2_ferdig",
              tekst:
                "Ikke rør! Den står perfekt. " +
                R +
                "«IKKE RØR, sa æ! Æ høres ut som IQ. Det e det verste med heile dagen.»",
            },
            {
              hvis: "tannhjul_tint",
              tekst:
                "Du snurrer skiva. Rundt og rundt. Antenna følger med, og bildet hjemme hos Rampenissen går fra halv ugle til kvart ugle til ingen ugle. Hvor skal den stoppe? L-en står der, men nord kan være hvor som helst.",
            },
            {
              tekst:
                "Du drar i skiva. Den står bom fast. Noe nede ved foten av masta holder igjen, og det noe har en reinsdyr foran seg.",
            },
          ],
          bruker: [
            {
              item: "magnetnaal",
              hvis: "kopp_tint",
              uten: "k2_ferdig",
              flagg: "k2_ferdig",
              forbruker: true,
              tekst:
                "Du legger korken med nåla i vannkoppen. Den rød enden snur seg rolig mot nord. Knerten vrir skiva til N møter nåla, og antenna svinger sakte rundt og stopper på L. Lampa på toppen slutter å blinke og lyser jevnt. " +
                R +
                "«BILDET! Æ ser heile ugla! Æ ser FJÆRAN hennes! Æ ser at ho treng et bad!»",
            },
            {
              item: "magnetnaal",
              hvis: "tannhjul_tint",
              tekst:
                "Du legger korken oppå isen i koppen. Den ligger der. Den peker på Knerten. Knerten er ikke nord. " +
                R +
                "«Nåla må FLYTE, sa IQ. Is e ikkje vann. Det e vann som har gitt opp.»",
            },
            {
              item: "magnetnaal",
              tekst:
                "Du holder nåla mot skiva. Nåla vil mot nord. Skiva vil ingenting og rikker seg ikke. Noe holder den fast nede ved foten.",
            },
            {
              item: "varmboks",
              hvis: "tannhjul_tint",
              uten: "kopp_tint",
              flagg: "kopp_tint",
              gir: "boks_i_vott",
              forbruker: true,
              tekst:
                "Du holder den glovarme boksen inntil koppen. Isen synker sammen, blir grå, blir vann. Koppen er full av vann, og skiva snurrer lett, så vinden får ikke tak. Boksen er kald igjen. " +
                R +
                "«Vann! Ekte vann! No mangle vi bare nåkka som veit kor nord e.»",
            },
            {
              item: "varmboks",
              hvis: "kopp_tint",
              tekst:
                "Koppen har vann. Boksen er varm. Du har én varm ting til overs og ingenting å bruke den på. Det er en luksus.",
            },
            {
              item: "varmboks",
              gir: "boks_i_vott",
              forbruker: true,
              tekst:
                "Du holder den varme boksen mot koppen. Isen smelter ... og fryser til igjen før du har snudd deg. Skiva står fast, koppen står rett i vinden, og vinden vinner. Boksen er kald. " +
                R +
                "«Bortkasta! Så lenge skiva står fast, fryse koppen på nytt. Tannhjulet først, sjø.»",
            },
          ],
          feil: {
            sirupbroed:
              R +
              "«Ikkje gi antenna knekkebrød. Ho e ikkje sulten. Ho e frosse. Det e forskjell, sjøl om begge deler gjør mæ gretten.»",
            haandvarmer:
              "Du legger håndvarmeren oppå isen i koppen. Den er lunken. Isen er is. Etter et minutt er håndvarmeren også is.",
            boks_i_vott:
              "Kald boks mot frossen kopp. Nå er det to kalde ting som ser på hverandre.",
            knekkebroed:
              "Du legger knekkebrødet i koppen. Nå er det frossent knekkebrød. Det var ikke mulig å gjøre det tørrere, men kaldere gikk.",
          },
        },
        {
          id: "rudolf",
          navn: "Rudolf",
          rect: { x: 38, y: 56, w: 22, h: 22 },
          smart: "bruk",
          vis: { uten: "rudolf_flyttet" },
          se: "Rudolf står ved foten av masta med en svart kabel i munnen. Han tygger sakte og ser på deg med store, rolige øyne. Nesa lyser litt rødt hver gang han tygger. Bak ham skimter du et tannhjul dekket av is. Han står ikke i veien. Han ER veien.",
          bruk:
            "Du dytter Rudolf. Rudolf dytter tilbake. Rudolf vinner. " +
            R +
            "«Han veie like mykje som en sofa. Æ har prøvd. Æ har prøvd med sofaen òg, for å sammenligne.»",
          bruker: [
            {
              item: "sirupbroed",
              flagg: "rudolf_flyttet",
              forbruker: true,
              tekst:
                "Rudolf snuser. Rudolf slipper kabelen. Rudolf tar knekkebrødet så forsiktig at ikke en dråpe sirup søles, og rusler bort til buskene for å tygge i fred. " +
                R +
                "«HA! Sirup slår kabel. Skriv det ned, IQ. Skriv det på tavla, under tegninga av han.»",
            },
          ],
          feil: {
            knekkebroed:
              "Rudolf snuser på knekkebrødet, nyser, og tygger videre på kabelen. Tørt knekkebrød taper mot kabel. Det er ikke engang jevnt.",
            sirup:
              "Rudolf slikker på flaska med kabelen fortsatt i munnen. Han er flink til å gjøre to ting samtidig. " +
              R +
              "«Han vil ha nåkka å TYGGE på. Med sirup på. Han e enkel, men han har standarda.»",
            blikkboks:
              "Du rister boksen. Det klirrer. Rudolf hever et øyenbryn. Reinsdyr har ikke øyenbryn, men han hever det likevel.",
            boks_i_vott:
              "Du vifter med boks og vott. Rudolf tror det er en veldig stor sirupsflaske og blir skuffet på en stille måte.",
            varmboks:
              "Rudolf snuser på den varme boksen og tar ett skritt bakover. Ett. Så tygger han videre, et skritt lenger unna.",
            grytevott:
              "Du vifter med grytevotten. Rudolf tror du vinker, og nikker høflig tilbake. Han er oppdratt.",
            magnetnaal:
              "Du holder nåla opp. Den peker mot nord. Rudolf peker mot kabelen. Begge har rett på hver sin måte.",
            noekkel: "Rudolf har ikke bruk for nøkler. Rudolf går gjennom.",
            haandvarmer:
              "Du legger håndvarmeren på mulen hans. Han lukker øynene og nyter det. Han flytter seg ikke en millimeter. Nå har han kabel OG spa.",
          },
        },
        {
          id: "tannhjulet",
          navn: "Tannhjulet",
          rect: { x: 40, y: 58, w: 18, h: 18 },
          smart: "bruk",
          vis: { hvis: "rudolf_flyttet" },
          se: [
            {
              hvis: "tannhjul_tint",
              tekst:
                "Et stort tannhjul av messing, vått og blankt. Det er dette som snur antenna. Det venter bare på beskjed ovenfra.",
            },
            {
              tekst:
                "Et stort tannhjul ved foten av masta, støpt inn i en klump is. Fra isen stikker det ut en kabel med merker etter reinsdyrtenner. Det var varmekabelen. Nå er det bare kabel. Med smak av Rudolf.",
            },
          ],
          bruk: [
            {
              hvis: "tannhjul_tint",
              tekst:
                "Det snurrer lett. Nå er det skiva på masta som bestemmer.",
            },
            {
              tekst:
                "Knerten hakker på isen med nebbet. Isen vinner. " +
                R +
                "«Det der treng nåkka varmt. Og ikkje bare et sekund. Nåkka som HOLD på varmen.»",
            },
          ],
          bruker: [
            {
              item: "varmboks",
              uten: "tannhjul_tint",
              flagg: "tannhjul_tint",
              gir: "boks_i_vott",
              forbruker: true,
              tekst:
                "Du setter den glovarme boksen inntil isen. Det freser. Det drypper. Det renner. Etter en stund gir isen fra seg et lite KNAKK, og tannhjulet rykker til. Fritt! Boksen er kald igjen, men den gjorde jobben. " +
                R +
                "«Hørte dokker det? Det va lyden av IQ som blir stolt. Han høres ut som et tannhjul.»",
            },
            {
              item: "varmboks",
              tekst:
                "Tannhjulet er fritt. Boksen er varm. Du har én varm ting til overs og ingen is her.",
            },
          ],
          feil: {
            blikkboks:
              "Kald boks mot kald is. Det blir bare mer kaldt. " +
              R +
              "«Boksen må bli VARM først. Kor e det varmt hos IQ? Overalt der han har brent sæ.»",
            boks_i_vott:
              "Kald boks i varm vott mot kald is. Votten er den eneste som har det bra her.",
            grytevott:
              "Votten er varm på innsiden, ikke på utsiden. Som de fleste votter. Og de fleste nisser.",
            sirupbroed:
              "Du gnir sirup på isen. Nå er den både frossen og klissete. Rudolf titter opp fra buskene. Nei. Nei!",
            magnetnaal:
              "Nåla peker mot nord. Isen bryr seg ikke. Isen har aldri brydd seg.",
            haandvarmer:
              "Du legger håndvarmeren på isen. Lunken mot frossen. Det smelter en flekk på størrelse med et frimerke, og så gir posen opp. " +
              R +
              "«Varmt, ja. Men ikkje nok, og ikkje lenge nok. Vi treng nåkka TUNGT og varmt.»",
          },
        },
        {
          id: "busken",
          navn: "Buskene",
          rect: { x: 82, y: 40, w: 18, h: 40 },
          smart: "se",
          vis: { uten: "rudolf_flyttet" },
          se: "Noen nakne bjørkebusker med snø på greinene. Noen har tygget på de nederste greinene. Du har en mistenkt. Han står ti meter unna og tygger på bevis nummer to.",
        },
        {
          id: "rudolf2",
          navn: "Rudolf",
          rect: { x: 82, y: 40, w: 18, h: 40 },
          smart: "se",
          vis: { hvis: "rudolf_flyttet" },
          se: "Rudolf står mellom buskene og tygger knekkebrød med lukkede øyne. Nesa lyser rolig. Han er den lykkeligste reinen nord for Nordtoppen, og han vet det.",
          bruk: "Du klapper Rudolf på mulen. Han tygger videre. Han har det bra. Han har det bedre enn deg.",
        },
        {
          id: "tjernet",
          navn: "Tjernet",
          rect: { x: 10, y: 52, w: 28, h: 22 },
          smart: "se",
          se: "Tjernet er frosset blankt som en tallerken. Under isen går det en liten fisk fram og tilbake og lurer på hvor taket kom fra. Den har spurt de andre fiskene. De vet heller ikke.",
          bruk: "Knerten prøver isen med én fot. Den holder. Hun prøver med to. Den holder. Hun går tilbake på land. Ugler har et godt forhold til land.",
        },
        {
          id: "hytta",
          navn: "Hytta",
          rect: { x: 58, y: 56, w: 14, h: 20 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_blikkboks",
              tekst:
                "Ei lita hytte for antenna. Inni: en benk, ei lampe og en ledig plass der blikkboksen sto. Det er fortsatt noe smått på benken.",
            },
            {
              hvis: "hytta_aapen",
              tekst:
                "Døra står åpen. Inni: en benk, ei lampe som lyser gult, en tung blikkboks på benken, og noe smått ved siden av.",
            },
            {
              tekst:
                "Ei lita trehytte med ett vindu som lyser gult. Skilt på døra: «ANTENNEHYTTA. NØKKEL UNDER MATTA. IKKE SI DET TIL NOEN. – IQ». Det er ingen matte. Bare en snøhaug. Og skiltet sier det til alle.",
            },
          ],
          bruk: [
            {
              hvis: "tok_blikkboks",
              tekst: "Benken er nesten tom. Lampa lyser for en håndvarmer.",
            },
            {
              tekst:
                "Låst. Du drar i døra. Den sier «nei» på hyttespråk, altså ingenting.",
            },
          ],
          ta: {
            item: "blikkboks",
            hvis: "hytta_aapen",
            tekst:
              "Du løfter blikkboksen fra benken. Den er tung og iskald. Knerten må ta to tak og si et ord ugler ikke skal si.",
          },
          bruker: [
            {
              item: "noekkel",
              uten: "hytta_aapen",
              flagg: "hytta_aapen",
              forbruker: true,
              tekst:
                "Nøkkelen passer. Døra går opp med et knirk som høres ut som «endelig». Du legger nøkkelen pent på hylla innenfor, slik lappen sa. Du er den første som gjør det.",
            },
          ],
          feil: {
            sirupbroed:
              "Du smører sirup på døra. Nå er den låst OG klissete. Bra jobba. Rudolf har allerede merket det.",
            magnetnaal:
              "Nåla peker mot nord. Døra er fortsatt låst, men nå vet du hvilken vei den vender. Det hjelper ingen.",
            grytevott:
              "Du banker på med votten. Mykt. Ingen hører. Ingen bor her.",
          },
        },
        {
          id: "benken",
          navn: "Benken i hytta",
          rect: { x: 60, y: 66, w: 10, h: 8 },
          smart: "bruk",
          vis: { hvis: "hytta_aapen" },
          se: [
            {
              hvis: "tok_haandvarmer",
              tekst:
                "Benken, lampa og et tomt sted. Alt som var varmt, er tatt. Alt som var lunkent, også.",
            },
            {
              tekst:
                "Ved siden av der boksen står, ligger ei lita pose: «RIST FOR VARME». IQ har tydeligvis sittet her og frosset.",
            },
          ],
          ta: {
            item: "haandvarmer",
            tekst:
              "Du tar håndvarmeren. Du rister. Lunken. " +
              R +
              "«Varme! Nåkka varmt! ... Det e jo nesten ikkje varmt. Det e som en klem fra Winter.»",
          },
          bruk: "Benken er en benk. Den gjør benketing. Står stille, holder lampa med selskap.",
        },
        {
          id: "snoehaugen",
          navn: "Snøhaugen ved døra",
          rect: { x: 58, y: 76, w: 14, h: 10 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_noekkel",
              tekst:
                "En snøhaug med et nøkkelformet hull i. Mysteriet er løst. Det var aldri et mysterium.",
            },
            {
              tekst:
                "En liten snøhaug rett foran døra. Akkurat der ei dørmatte ville ligget, hvis noen hadde eid ei dørmatte. Noen eide ei. Rudolf åt den.",
            },
          ],
          ta: {
            item: "noekkel",
            tekst:
              "Knerten graver med begge føttene. Snø til alle kanter. Og der: en liten jernnøkkel med lapp. " +
              R +
              "«Under matta. Alle gjømme nøkla under matta. Æ gjømme min i ei klementin. Æ spiste klementinen. Æ har ikkje nøkkel.»",
          },
          bruk: "Bare snø igjen. Og et hull. Og en veldig fornøyd ugle.",
        },
        {
          id: "kablene",
          navn: "Kablene",
          rect: { x: 28, y: 80, w: 30, h: 18 },
          smart: "se",
          se: "Tykke svarte kabler slynger seg over snøen fra hytta til masta. Én av dem har merker. Bittemerker. Store. Med mellomrom som passer akkurat til ei reinsdyrkjeft, hvis noen skulle lure.",
          bruk: "Du drar i en kabel. Inne i hytta sier noe «pling». Du slipper kabelen. Det sier «pling» igjen. Det var ikke deg.",
        },
      ],
    },
    {
      id: "verksted",
      navn: "IQs verksted",
      bilde: "feed/iq-verksted.png",
      utganger: [{ til: "tjernet", navn: "Fly ut til tjernet" }],
      hotspots: [
        {
          id: "sikringsskapet",
          navn: "Sikringsskapet",
          rect: { x: 0, y: 22, w: 20, h: 40 },
          smart: "se",
          se: "Alle målerne står på midten. Lappen «ALDRI MER KAFFETRAKTER» henger der fortsatt. Noen har lagt til en ny lapp under: «ELLER VAFFELJERN». Lista blir lengre hvert år.",
          bruk: "Du lar skapet være. Du har lært. Du lærte det sist, og du lærte det av IQ sine øyenbryn.",
        },
        {
          id: "tavla",
          navn: "Tavla",
          rect: { x: 22, y: 25, w: 13, h: 26 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_magnetnaal",
              tekst:
                "På tavla: en tegning av Rudolf med kabel i munnen og teksten «RUDOLF + KABEL = NEI». Tegningen ligger på benken nå som nåla er borte. Rudolf ser skyldig ut også liggende.",
            },
            {
              tekst:
                "På tavla: en tegning av Rudolf med kabel i munnen og teksten «RUDOLF + KABEL = NEI». Tegningen holdes oppe av en kork med ei nål gjennom. Nålas røde ende peker mot vinduet. Den peker alltid mot vinduet. Også når IQ snur tavla.",
            },
          ],
          ta: {
            item: "magnetnaal",
            tekst:
              "Du tar korken med nåla. Tegningen av Rudolf seiler ned på gulvet. Du legger den pent på benken, med snuten ned. Han trenger ikke se på.",
          },
          bruk: "Tegningen av Rudolf ligger på benken. Han ser skyldig ut. Han er skyldig.",
        },
        {
          id: "oscilloskopet",
          navn: "Oscilloskopet",
          rect: { x: 20, y: 58, w: 9, h: 18 },
          smart: "se",
          se: "Den grønne streken hakker i dag. Hopp, hopp, pause, hopp. Det ser ut som noen som tygger. Det ER noen som tygger. IQ har koblet det til Rudolf.",
          bruk: "Du vrir på knotten. Nå ser det ut som noen som tygger fortere. Ute ved tjernet tygger Rudolf fortere. Det er sikkert tilfeldig.",
        },
        {
          id: "radioroerene",
          navn: "Radiorørene",
          rect: { x: 7, y: 70, w: 13, h: 16 },
          smart: "bruk",
          se: "Tre glødende rør i rødt, grønt og oransje. Varmen fra dem kjennes helt bort til døra. IQ bruker dem til å tørke sokker. Det er forbudt. Han gjør det likevel. Sokkene har brennmerker formet som radiorør.",
          bruk:
            "Varmt! Du trekker fingeren til deg. " +
            R +
            "«Ja. Sånn lærte æ det òg. To ganga. Tredje gangen va med vilje, for å sjekke.»",
          bruker: [
            {
              item: "boks_i_vott",
              gir: "varmboks",
              forbruker: true,
              tekst:
                "Du setter boksen oppå de tre rørene og holder den der med votten. Rørene dupper under vekta, men holder. Det tar ikke lang tid før boksen begynner å ryke. Du løfter den av. Glovarm, tung, og trygg i votten. " +
                R +
                "«No e den varm. Veldig varm. Fly fort, før den blir fornuftig igjen.»",
            },
            {
              item: "varmboks",
              tekst:
                "Den er allerede glovarm. Varmere blir den ikke uten å bli noe annet enn en boks.",
            },
          ],
          feil: {
            blikkboks:
              "Du setter boksen på rørene. Ti sekunder, så ryker den. Du griper den. AU! Du slipper den på benken og blåser på fingrene. Når du er ferdig å blåse, er boksen kald igjen. " +
              R +
              "«IKKJE med fingran! Ka har IQ på handa når han tar i varme ting? Når han HUSKE det?»",
            grytevott:
              "Du klapper rørene med votten. De summer fornøyd. Votten blir varm. Votten er ikke tung nok til å tine noe som helst.",
            sirupbroed:
              "Du holder knekkebrødet over rørene. Sirupen bobler. Det lukter brent jul. Du tar det vekk.",
            knekkebroed:
              "Du rister knekkebrødet over rørene. Nå er det enda tørrere. Det var ikke mulig, men her er vi.",
            sirup:
              "Du holder flaska over rørene. " +
              R +
              "«NEI. Sirup på radiorør e sånn IQ mista øyebrynan i 2019. Dem kom tilbake i 2021. Litt skjeve.»",
            magnetnaal:
              "Du holder nåla over rørene. Den snurrer forvirret rundt. Varme og magneter er ikke venner. De er knapt bekjente.",
            haandvarmer:
              "Du legger håndvarmeren på rørene. Den blir varm! Du tar den. Den er lunken igjen før du er ved døra. Posen holder ikke på noe som helst. Den er som Rampenissen med en hemmelighet.",
          },
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 54, y: 18, w: 10, h: 28 },
          smart: "se",
          se: "Rim på rutene. Smilefjeset fra sist er der fortsatt. Noen har tegnet en rein ved siden av. Reinen har kabel i munnen. Noen har tegnet et kryss over reinen. Reinen har tegnet et kryss over krysset. Trolig.",
        },
        {
          id: "skiltet",
          navn: "Skiltet",
          rect: { x: 66, y: 7, w: 11, h: 12 },
          smart: "se",
          se: "«IKKE RØR (GJELDER OGSÅ RAMPENISSEN)». Under henger en ny lapp: «GJELDER OGSÅ RUDOLF». Lappen har bittemerker. Lappen om bittemerkene har også bittemerker.",
        },
        {
          id: "doera",
          navn: "IQs dør",
          rect: { x: 66, y: 20, w: 14, h: 44 },
          smart: "snakk",
          snakk: "iq",
          se: "IQs dør. Innenfra høres klirring, og en mann som sier «nei, nei, NEI» til noe som sier «pling». Det er uklart hvem som vinner.",
          bruk: "Låst. Lappen «BANK TRE GANGER. IKKE FIRE.» henger der fortsatt. Bulken nederst har fått selskap av en bulk til. Den nye er formet som en hov.",
        },
        {
          id: "kaffekoppen",
          navn: "Kaffekoppen",
          rect: { x: 45, y: 74, w: 9, h: 13 },
          smart: "se",
          se: "En ny kaffekopp på benken. Denne er tom. Helt tom. IQ har vært tørst, eller Rampenissen har vært innom. Begge deler er mulig. Begge deler er sannsynlig.",
          bruk:
            "Du løfter koppen. Tom og kald. " +
            R +
            "«Tom kopp hjelpe ingen. Æ veit, æ har prøvd. Det va æ som tømte den. Det e ikkje relevant.»",
        },
        {
          id: "tegningen",
          navn: "Tegningen",
          rect: { x: 36, y: 86, w: 17, h: 14 },
          smart: "se",
          se: "Sledetegningen med pepperkakegass-traktene. Julius' røde spørsmålstegn og IQs utropstegn har fått selskap av et tredje tegn. Det er et bittemerke. Diskusjonen har fått en ny deltaker.",
        },
        {
          id: "sidebordet",
          navn: "Sidebordet",
          rect: { x: 78, y: 50, w: 14, h: 22 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_knekkebroed",
              tekst:
                "Lampa, loddebolten og en skuff som står åpen. Tom. Nødrasjonen er brukt opp. I en nødsituasjon, så det er greit. Det står i skuffen.",
            },
            {
              tekst:
                "Et lite bord med skrivebordslampe og en skuff. På skuffen står det «NØDRASJON. BARE I NØD.» Noen har lagt til «RUDOLF TELLER IKKE SOM NØD». Noen andre har lagt til «JO».",
            },
          ],
          ta: {
            item: "knekkebroed",
            tekst:
              "Du åpner skuffen. To skiver knekkebrød og en lapp: «HVIS DU LESER DETTE ER DET NØD». Du tar knekkebrødet. Det er nød. Det er alltid nød når Rudolf er med.",
          },
          bruk: "Skuffen er tom. Lappen ligger igjen og ser alvorlig ut. Den er flink til det.",
        },
        {
          id: "krakken",
          navn: "Krakken",
          rect: { x: 67, y: 65, w: 10, h: 15 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_grytevott",
              tekst:
                "IQs krakk med tre bein og boka «Balanse for viderekomne» under det fjerde. Kroken under setet er tom. Krakken står like skjevt som før.",
            },
            {
              tekst:
                "IQs krakk med tre bein og boka «Balanse for viderekomne» under det fjerde. Under setet henger noe rutete på en krok. Det er gjemt. Dårlig.",
            },
          ],
          ta: {
            item: "grytevott",
            tekst:
              "Du tar grytevotten fra kroken under krakken. Den lukter brent sokk. " +
              R +
              "«Nissemor sin! Ho har leita etter den sia i fjor. IQ sa det va Rudolf. Alle sei det e Rudolf. Som regel e det Rudolf.»",
          },
          bruk: "Kroken under krakken er tom. Krakken står like skjevt. Boka hjelper ikke. Den er ikke åpnet.",
        },
        {
          id: "hyllene",
          navn: "Hyllene",
          rect: { x: 40, y: 8, w: 16, h: 16 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_sirup",
              tekst:
                "Syltetøyglass med skruer, tannhjul og ett med syltetøy («MITT. – IQ»). Og en ledig plass med en klissete ring der sirupsflaska sto. Nissemor kommer til å finne ringen. Nissemor finner alt.",
            },
            {
              tekst:
                "Syltetøyglass med skruer, tannhjul og ett med syltetøy («MITT. – IQ»). Innerst står ei flaske sirup som ser ut som den har gjemt seg. Den har gjemt seg dårlig. Som alt annet her.",
            },
          ],
          ta: {
            item: "sirup",
            tekst:
              "Du tar sirupsflaska. Lappen sier «TIL VAFLER». Dette er ikke vafler. Dette er viktigere. Si det til Nissemor, ikke til oss.",
          },
          bruk: "Syltetøyet får stå. Det har navn på seg, og eieren har kamera på det. Dere husker.",
        },
      ],
    },
  ],
  dialoger: {
    iq: {
      taler: "IQ (gjennom døra)",
      portrett: "iq",
      start: "start",
      noder: {
        start: {
          tekst: [
            {
              hvis: "k2_ferdig",
              tekst:
                "«Bildet er skarpt! Jeg ser det på måleren min! Hvem enn dere er: dere er forfremmet til assistenter. Ulønnet. Det er den høyeste stillingen jeg har.»",
            },
            {
              hvis: "iq_snakket",
              tekst:
                "«Dere igjen! Rudolf har ikke kommet hit og bedt om unnskyldning, hvis det er det dere lurer på. Han sendte en hov. Gjennom døra.»",
            },
            {
              tekst:
                "«Hvem der? Hvis det er Rudolf: NEI, du får ikke mer sirup, og du får ikke tygge på noe som helst, og du får ikke komme inn, du er for bred!»",
            },
          ],
          valg: [
            {
              tekst: "Det er oss! Antenna ved tjernet står fast.",
              neste: "antenne",
              flagg: "iq_snakket",
            },
            {
              tekst: "Hvordan får vi Rudolf vekk fra kabelen?",
              hvis: "iq_snakket",
              neste: "rudolf",
            },
            {
              tekst: "Hva varmer vi tannhjulet med?",
              hvis: "iq_snakket",
              neste: "boks",
            },
            {
              tekst: "Hvilken vei er Landås?",
              hvis: "iq_snakket",
              neste: "landaas",
            },
            {
              tekst: "Hva sier «pling» der inne?",
              neste: "pling",
            },
            { tekst: "Vi går igjen." },
          ],
        },
        antenne: {
          tekst:
            "«Jeg VET det! Tannhjulet som snur antenna er frosset fast. Det hadde en varmekabel. Hadde. Rudolf tygget den i to i natt fordi han kjedet seg. Nå må tannhjulet tines med noe varmt. Ikke en kaffekopp, den er kald før du er ute av døra. Noe tungt. Metall. Som holder på varmen.»",
          rampenissen:
            "«Nåkka tungt og varmt. Og nåkka å hold det med, for æ kjenne IQ sine varme ting. Dem e varme på en personlig måte.»",
          valg: [
            { tekst: "Hvordan får vi Rudolf vekk?", neste: "rudolf" },
            { tekst: "Hva varmer vi tannhjulet med?", neste: "boks" },
            { tekst: "Takk, IQ!" },
          ],
        },
        boks: {
          tekst:
            "«I antennehytta står en blikkboks med skruer. Tung som synd. Varm den på noe her inne som er varmt nok. Det er mye her inne som er varmt nok. Det er problemet med her inne. Og nøkkelen til hytta ligger der nøkler ligger. Les skiltet. Ikke si det til noen.»",
          rampenissen: "«Det står på skiltet. Han har skrive det på SKILTET.»",
          valg: [
            { tekst: "Og hvordan holder vi en glovarm boks?", neste: "vott" },
            { tekst: "Skjønner!" },
          ],
        },
        vott: {
          tekst:
            "«Med votten. Nissemors grytevott. Den er ikke her. Jeg har ikke tatt den. Hvis dere finner den under noe jeg sitter på, så var det Rudolf.»",
          rampenissen: "«Æ sei det te Nissemor. Æ sei det med glede.»",
          valg: [{ tekst: "Under noe du sitter på. Notert." }],
        },
        rudolf: {
          tekst:
            "«Rudolf går ALDRI fra noe han tygger på. Aldri. Med mindre han får noe bedre å tygge på. Og Rudolf mener at alt smaker bedre med sirup. Det er hans eneste mening om noe. Han har holdt på den i elleve år.»",
          rampenissen:
            "«Nåkka bedre enn kabel, med sirup på. Det meste e bedre enn kabel. Spør mæ ikkje kossen æ veit det.»",
          valg: [
            { tekst: "Har du sirup?", neste: "sirup" },
            { tekst: "Takk!" },
          ],
        },
        sirup: {
          tekst:
            "«Nissemor har gjemt ei flaske et sted her inne. Hun tror jeg ikke vet hvor. Jeg vet hvor. Jeg vet ikke hvor dere skal smøre den, men jeg erklærer herved nødsituasjon, så alt merket NØD er åpent.»",
          valg: [{ tekst: "Herved notert." }],
        },
        landaas: {
          tekst:
            "«Jeg har risset en L i peileskiva på masta, der Landås ligger, og en N for nord. Men skiva vet ikke selv hvor nord er. Det gjør nåla på tavla mi. Den må flyte i vann. Flyte. I vann. Ikke ligge på is, is er ikke vann, jeg har hatt denne diskusjonen før.»",
          rampenissen:
            "«Nål, vann, nord, L. Æ skreiv det på handa. Æ skreiv det på feil hand, men det står der.»",
          valg: [{ tekst: "Nål, vann, nord, L. Skjønner." }],
        },
        pling: {
          tekst:
            "«Det er varmemåleren for tannhjulet. Den sier pling når tannhjulet er kaldt. Den har sagt pling siden klokka tre i natt. Jeg har ikke sovet. Jeg hører pling når det er stille. Det er aldri stille. Pling.»",
          rampenissen: "«Pling.»",
          valg: [{ tekst: "Vi skal få den til å slutte." }],
        },
      },
    },
  },
  gaater: [
    {
      id: "hytta",
      ferdig: "hytta_aapen",
      tips: [
        R +
          "«Noe tungt og varmt, sa IQ. Boksen hans ligg i hytta ved antenna. Men døra e låst, og skiltet på døra sei meir enn det burde.»",
        R +
          "«Les skiltet på hyttedøra. IQ gjømme nøkla der alle gjømme nøkla. Det e ingen matte, men det e nåkka der matta skulle vore.»",
        R +
          "«BRUK snøhaugen foran hyttedøra. Nøkla ligg under. Bruk den på døra, og ta boksen inni.»",
      ],
    },
    {
      id: "rudolf",
      ferdig: "rudolf_flyttet",
      tips: [
        R +
          "«Rudolf går ikkje fra kabelen frivillig. Han treng nåkka BEDRE å tygge på. Alt e bedre med sirup, sei IQ. Rudolf e enig.»",
        R +
          "«Sirup har Nissemor gjømt i verkstedet, og nøden ligg i en skuff. Saman blir det nåkka Rudolf vil ha.»",
        R +
          "«Ta sirupen fra hylla og knekkebrødet fra skuffen i sidebordet. Trykk på sirupen i lomma, så på knekkebrødet. Gi det te Rudolf.»",
      ],
    },
    {
      id: "tannhjul",
      ferdig: "tannhjul_tint",
      tips: [
        R +
          "«Tannhjulet nederst på masta e frosse. Det treng nåkka tungt og varmt inntil sæ. Lenge. Håndvarmeren e ikkje nok, den e lunken som en unnskyldning.»",
        R +
          "«Blikkboksen kan varmes på radiorøran hos IQ. Men ikkje med fingran. Nissemor sin grytevott heng under krakken te IQ. Boks og vott saman først.»",
        R +
          "«Kombiner boksen og grytevotten i lomma. Bruk dem på radiorøran. Fly te tjernet og hold den varme boksen mot tannhjulet.»",
      ],
    },
    {
      id: "kopp",
      ferdig: "kopp_tint",
      tips: [
        R +
          "«Nåla ska flyte i vann, sei IQ. Koppen på skiva e full av is. Is e ikkje vann, same ka isen sei.»",
        R +
          "«Vi har allereie nåkka som tine is. Boksen e kald igjen, men røran hos IQ e ikkje det.»",
        R +
          "«Varm boksen på radiorøran en gang te, og hold den mot koppen på peileskiva.»",
      ],
    },
    {
      id: "peiling",
      ferdig: "k2_ferdig",
      tips: [
        R +
          "«Antenna snurre, koppen har vann, og IQ har rissa en L i skiva. No mangle bare nåkka som veit kor nord e.»",
        R +
          "«Nåla på tavla hos IQ peke alltid mot nord. Ta ho med, med kork og alt.»",
        R +
          "«Ta magnetnåla fra tavla og bruk den på peileskiva på masta. Så finn antenna L sjøl.»",
      ],
    },
  ],
};
