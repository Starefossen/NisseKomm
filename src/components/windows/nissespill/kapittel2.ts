/**
 * Kapittel 2: «Antenna i permafrost» (dag 10). The turning gear at the tarn
 * antenna has frozen because Rudolf chewed through the heater cable, so the
 * picture to Landås stutters. Side story only: ordinary frost and a bored
 * reindeer, nothing from the main story. Rampenissen speaks nordlandsk
 * (docs/manus/rampenissen-radio-2026.md «Skrivemåte»), everyone else bokmål.
 *
 * Images: reuses feed/antenne-tarn.png and feed/iq-verksted.png. Optional new
 * still (not required, hotspots work on the current one):
 * - feed/antenne-tarn-rudolf.png: same tarn at dusk, a reindeer standing at the
 *   mast foot with a black cable in its mouth, hut door ajar.
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
      "«Psst, dokker! Rampenissen her. Det e kaldt, og bildet fra Snøfall HAKKE. Knerten sitt ute ved tjernet, og æ ser bare halve ugla.»",
    R +
      "«Antenna ved tjernet har frøse fast. Og veit dokker kem som står og TYGG på kabelen? Rudolf. Sjølvaste Rudolf. Han tygg på alt når han kjede sæ.»",
    R +
      "«Vi må få Rudolf vekk, tine antenna og peile ho mot Landås igjen. IQ sitt bak døra si som vanlig. Spør han. Og TIPS-knappen e fortsatt mæ.»",
  ],
  utro:
    R +
    "«Antenna peke mot Landås, bildet e skarpt, og Rudolf tygg på knekkebrød i staden for kabel. Dokker e gode! IQ sei han ska lage ei egen hylle te knekkebrødet. Neste gang treng æ hjelp med nåkka ... mørkt. Æ sei ikkje meir. Over og ut!»",
  gjenstander: {
    noekkel: {
      id: "noekkel",
      navn: "Hyttenøkkel",
      ikon: "key",
      se: "En liten jernnøkkel med en lapp: «HYTTA. LEGG TILBAKE. – IQ». Lappen er våt av snø.",
    },
    blikkboks: {
      id: "blikkboks",
      navn: "Blikkboks",
      ikon: "box",
      se: "En tung blikkboks full av gamle skruer. Iskald. På lokket står det «SKRUER (DIVERSE)», og under har noen skrevet «OG ÉN MUTTER».",
    },
    varmboks: {
      id: "varmboks",
      navn: "Glovarm blikkboks",
      ikon: "fire",
      se: "Blikkboksen, men nå ryker den. Skruene inni klirrer av varme. Du holder den med grytevotten og er glad for det.",
    },
    grytevott: {
      id: "grytevott",
      navn: "Grytevott",
      ikon: "hand",
      se: "En rutete grytevott med et brennmerke formet som et radiorør. Nissemor har sydd «IQ» på kanten, så den finner veien hjem.",
    },
    knekkebroed: {
      id: "knekkebroed",
      navn: "Knekkebrød",
      ikon: "cake",
      se: "To skiver knekkebrød fra IQs nødrasjon. Tørre nok til å slukke en brann.",
    },
    sirup: {
      id: "sirup",
      navn: "Sirupsflaske",
      ikon: "potion",
      se: "Ei flaske mørk sirup. Lapp: «TIL VAFLER. IKKE TIL EKSPERIMENT. – NISSEMOR». Noen har tegnet et vaffelhjerte under.",
    },
    sirupbroed: {
      id: "sirupbroed",
      navn: "Knekkebrød med sirup",
      ikon: "cake",
      se: "Knekkebrød med et tykt lag sirup. Det drypper. Det lukter så godt at Knerten blunker to ganger.",
    },
    magnetnaal: {
      id: "magnetnaal",
      navn: "Magnetnål",
      ikon: "target",
      se: "Ei tynn nål stukket gjennom en kork. Den ene enden er malt rød. Legg den i vann, og den rød enden snur seg mot nord. Alltid. Selv når IQ sier «ikke nå».",
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
        "«Det der hadde æ spist sjøl. Men greit. Rudolf først.»",
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
          se: "Grønt lys bølger over fjella. Stjernene står tett. Det snør bitte litt, som om himmelen bare øver.",
        },
        {
          id: "fjella",
          navn: "Fjella",
          rect: { x: 56, y: 16, w: 44, h: 14 },
          smart: "se",
          se: "Lave fjell med snø helt ned. Et sted bak dem ligger Nordtoppen. Et sted langt bak dem igjen ligger Landås, og en sofa, og en nisse som venter på bedre bilde.",
        },
        {
          id: "lampa",
          navn: "Lampa på toppen",
          rect: { x: 46, y: 6, w: 8, h: 8 },
          smart: "se",
          se: "Ei rød lampe på toppen av masta. Den blinker. IQ sier det er så flyene ser antenna. Rampenissen sier det er så Julius finner hjem. Begge har rett.",
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
                "Skiva står på L. Antenna peker rett mot Landås. Nåla i koppen snurrer fornøyd rundt seg selv.",
            },
            {
              hvis: "tannhjul_tint",
              tekst:
                "Ei rund messingskive med en liten vannkopp i midten. IQ har risset inn en L et sted på kanten. Men hvilken vei er nord? Skiva har ingen anelse.",
            },
            {
              tekst:
                "Ei rund messingskive midt på masta, dekket av rim. Den skal kunne snurre. Den snurrer ikke.",
            },
          ],
          bruk: [
            {
              hvis: "k2_ferdig",
              tekst: "Ikke rør! Den står perfekt. " + R + "«IKKE RØR, sa æ!»",
            },
            {
              hvis: "tannhjul_tint",
              tekst:
                "Du snurrer skiva. Rundt og rundt. Antenna følger med. Men hvor skal den stoppe? L-en står der, men nord kan være hvor som helst.",
            },
            {
              tekst:
                "Du drar i skiva. Den står bom fast. Noe nede ved foten av masta holder igjen.",
            },
          ],
          bruker: [
            {
              item: "magnetnaal",
              hvis: "tannhjul_tint",
              uten: "k2_ferdig",
              flagg: "k2_ferdig",
              forbruker: true,
              tekst:
                "Du legger korken med nåla i vannkoppen. Den rød enden snur seg rolig mot nord. Knerten vrir skiva til N møter nåla, og antenna svinger sakte rundt og stopper på L. Lampa på toppen slutter å blinke og lyser jevnt. " +
                R +
                "«BILDET! Æ ser heile ugla! Æ ser FJÆRAN hennes!»",
            },
            {
              item: "magnetnaal",
              tekst:
                "Du holder nåla mot skiva. Nåla peker mot nord. Skiva peker mot ingenting og rikker seg ikke. Noe holder den fast nede ved foten.",
            },
          ],
          feil: {
            varmboks:
              "Du holder den varme boksen mot skiva. Rimet smelter litt, men skiva sitter like fast. Det er ikke her den henger.",
            sirupbroed:
              R +
              "«Ikkje gi antenna knekkebrød. Ho e ikkje sulten. Ho e frosse.»",
          },
        },
        {
          id: "rudolf",
          navn: "Rudolf",
          rect: { x: 38, y: 56, w: 22, h: 22 },
          smart: "bruk",
          vis: { uten: "rudolf_flyttet" },
          se: "Rudolf står ved foten av masta med en svart kabel i munnen. Han tygger sakte og ser på deg med store, rolige øyne. Nesa lyser litt rødt hver gang han tygger. Bak ham skimter du et tannhjul dekket av is.",
          bruk:
            "Du dytter Rudolf. Rudolf dytter tilbake. Rudolf vinner. " +
            R +
            "«Han veie like mykje som ein sofa. Æ har prøvd.»",
          bruker: [
            {
              item: "sirupbroed",
              flagg: "rudolf_flyttet",
              forbruker: true,
              tekst:
                "Rudolf snuser. Rudolf slipper kabelen. Rudolf tar knekkebrødet så forsiktig at ikke en dråpe sirup søles, og rusler bort til buskene for å tygge i fred. " +
                R +
                "«HA! Sirup slår kabel. Skriv det ned, IQ.»",
            },
          ],
          feil: {
            knekkebroed:
              "Rudolf snuser på knekkebrødet, nyser, og tygger videre på kabelen. Tørt knekkebrød taper mot kabel. Så vidt.",
            sirup:
              "Rudolf slikker på flaska med kabelen fortsatt i munnen. Han er flink til å gjøre to ting samtidig. " +
              R +
              "«Han vil ha nåkka å TYGGE på. Med sirup på.»",
            blikkboks:
              "Du rister boksen. Det klirrer. Rudolf hever et øyenbryn. Reinsdyr har ikke øyenbryn, men han hever det likevel.",
            varmboks:
              "Rudolf snuser på den varme boksen og tar ett skritt bakover. Ett. Så tygger han videre.",
            grytevott:
              "Du vifter med grytevotten. Rudolf tror du vinker, og nikker høflig tilbake.",
            magnetnaal:
              "Du holder nåla opp. Den peker mot nord. Rudolf peker mot kabelen.",
            noekkel: "Rudolf har ikke bruk for nøkler. Rudolf går gjennom.",
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
                "Et stort tannhjul av messing, vått og blankt. Det er dette som snur antenna. Det venter bare på beskjed.",
            },
            {
              tekst:
                "Et stort tannhjul ved foten av masta, støpt inn i en klump is. Fra isen stikker det ut en kabel med merker etter reinsdyrtenner. Det var varmekabelen. Nå er det bare kabel.",
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
                "«Det der treng nåkka varmt. Og ikkje bare et sekund. Lenge.»",
            },
          ],
          bruker: [
            {
              item: "varmboks",
              uten: "tannhjul_tint",
              flagg: "tannhjul_tint",
              forbruker: true,
              tekst:
                "Du setter den glovarme boksen inntil isen. Det freser. Det drypper. Det renner. Etter en stund gir isen fra seg et lite KNAKK, og tannhjulet rykker til. Fritt! Boksen er kald igjen, men den gjorde jobben. " +
                R +
                "«Hørte dokker det? Det va lyden av IQ som blir stolt.»",
            },
          ],
          feil: {
            blikkboks:
              "Kald boks mot kald is. Det blir bare mer kaldt. " +
              R +
              "«Boksen må bli VARM først. Kor e det varmt hos IQ?»",
            grytevott:
              "Votten er varm på innsiden, ikke på utsiden. Dessverre.",
            sirupbroed:
              "Du gnir sirup på isen. Nå er den både frossen og klissete.",
            magnetnaal: "Nåla peker mot nord. Isen bryr seg ikke.",
          },
        },
        {
          id: "busken",
          navn: "Buskene",
          rect: { x: 82, y: 40, w: 18, h: 40 },
          smart: "se",
          vis: { uten: "rudolf_flyttet" },
          se: "Noen nakne bjørkebusker med snø på greinene. Noen har tygget på de nederste greinene. Du har en mistenkt.",
        },
        {
          id: "rudolf2",
          navn: "Rudolf",
          rect: { x: 82, y: 40, w: 18, h: 40 },
          smart: "se",
          vis: { hvis: "rudolf_flyttet" },
          se: "Rudolf står mellom buskene og tygger knekkebrød med lukkede øyne. Nesa lyser rolig. Han er den lykkeligste reinen nord for Nordtoppen.",
          bruk: "Du klapper Rudolf på mulen. Han tygger videre. Han har det bra.",
        },
        {
          id: "tjernet",
          navn: "Tjernet",
          rect: { x: 10, y: 52, w: 28, h: 22 },
          smart: "se",
          se: "Tjernet er frosset blankt som en tallerken. Under isen går det en liten fisk fram og tilbake og lurer på hvor taket kom fra.",
          bruk: "Knerten prøver isen med én fot. Den holder. Hun prøver med to. Den holder. Hun går tilbake på land, for sikkerhets skyld.",
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
                "Ei lita hytte for antenna. Inni: en benk, ei lampe og en ledig plass der blikkboksen sto.",
            },
            {
              hvis: "hytta_aapen",
              tekst:
                "Døra står åpen. Inni: en benk, ei lampe som lyser gult, og en tung blikkboks på benken.",
            },
            {
              tekst:
                "Ei lita trehytte med ett vindu som lyser gult. Skilt på døra: «ANTENNEHYTTA. NØKKEL UNDER MATTA. IKKE SI DET TIL NOEN. – IQ». Det er ingen matte. Bare en snøhaug.",
            },
          ],
          bruk: [
            {
              hvis: "tok_blikkboks",
              tekst: "Benken er tom. Lampa lyser for ingen.",
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
              "Du løfter blikkboksen fra benken. Den er tung og iskald. Knerten må ta to tak.",
          },
          bruker: [
            {
              item: "noekkel",
              uten: "hytta_aapen",
              flagg: "hytta_aapen",
              forbruker: true,
              tekst:
                "Nøkkelen passer. Døra går opp med et knirk som høres ut som «endelig». Du legger nøkkelen pent på hylla innenfor, slik lappen sa.",
            },
          ],
          feil: {
            sirupbroed:
              "Du smører sirup på døra. Nå er den låst OG klissete. Bra jobba.",
            magnetnaal:
              "Nåla peker mot nord. Døra er fortsatt låst, men nå vet du hvilken vei den vender.",
            grytevott: "Du banker på med votten. Mykt. Ingen hører.",
          },
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
                "En snøhaug med et nøkkelformet hull i. Mysteriet er løst.",
            },
            {
              tekst:
                "En liten snøhaug rett foran døra. Akkurat der ei dørmatte ville ligget, hvis noen hadde eid ei dørmatte.",
            },
          ],
          ta: {
            item: "noekkel",
            tekst:
              "Knerten graver med begge føttene. Snø til alle kanter. Og der: en liten jernnøkkel med lapp. " +
              R +
              "«Under matta. Alle gjømme nøkla under matta. Æ gjømme min i ei klementin.»",
          },
          bruk: "Bare snø igjen. Og et hull.",
        },
        {
          id: "kablene",
          navn: "Kablene",
          rect: { x: 28, y: 80, w: 30, h: 18 },
          smart: "se",
          se: "Tykke svarte kabler slynger seg over snøen fra hytta til masta. Én av dem har merker. Bittemerker. Store.",
          bruk: "Du drar i en kabel. Inne i hytta sier noe «pling». Du slipper kabelen.",
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
          se: "Alle målerne står på midten. Lappen «ALDRI MER KAFFETRAKTER» henger der fortsatt. Noen har lagt til en ny lapp under: «ELLER VAFFELJERN».",
          bruk: "Du lar skapet være. Du har lært.",
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
                "På tavla: en tegning av Rudolf med kabel i munnen og teksten «RUDOLF + KABEL = NEI». Tegningen henger skjevt nå som nåla er borte.",
            },
            {
              tekst:
                "På tavla: en tegning av Rudolf med kabel i munnen og teksten «RUDOLF + KABEL = NEI». Tegningen holdes oppe av en kork med ei nål gjennom. Nåla har en rød ende som peker mot vinduet.",
            },
          ],
          ta: {
            item: "magnetnaal",
            tekst:
              "Du tar korken med nåla. Tegningen av Rudolf seiler ned på gulvet. Du legger den pent på benken.",
          },
          bruk: "Tegningen av Rudolf ligger på benken. Han ser skyldig ut.",
        },
        {
          id: "oscilloskopet",
          navn: "Oscilloskopet",
          rect: { x: 20, y: 58, w: 9, h: 18 },
          smart: "se",
          se: "Den grønne streken hakker i dag. Hopp, hopp, pause, hopp. Det ser ut som noen som tygger.",
          bruk: "Du vrir på knotten. Nå ser det ut som noen som tygger fortere.",
        },
        {
          id: "radioroerene",
          navn: "Radiorørene",
          rect: { x: 7, y: 70, w: 13, h: 16 },
          smart: "bruk",
          se: [
            {
              hvis: "varmboks_tatt",
              tekst:
                "Tre glødende rør i rødt, grønt og oransje. De summer litt lettet. Det er tungt å ha en blikkboks på hodet.",
            },
            {
              hvis: "boks_paa_roerene",
              tekst:
                "Blikkboksen står oppå de tre rørene. Den har begynt å ryke. Skruene inni knitrer. Den er GLOVARM.",
            },
            {
              tekst:
                "Tre glødende rør i rødt, grønt og oransje. Varmen fra dem kjennes helt bort til døra. IQ bruker dem til å tørke sokker. Det er forbudt. Han gjør det likevel.",
            },
          ],
          bruk: [
            {
              hvis: "varmboks_tatt",
              tekst: "Varmt! Du trekker fingeren til deg. Igjen.",
            },
            {
              hvis: "boks_paa_roerene",
              tekst:
                "Du prøver å løfte boksen. AU! Den er glovarm. Du trenger noe på hånda. " +
                R +
                "«IKKJE med fingran! Ka har IQ når han tar i varme ting?»",
            },
            {
              tekst:
                "Varmt! Du trekker fingeren til deg. " +
                R +
                "«Ja. Sånn lærte æ det òg. To ganga.»",
            },
          ],
          bruker: [
            {
              item: "blikkboks",
              uten: "boks_paa_roerene",
              flagg: "boks_paa_roerene",
              forbruker: true,
              tekst:
                "Du setter blikkboksen oppå de tre rørene. Rørene dupper litt under vekta, men holder. Det tar ikke lang tid før boksen begynner å ryke. " +
                R +
                "«Nå e den varm. Veldig varm. Ikkje ta den med fingran.»",
            },
            {
              item: "grytevott",
              hvis: "boks_paa_roerene",
              uten: "varmboks_tatt",
              flagg: "varmboks_tatt",
              gir: "varmboks",
              tekst:
                "Med grytevotten på løfter du boksen av rørene. Den ryker. Den er tung. Den er akkurat passe glovarm. Rørene summer lettet.",
            },
            {
              item: "grytevott",
              hvis: "varmboks_tatt",
              tekst: "Boksen er tatt. Rørene er glade for det.",
            },
            {
              item: "grytevott",
              tekst:
                "Du klapper rørene med votten. De summer fornøyd. Ingenting annet skjer.",
            },
          ],
          feil: {
            sirupbroed:
              "Du holder knekkebrødet over rørene. Sirupen bobler. Det lukter brent. Du tar det vekk.",
            knekkebroed:
              "Du rister knekkebrødet over rørene. Nå er det enda tørrere. Det var ikke mulig, men her er vi.",
            sirup:
              "Du holder flaska over rørene. " +
              R +
              "«NEI. Sirup på radiorør e sånn IQ mista øyebrynan i 2019.»",
            magnetnaal:
              "Du holder nåla over rørene. Den snurrer forvirret rundt. Varme og magneter er ikke venner.",
          },
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 54, y: 18, w: 10, h: 28 },
          smart: "se",
          se: "Rim på rutene. Smilefjeset fra sist er der fortsatt. Noen har tegnet en rein ved siden av. Reinen har kabel i munnen.",
        },
        {
          id: "skiltet",
          navn: "Skiltet",
          rect: { x: 66, y: 7, w: 11, h: 12 },
          smart: "se",
          se: "«IKKE RØR (GJELDER OGSÅ RAMPENISSEN)». Under henger en ny lapp: «GJELDER OGSÅ RUDOLF». Lappen har bittemerker.",
        },
        {
          id: "doera",
          navn: "IQs dør",
          rect: { x: 66, y: 20, w: 14, h: 44 },
          smart: "snakk",
          snakk: "iq",
          se: "IQs dør. Innenfra høres klirring, og en mann som sier «nei, nei, NEI» til noe som sier «pling».",
          bruk: "Låst. Lappen «BANK TRE GANGER. IKKE FIRE.» henger der fortsatt. Bulken nederst har fått selskap av en bulk til.",
        },
        {
          id: "kaffekoppen",
          navn: "Kaffekoppen",
          rect: { x: 45, y: 74, w: 9, h: 13 },
          smart: "se",
          se: "En ny kaffekopp på benken. Denne er tom. Helt tom. IQ har vært tørst, eller Rampenissen har vært innom. Begge deler er mulig.",
          bruk:
            "Du løfter koppen. Tom og kald. " +
            R +
            "«Tom kopp hjelpe ingen. Æ veit, æ har prøvd.»",
        },
        {
          id: "tegningen",
          navn: "Tegningen",
          rect: { x: 36, y: 86, w: 17, h: 14 },
          smart: "se",
          se: "Sledetegningen med pepperkakegass-traktene. Julius' røde spørsmålstegn har fått selskap av et utropstegn fra IQ. Diskusjonen pågår.",
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
                "Lampa, loddebolten og en skuff som står åpen. Tom. Nødrasjonen er brukt opp. I en nødsituasjon, så det er greit.",
            },
            {
              tekst:
                "Et lite bord med skrivebordslampe og en skuff. På skuffen står det «NØDRASJON. BARE I NØD.» Noen har lagt til «RUDOLF TELLER IKKE SOM NØD».",
            },
          ],
          ta: {
            item: "knekkebroed",
            tekst:
              "Du åpner skuffen. To skiver knekkebrød og en lapp: «HVIS DU LESER DETTE ER DET NØD». Du tar knekkebrødet. Det er nød.",
          },
          bruk: "Skuffen er tom. Lappen ligger igjen og ser alvorlig ut.",
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
                "IQs krakk med tre bein og boka «Balanse for viderekomne» under det fjerde. Plassen under setet er tom.",
            },
            {
              tekst:
                "IQs krakk med tre bein og boka «Balanse for viderekomne» under det fjerde. Under setet henger noe rutete på en krok.",
            },
          ],
          ta: {
            item: "grytevott",
            tekst:
              "Du tar grytevotten fra kroken under krakken. Den lukter brent sokk. " +
              R +
              "«Nissemor sin! Ho leite etter den sia i fjor.»",
          },
          bruk: "Kroken under krakken er tom. Krakken står like skjevt.",
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
                "Syltetøyglass med skruer, tannhjul og ett med syltetøy («MITT. – IQ»). Og en ledig plass med en klissete ring der sirupsflaska sto.",
            },
            {
              tekst:
                "Syltetøyglass med skruer, tannhjul og ett med syltetøy («MITT. – IQ»). Innerst står ei flaske sirup som ser ut som den har gjemt seg.",
            },
          ],
          ta: {
            item: "sirup",
            tekst:
              "Du tar sirupsflaska. Lappen sier «TIL VAFLER». Dette er ikke vafler. Dette er viktigere.",
          },
          bruk: "Syltetøyet får stå. Det har navn på seg.",
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
                "«Bildet er skarpt! Jeg ser det på måleren min! Hvem enn dere er: dere er forfremmet til assistenter. Ulønnet.»",
            },
            {
              hvis: "iq_snakket",
              tekst:
                "«Dere igjen! Rudolf har ikke kommet hit og bedt om unnskyldning, hvis det er det dere lurer på.»",
            },
            {
              tekst:
                "«Hvem der? Hvis det er Rudolf: NEI, du får ikke mer sirup, og du får ikke tygge på noe som helst!»",
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
            "«Jeg VET det! Tannhjulet som snur antenna er frosset fast. Det hadde en varmekabel. Hadde. Rudolf tygget den i to i natt fordi han kjedet seg. Nå må tannhjulet tines med noe varmt. Ikke en kaffekopp, den blir kald på veien. Noe tungt. Metall. Holdt inntil lenge.»",
          rampenissen:
            "«Nåkka tungt og varmt. Og nåkka å hold det med, for æ kjenne IQ sine varme ting.»",
          valg: [
            { tekst: "Hvordan får vi Rudolf vekk?", neste: "rudolf" },
            { tekst: "Hvor finner vi noe tungt av metall?", neste: "boks" },
            { tekst: "Takk, IQ!" },
          ],
        },
        boks: {
          tekst:
            "«I antennehytta står en blikkboks med skruer. Tung som synd. Nøkkelen ligger under matta. Det er ingen matte, men nøkkelen ligger under den likevel. Og når boksen er varm: grytevotten. Den henger under krakken. Ikke si det til Nissemor.»",
          rampenissen: "«Æ sei det te Nissemor.»",
          valg: [{ tekst: "Skjønner!" }],
        },
        rudolf: {
          tekst:
            "«Rudolf går ALDRI fra noe han tygger på. Aldri. Med mindre han får noe bedre å tygge på. Og Rudolf mener at alt smaker bedre med sirup. Det er hans eneste mening om noe.»",
          rampenissen:
            "«Nåkka bedre enn kabel, med sirup på. Det meste e bedre enn kabel.»",
          valg: [
            { tekst: "Har du sirup?", neste: "sirup" },
            { tekst: "Takk!" },
          ],
        },
        sirup: {
          tekst:
            "«Nissemor har gjemt ei flaske i hylla mi. Hun tror jeg ikke vet det. Og hvis dere trenger noe å smøre den på: nødrasjonen i skuffen på sidebordet. Dette er en nødsituasjon. Jeg erklærer det herved.»",
          valg: [{ tekst: "Herved notert." }],
        },
        landaas: {
          tekst:
            "«Jeg har risset en L i peileskiva på masta, der Landås ligger. Men skiva vet ikke hvor nord er. Det gjør nåla på tavla mi. Legg den i vannkoppen på skiva, så snur den rød enden mot nord. Vri skiva til N møter nåla. Da peker antenna på L.»",
          rampenissen: "«Nål, vann, nord, L. Æ skreiv det på handa.»",
          valg: [{ tekst: "Nål, vann, nord, L. Skjønner." }],
        },
        pling: {
          tekst:
            "«Det er varmemåleren for tannhjulet. Den sier pling når tannhjulet er kaldt. Den har sagt pling siden klokka tre i natt. Jeg har ikke sovet. Pling.»",
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
          "«Noe tungt og varmt, sa IQ. Boksen hans ligg i hytta ved antenna. Men døra e låst.»",
        R +
          "«Les skiltet på hyttedøra. IQ gjømme nøkla der alle gjømme nøkla.»",
        R +
          "«BRUK snøhaugen foran hyttedøra. Nøkla ligg under. Bruk den på døra, og ta boksen inni.»",
      ],
    },
    {
      id: "rudolf",
      ferdig: "rudolf_flyttet",
      tips: [
        R +
          "«Rudolf går ikkje fra kabelen frivillig. Han treng nåkka BEDRE å tygge på. Med sirup.»",
        R +
          "«Sirupsflaska står i hylla hos IQ, og knekkebrød ligg i skuffen på sidebordet. Saman blir det godt.»",
        R +
          "«Trykk på sirupen i lomma, så på knekkebrødet. Gi knekkebrødet med sirup te Rudolf.»",
      ],
    },
    {
      id: "tannhjul",
      ferdig: "tannhjul_tint",
      tips: [
        R +
          "«Tannhjulet nederst på masta e frosse. Det treng nåkka varmt og tungt inntil sæ. Lenge.»",
        R +
          "«Blikkboksen kan varmes på radiorøran hos IQ. Men ikkje ta den med fingran etterpå. Grytevotten heng under krakken.»",
        R +
          "«Sett boksen på radiorøran. Ta den med grytevotten. Fly te tjernet og hold boksen mot tannhjulet.»",
      ],
    },
    {
      id: "peiling",
      ferdig: "k2_ferdig",
      tips: [
        R +
          "«Antenna snurre, men kor e Landås? IQ har rissa en L i skiva. Vi må bare vite kor nord e.»",
        R + "«Nåla på tavla hos IQ peke alltid mot nord. Ta ho med.»",
        R +
          "«Ta magnetnåla fra tavla og bruk den på peileskiva på masta. Så finn antenna L sjøl.»",
      ],
    },
  ],
};
