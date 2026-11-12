/**
 * Kapittel 2: «Antenna i permafrost» (dag 10). The turning gear at the tarn
 * antenna is frozen in the rime that has crept down the line since day 1
 * (Kulde's, named on day 7; the real jamming is the main story's day 11), and
 * a bored Rudolf has knocked the bearing dial off north and stands chewing a
 * cable in front of the gear, so the picture to Landås stutters. Written for
 * Håkon (9) and Kristian (12): the tin box is heated on the tubes and carried
 * in the oven glove, and it has to be reheated for the frozen water cup; the
 * hand warmer is a red herring. Two mini-puzzles: the hut's combination lock
 * (count what the sign lists) and the receiver that must be tuned to the line's
 * 90,0 MHz, the number on the note in the hut. Side story only: nothing is
 * solved for the main story.
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
  teaser: "Bildet hakker. Noe tygger på noe det ikke burde.",
  start: "tjernet",
  slutt: "k2_ferdig",
  intro: [
    R +
      "«Psst, dokker! Det e kaldt, og bildet fra Snøfall HAKKE. Floke sitt ute ved tjernet, og æ ser bare halve ugla. Den bakerste halvdelen. Det e ikkje den beste.»",
    R +
      "«Antenna ved tjernet har frøse fast. Rim fra linja, heilt ned i tannhjulet. Det e Kulde sitt, det. Men veit dokker kem som står foran tannhjulet og TYGG på en kabel? Rudolf. Han med nesa. Han tygg på alt når han kjede sæ, og han har klødd sæ på masta så peileskiva peke på ingenting. I fjor åt han ei dørmatte og halve skriveplata te Winter.»",
    R +
      "«Vi må få Rudolf vekk, tine tannhjulet og peile antenna mot Landås igjen. IQ sitt bak døra si som vanlig og roper. RAMPENISSEN-knappen nederst e fortsatt mæ, med tips, men dokker treng den sikkert ikkje. Sikkert.»",
  ],
  utro:
    R +
    "«Antenna peke mot Landås, bildet e skarpt, og Rudolf tygg på knekkebrød i stedet for kabel. Dokker e gode! IQ ska lage ei egen hylle te knekkebrødet, med lås. Rudolf har allerede sett på låsen. Neste gang treng æ hjelp med nåkka ... mørkt. Over og ut!»",
  gjenstander: {
    blikkboks: {
      id: "blikkboks",
      navn: "Blikkboks",
      ikon: "box",
      se: "En liten blikkboks full av gamle skruer. Iskald. På lokket står det «SKRUER (DIVERSE)», og under har noen skrevet «OG ÉN MUTTER». Mutteren er ikke merket. Den skal finnes.",
    },
    grytevott: {
      id: "grytevott",
      navn: "Grytevott",
      ikon: "hand",
      se: "En rutete grytevott med et brennmerke formet som et radiorør. Hjerterud har sydd «IQ» på kanten, så den finner veien hjem. Det har den ikke gjort.",
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
      se: "Ei flaske mørk sirup. Lapp: «TIL VAFLER. IKKE TIL EKSPERIMENT. – HJERTERUD». Noen har tegnet et vaffelhjerte under. Noen andre har tegnet et reinsdyr som spiser vaffelhjertet.",
    },
    sirupbroed: {
      id: "sirupbroed",
      navn: "Knekkebrød med sirup",
      ikon: "cake",
      se: "Knekkebrød med et tykt lag sirup. Det drypper. Det lukter så godt at Floke blunker to ganger og Rampenissen blunker tre.",
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
  fjaerBelonning:
    R +
    "«To fjær te! Floke mista ei fjær hver gang ho e stolt. Ho e stolt ofte. Det e en av tingan vi har felles.»",
  puslespill: {
    hyttelaas: {
      type: "laas",
      tittel: "Hengelåsen på hytta",
      flagg: "hytta_aapen",
      tekst:
        "1-3-1. Én lampe, tre kabler, én rein. Hengelåsen klikker opp, og døra går opp med et knirk som høres ut som «endelig». " +
        R +
        "«Han TELTE sæ fram te koden. Og så skreiv han framgangsmåten på døra. Det e IQ i et nøtteskall. Et stort nøtteskall.»",
      hjul: [
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      ],
      svar: ["1", "3", "1"],
    },
    mottaker: {
      type: "radio",
      tittel: "Mottakeren i hytta",
      flagg: "k2_ferdig",
      tekst:
        "90,0. Susen dør, nåla står stille, og lampa på toppen av masta lyser jevnt. " +
        R +
        "«BILDET! Æ ser heile ugla! Æ ser FJÆRAN hennes! Æ ser at ho treng et bad!»",
      min: 88,
      max: 108,
      maal: 90.0,
      toleranse: 0.3,
      steg: 0.1,
      enhet: "MHz",
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
        "«No kan den bli så varm den vil. Det e votten som tar støyten. Takk, Hjerterud.»",
    },
  ],
  scener: [
    {
      id: "tjernet",
      navn: "Antenna ved tjernet",
      bilde: "spill/antenne-tarn.jpg",
      utganger: [{ til: "verksted", navn: "Fly til verkstedet" }],
      // In the snow at the near edge of the tarn, bottom left
      fjaer: { x: 4, y: 84, w: 4, h: 6 },
      hotspots: [
        {
          id: "himmelen",
          navn: "Himmelen",
          rect: { x: 0, y: 0, w: 44, h: 30 },
          smart: "se",
          se: "Grønt lys bølger over fjella. Stjernene står tett. Én av dem er nordstjerna, og du aner ikke hvilken. Det gjør ikke Floke heller. Hun er ei ugle, ikke et kart.",
          prat:
            "Du uler mot det grønne lyset. Det bølger. " +
            R +
            "«Det svare! Nei. Det gjør sånn uansett. Æ har prøvd heile natta.»",
        },
        {
          id: "fjella",
          navn: "Fjella",
          rect: { x: 56, y: 16, w: 44, h: 14 },
          smart: "se",
          se: "Lave fjell med snø helt ned. Et sted bak dem ligger Nordtoppen. Et sted langt bak dem igjen ligger Landås, en sofa, og en nisse som venter på bedre bilde og har spist opp alt godteriet mens han ventet.",
          prat: "Du roper «HALLO» mot fjella. Ekkoet kommer tilbake tre ganger, svakere og svakere, til det høres ut som Rampenissen i søvne.",
        },
        {
          id: "lampa",
          navn: "Lampa på toppen",
          rect: { x: 46, y: 6, w: 8, h: 8 },
          smart: "se",
          se: "Ei rød lampe på toppen av masta. Den blinker. IQ sier det er så flyene ser antenna. Rampenissen sier det er så Julius finner hjem. Rudolf tror det er en veldig høy nese.",
          prat: "Du uler mot den røde lampa. Den blinker. Du uler igjen. Den blinker igjen. Den blinker i samme takt uansett, men det kjennes som en samtale.",
        },
        {
          id: "peileskiva",
          figur: "peileskive",
          navn: "Peileskiva på masta",
          prat: "Du spør skiva hvor nord er. Den snurrer ikke og sier ingenting. Den har to måter å ikke svare på, og bruker begge.",
          rect: { x: 44, y: 30, w: 12, h: 26 },
          smart: "bruk",
          se: [
            {
              hvis: "antenne_peilet",
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
              hvis: "antenne_peilet",
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
              uten: "antenne_peilet",
              flagg: "antenne_peilet",
              forbruker: true,
              tekst:
                "Du legger korken med nåla i vannkoppen. Den røde enden snur seg mot nord. Floke vrir skiva til N møter nåla, og antenna svinger rundt og stopper på L. " +
                R +
                "«Æ ser ... SNØ. Antenna peke rett, men mottakeren i hytta står på feil tall. Alt hos IQ står på en lapp.»",
            },
            {
              item: "magnetnaal",
              hvis: "tannhjul_tint",
              tekst:
                "Du legger korken oppå isen i koppen. Den ligger der. Den peker på Floke. Floke er ikke nord. " +
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
                "Du holder den glovarme boksen inntil koppen. Isen synker sammen og blir vann. Skiva snurrer lett, så vinden får ikke tak. Boksen er kald igjen. " +
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
              tekst:
                "Du holder den varme boksen mot koppen. Isen smelter ... og fryser til igjen før du har snudd deg. Skiva står fast, rett i vinden, og vinden vinner. " +
                R +
                "«Boksen e fortsatt varm, heldigvis. Så lenge skiva står fast, fryse koppen på nytt. Tannhjulet først, sjø.»",
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
          figur: "rudolf",
          navn: "Rudolf",
          rect: { x: 38, y: 56, w: 22, h: 22 },
          smart: "bruk",
          prat: "«Rudolf?» Rudolf tygger. «Rudolf, kabelen.» Rudolf tygger litt fortere. Han hører. Han prioriterer.",
          vis: { uten: "rudolf_flyttet" },
          se: "Rudolf ligger ved foten av masta med en svart kabel i munnen. Nesa lyser rødt hver gang han tygger. Bak ham skimter du et tannhjul dekket av is. Han ligger ikke i veien. Han ER veien.",
          bruk:
            "Du dytter Rudolf. Rudolf dytter tilbake. Rudolf vinner. " +
            R +
            "«Han veie like mye som en sofa. Æ har prøvd. Æ har prøvd med sofaen òg, for å sammenligne.»",
          bruker: [
            {
              item: "sirupbroed",
              flagg: "rudolf_flyttet",
              forbruker: true,
              tekst:
                "Rudolf snuser. Rudolf slipper kabelen. Rudolf tar knekkebrødet så forsiktig at ikke en dråpe sirup søles, og rusler bort til buskene for å tygge i fred. " +
                R +
                "«HA! Sirup slår kabel. Skriv det på tavla, IQ, under tegninga av han.»",
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
            haandvarmer:
              "Du legger håndvarmeren på mulen hans. Han lukker øynene og nyter det. Han flytter seg ikke en millimeter. Nå har han kabel OG spa.",
          },
        },
        {
          id: "tannhjulet",
          figur: "tannhjul",
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
                "Et stort tannhjul ved foten av masta, støpt inn i en klump is. Isen er hvit og tynn og vokser mens du ser på. Den kom ikke med været. Den kom nedover linja. Ved siden av ligger kabelen Rudolf tygget på. Den gikk til lampa på toppen. Lampa blinker fortsatt, bare litt fornærmet.",
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
                "Floke hakker på isen med nebbet. Isen vinner. " +
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
                "Du setter den glovarme boksen inntil isen. Det freser, drypper, renner. Så et lite KNAKK, og tannhjulet rykker til. Fritt! Boksen er kald igjen, men den gjorde jobben. " +
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
              "«Varmt, ja. Men ikkje nok, og ikkje lenge nok. Vi treng nåkka av METALL som hold på varmen.»",
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
          figur: "rudolf-busk",
          navn: "Rudolf",
          rect: { x: 82, y: 40, w: 18, h: 40 },
          smart: "se",
          prat: "Rudolf åpner ett øye, tygger ferdig, og lukker det igjen. Det var hele samtalen, og det var en god en.",
          vis: { hvis: "rudolf_flyttet" },
          se: "Rudolf står mellom buskene og tygger knekkebrød med lukkede øyne. Nesa lyser rolig. Han er den lykkeligste reinen nord for Nordtoppen, og han vet det.",
          bruk: "Du klapper Rudolf på mulen. Han tygger videre. Han har det bra. Han har det bedre enn deg.",
        },
        {
          id: "tjernet",
          navn: "Tjernet",
          rect: { x: 10, y: 52, w: 28, h: 22 },
          smart: "se",
          prat:
            "Du snakker til fisken under isen. Den stopper, ser opp, og svømmer videre. " +
            R +
            "«Fisken har hørt verre spørsmål. Fra mæ. I fjor.»",
          se: "Tjernet er frosset blankt som en tallerken. Under isen går det en liten fisk fram og tilbake og lurer på hvor taket kom fra. Den har spurt de andre fiskene. De vet heller ikke.",
          bruk: "Floke prøver isen med én fot. Den holder. Hun prøver med to. Den holder. Hun går tilbake på land. Ugler har et godt forhold til land.",
        },
        {
          id: "hytta",
          navn: "Hytta",
          prat: "Du banker og sier «hallo» inn gjennom nøkkelhullet. Innenfra sier noe «pling». Det er mottakeren. Den sier det til alle.",
          rect: { x: 58, y: 56, w: 14, h: 20 },
          smart: "bruk",
          puslespill: "hyttelaas",
          se: [
            {
              hvis: "tok_blikkboks",
              tekst:
                "Ei lita hytte for antenna. Inni: en benk, ei lampe og en ledig plass der blikkboksen sto. Det er fortsatt noe smått på benken.",
            },
            {
              hvis: "hytta_aapen",
              tekst:
                "Døra står åpen. Inni: en benk, ei lampe som lyser gult, en blikkboks på benken, og noe smått ved siden av.",
            },
            {
              tekst:
                "Ei lita trehytte med ett vindu som lyser gult og en hengelås med tre tallhjul på døra. Skilt: «ANTENNEHYTTA. KODE: TELL LAMPER PÅ MASTA, KABLER I SNØEN, REINSDYR. IKKE SI DET TIL NOEN. – IQ». Skiltet sier det til alle.",
            },
          ],
          bruk: [
            {
              hvis: "tok_blikkboks",
              tekst: "Benken er nesten tom. Lampa lyser for en håndvarmer.",
            },
            {
              tekst:
                "Døra står åpen. Boksen er tatt. Lampa lyser for en håndvarmer og en lapp.",
            },
          ],
          ta: {
            item: "blikkboks",
            hvis: "hytta_aapen",
            tekst:
              "Du løfter blikkboksen fra benken. Den er iskald. Floke tar den i klørne og ser på deg som om du skylder henne noe.",
          },
          feil: {
            sirupbroed:
              "Du smører sirup på døra. Nå er den låst OG klissete. Bra jobba. Rudolf har allerede merket det.",
            magnetnaal:
              "Nåla peker mot nord. Hengelåsen peker ingen vei. Den er en hengelås.",
            grytevott:
              "Du banker på med votten. Mykt. Ingen hører. Ingen bor her.",
          },
        },
        {
          id: "benken",
          navn: "Benken i hytta",
          rect: { x: 58, y: 67, w: 5, h: 8 },
          smart: "bruk",
          vis: { hvis: "hytta_aapen" },
          se: [
            {
              hvis: "tok_haandvarmer",
              tekst:
                "Benken, lampa og et tomt sted. Alt som var varmt, er tatt. Alt som var lunkent, også. På lampa henger lappen: «LANDÅS 90,0. IKKE RØR RATTET. – IQ».",
            },
            {
              tekst:
                "Ved siden av der boksen står, ligger ei lita pose: «RIST FOR VARME». IQ har tydeligvis sittet her og frosset. På lampa henger en lapp: «LANDÅS 90,0. IKKE RØR RATTET. – IQ». Noen har rørt rattet.",
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
          id: "mottakeren",
          navn: "Mottakeren i vinduet",
          rect: { x: 60, y: 58, w: 10, h: 8 },
          smart: "bruk",
          vis: { hvis: "antenne_peilet" },
          puslespill: "mottaker",
          se: [
            {
              hvis: "k2_ferdig",
              tekst:
                "Mottakeren står på 90,0 og suser ikke. Nåla står stille som en lydig hund. IQ har allerede teipet fast rattet.",
            },
            {
              tekst:
                "En liten mottaker i vinduskarmen med et ratt og en nål som skjelver over tallene. Den suser. Noen har rørt rattet. Lappen på lampa sier hvor det skal stå.",
            },
          ],
          bruk: "Den står rett. Du lar rattet være. Du er den første.",
        },
        {
          id: "snoehaugen",
          navn: "Snøhaugen ved døra",
          rect: { x: 58, y: 76, w: 14, h: 10 },
          smart: "bruk",
          se: "En liten snøhaug rett foran døra. Akkurat der ei dørmatte ville ligget, hvis noen hadde eid ei dørmatte. Noen eide ei. Rudolf åt den.",
          bruk:
            "Floke graver med begge føttene. Snø til alle kanter. Ingen nøkkel. Ingen matte. " +
            R +
            "«Alle gjømme nøkla under matta. IQ har ikkje matte. Så han har kodelås. Og skilt. Han e trygg på en veldig utrygg måte.»",
        },
        {
          id: "kablene",
          navn: "Kablene",
          rect: { x: 28, y: 80, w: 30, h: 18 },
          smart: "se",
          se: "Tre tykke svarte kabler slynger seg over snøen fra hytta til masta. Én av dem har merker. Bittemerker. Store. Med mellomrom som passer akkurat til en reinsdyrkjeft, hvis noen skulle lure.",
          prat: "Du hvisker til kablene om å holde ut. De ligger stille i snøen. Én av dem har bittemerker og et uttrykk av å ha holdt ut lenge nok.",
          bruk: "Du drar i en kabel. Inne i hytta sier noe «pling». Du slipper kabelen. Det sier «pling» igjen. Det var ikke deg.",
        },
        {
          id: "bjoerka",
          navn: "Bjørka",
          rect: { x: 0, y: 66, w: 10, h: 18 },
          smart: "se",
          se: "Ei naken bjørk ved tjernet med rim på hver kvist. Nederst på stammen er barken gnagd bort i en ring. Reinhøyde. Bjørka står fortsatt. Den har sett verre vintre, men ingen med Rudolf i.",
          bruk: "Floke lander i bjørka. Greina bøyer seg. Rimet drysser ned over henne som sukker. Hun ser ut som en bolle med briller.",
        },
        {
          id: "sporene",
          navn: "Sporene i snøen",
          rect: { x: 72, y: 84, w: 28, h: 16 },
          smart: "se",
          se: "Et spor av hover går fra bjørka til masta, rundt masta tre ganger, bort til hytta og tilbake til masta. Og ett spor av små støvler rett fra hytta til masta og rett hjem igjen, fort. IQ. Han ble kald. Han blir alltid kald.",
          bruk: "Floke setter tre tær i snøen ved siden av hovsporet. Nå er det to mistenkte. Den ene har alibi. Det er deg.",
        },
        {
          id: "smaabuskene",
          navn: "Småtrærne",
          rect: { x: 22, y: 42, w: 11, h: 9 },
          smart: "se",
          se: "Små grantrær, knapt høyere enn en nisse, i snøen bortenfor tjernet. IQ plantet dem for å skjerme masta for vind. Masta er ti meter høy. Trærne er en halv. Det er en langsiktig plan.",
          prat: "Du uler mot småtrærne. Snøen på det ene glir av. Det ser ut som det bukket.",
        },
        {
          id: "bardunene",
          navn: "Bardunene",
          rect: { x: 34, y: 30, w: 10, h: 22 },
          smart: "se",
          se: "Tre stålwire holder masta oppe, strukket fra toppen og ned i snøen. De er dekket av rim og synger lavt i vinden, hver sin tone. IQ stemte dem. Han sier det var tilfeldig. Han har notene.",
          bruk: "Du klyper en bardun med nebbet. Den synger. Masta dirrer litt. Innenfra hytta sier noe «pling». Alt her oppe henger sammen, også lydene.",
        },
      ],
    },
    {
      id: "verksted",
      navn: "IQs verksted",
      bilde: "spill/iq-verksted.jpg",
      utganger: [{ til: "tjernet", navn: "Fly ut til tjernet" }],
      // On the floor between the coffee cup and the stool
      fjaer: { x: 57, y: 88, w: 4, h: 6 },
      hotspots: [
        {
          id: "sikringsskapet",
          navn: "Sikringsskapet",
          rect: { x: 0, y: 27, w: 14, h: 36 },
          smart: "se",
          se: "Alle målerne står på midten. Lappen «ALDRI MER KAFFETRAKTER» henger der fortsatt. Noen har lagt til en ny lapp under: «ELLER VAFFELJERN». Lista blir lengre hvert år.",
          prat: "Du spør skapet hva som skjedde med vaffeljernet. Det klikker én gang. Det er alt du får vite, og det er sannsynligvis nok.",
          bruk: "Du lar skapet være. Du har lært. Du lærte det sist, og du lærte det av IQ sine øyenbryn.",
        },
        {
          id: "tavla",
          navn: "Tavla",
          rect: { x: 14, y: 30, w: 13, h: 30 },
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
          rect: { x: 21, y: 57, w: 14, h: 15 },
          smart: "se",
          se: "Den grønne streken hakker i dag. Hopp, hopp, pause, hopp. Det ser ut som noen som tygger. Det ER noen som tygger. IQ har koblet det til Rudolf.",
          prat: "Du snakker til streken. Den hakker i takt med stemmen din. Så i takt med Rudolf. Rudolf vinner. Rudolf har kjevene.",
          bruk: "Du vrir på knotten. Nå ser det ut som noen som tygger fortere. Ute ved tjernet tygger Rudolf fortere. Det er sikkert tilfeldig.",
        },
        {
          id: "radioroerene",
          navn: "Radiorørene",
          rect: { x: 10, y: 65, w: 11, h: 18 },
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
                "Du setter boksen på de tre rørene og holder den der med votten. Rørene dupper under vekta, men holder. Snart ryker boksen. Du løfter den av. Glovarm og trygg i votten. " +
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
              "Du setter boksen på rørene. Ti sekunder, så ryker den. Du griper den. AU! Du slipper den på benken og blåser på fingrene. Når du er ferdig, er boksen kald igjen. " +
              R +
              "«IKKJE med fingran! Ka har IQ på handa når han tar i varme ting? Når han HUSKE det?»",
            grytevott:
              "Du klapper rørene med votten. De summer fornøyd. Votten blir varm. Votten holder ikke på varmen lenge nok til å tine noe som helst.",
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
          rect: { x: 51, y: 21, w: 13, h: 39 },
          smart: "se",
          se: "Rim på rutene. Smilefjeset fra sist er der fortsatt. Noen har tegnet en rein ved siden av. Reinen har kabel i munnen. Noen har tegnet et kryss over reinen. Reinen har tegnet et kryss over krysset. Trolig.",
          prat:
            "Du puster på ruta ved siden av reinen. " +
            R +
            "«Tegn et knekkebrød te han. Så får han nåkka å se på mens vi jobbe.»",
        },
        {
          id: "skiltet",
          navn: "Skiltet",
          rect: { x: 67, y: 20, w: 12, h: 10 },
          smart: "se",
          se: "Det blanke skiltet. Bokstavene ble gnidd bort av Rampenissen. Nå har hjørnet bittemerker også. Rudolf har lest det på sin måte.",
        },
        {
          id: "doera",
          navn: "IQs dør",
          rect: { x: 66, y: 32, w: 14, h: 40 },
          smart: "snakk",
          snakk: "iq",
          se: "IQs dør. Innenfra høres klirring, og en mann som sier «nei, nei, NEI» til noe som sier «pling». Det er uklart hvem som vinner.",
          bruk: "Låst. Lappen «BANK TRE GANGER. IKKE FIRE.» henger der fortsatt. Bulken nederst har fått selskap av en bulk til. Den nye er formet som en hov.",
        },
        {
          id: "kaffekoppen",
          navn: "Kaffekoppen",
          rect: { x: 47, y: 70, w: 7, h: 22 },
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
          rect: { x: 15, y: 85, w: 30, h: 15 },
          smart: "se",
          se: "Det nesten blanke arket med den svake sledetegningen. Julius' røde spørsmålstegn og IQs utropstegn har fått selskap av et tredje tegn. Det er et bittemerke. Diskusjonen har fått en ny deltaker.",
        },
        {
          id: "sidebordet",
          navn: "Sidebordet",
          rect: { x: 85, y: 64, w: 15, h: 30 },
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
          rect: { x: 66, y: 72, w: 8, h: 27 },
          smart: "bruk",
          prat: "Du spør krakken om den savner noe under setet. Den vipper. Det er alt krakken sier om saken.",
          se: [
            {
              hvis: "tok_grytevott",
              tekst:
                "IQs krakk på fire ulike lange bein. Kroken under setet er tom. Krakken står like skjevt som før.",
            },
            {
              tekst:
                "IQs krakk på fire ulike lange bein. Under setet henger noe rutete på en krok. Det er gjemt. Dårlig.",
            },
          ],
          ta: {
            item: "grytevott",
            tekst:
              "Du tar grytevotten fra kroken under krakken. Den lukter brent sokk. " +
              R +
              "«Hjerterud sin! Ho har leita etter den sia i fjor. IQ sa det va Rudolf. Alle sei det e Rudolf. Som regel e det Rudolf.»",
          },
          bruk: "Kroken under krakken er tom. Krakken står like skjevt. Boka hjelper ikke. Den er ikke åpnet.",
        },
        {
          id: "hyllene",
          navn: "Hyllene",
          rect: { x: 27, y: 33, w: 23, h: 15 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_sirup",
              tekst:
                "Syltetøyglass med skruer, tannhjul og ett med syltetøy («MITT. – IQ»). Og en ledig plass med en klissete ring der sirupsflaska sto. Hjerterud kommer til å finne ringen. Hjerterud finner alt.",
            },
            {
              tekst:
                "Syltetøyglass med skruer, tannhjul og ett med syltetøy («MITT. – IQ»). Innerst står ei flaske sirup som ser ut som den har gjemt seg. Den har gjemt seg dårlig. Som alt annet her. Hylla har en merkelapp i frostruner, for IQ merker alt: ᚱ:SKRUER",
            },
          ],
          ta: {
            item: "sirup",
            tekst:
              "Du tar sirupsflaska. Lappen sier «TIL VAFLER». Dette er ikke vafler. Dette er viktigere. Si det til Hjerterud, ikke til oss.",
          },
          bruk: "Syltetøyet får stå. Det har navn på seg, og eieren har kamera på det. Dere husker.",
        },
        {
          id: "lyspaera",
          navn: "Lyspæra",
          rect: { x: 48, y: 0, w: 4, h: 23 },
          smart: "se",
          se: "Lyspæra i taket blunker i takt med noe ute ved tjernet. IQ har koblet den til masta. Når bildet hakker, blunker pæra. Akkurat nå blunker den mye.",
          bruk: "Du dytter pæra. Den svinger og blunker samtidig. Nå er det både mørkt og hakkete. Du stopper den med vingen.",
        },
        {
          id: "radioen",
          navn: "Den gamle radioen",
          rect: { x: 39, y: 21, w: 9, h: 11 },
          smart: "se",
          se: "IQs første mottaker, radioen av tre øverst på hylla. I dag suser den. Den tar bare én kanal, og den kanalen kommer fra masta ved tjernet. Når masta peker feil, hører radioen snø.",
          prat:
            "Du uler mot radioen. Susen svarer. " +
            R +
            "«Det e sånn det høres ut hos mæ òg. Snø. Æ har hørt snø i tre tima. Æ begynne å like det. Det e det som bekymre mæ.»",
        },
        {
          id: "skrivebordslampa",
          navn: "Skrivebordslampa",
          rect: { x: 87, y: 45, w: 9, h: 19 },
          smart: "se",
          se: "Messinglampa over sidebordet er bøyd ned mot skuffen med nødrasjonen. Den lyser rett på ordet NØD. IQ har stilt den sånn med vilje. Han vil at nøden skal være lett å finne.",
        },
        {
          id: "tengene",
          navn: "Tengene",
          rect: { x: 0, y: 84, w: 15, h: 16 },
          smart: "se",
          se: "Tenger og skrutrekkere i «systemet». I dag ligger det en tang for seg selv, pent, med en lapp: «TIL KABEL. HVIS RUDOLF.» Han visste. Han visste, og han gikk inn likevel.",
          bruk: "Du dytter tanga. Lappen glir av. Du legger den tilbake. Lappen er viktigere enn tanga. Det er sånn det er med lapper her.",
        },
        {
          id: "oppfinnelsen",
          navn: "Den lille oppfinnelsen",
          rect: { x: 38, y: 51, w: 11, h: 16 },
          smart: "se",
          se: "Den lille oppfinnelsen på benken gløder som før. Lappen «VIRKER. IKKE SPØR HVORDAN» har fått en ny linje: «VIRKER FORTSATT. SLUTT Å SPØRRE.» Noen har spurt.",
          bruk: "Du trykker på knappen. Gløden blir sterkere. Innenfra døra: «Var det knappen? Det var knappen.» Du trekker vingen til deg.",
          prat:
            R +
            "«Æ spurte korsen den virke. Én gang. IQ snakka i to tima. Æ veit fortsatt ikkje. Men æ veit mye om spola.»",
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
                "«Bildet er skarpt! Jeg ser det på måleren min! Hvem dere enn er: dere er forfremmet til assistenter. Ulønnet. Det er den høyeste stillingen jeg har.»",
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
            "«Jeg VET det! Tannhjulet som snur antenna er frosset fast. Det er ikke vanlig is. Det er rimen fra linja, den samme som har krøpet nedover alt mitt siden første desember. Og Rudolf har klødd seg på masta, så peileskiva peker på skogen. Tannhjulet må tines med noe varmt. Ikke en kaffekopp, den er kald før du er ute av døra. Metall. Som holder på varmen.»",
          rampenissen:
            "«Nåkka av metall, og varmt. Og nåkka å hold det med, for æ kjenne IQ sine varme ting. Dem e varme på en personlig måte.»",
          valg: [
            { tekst: "Hvordan får vi Rudolf vekk?", neste: "rudolf" },
            { tekst: "Hva varmer vi tannhjulet med?", neste: "boks" },
            { tekst: "Takk, IQ!" },
          ],
        },
        boks: {
          tekst:
            "«I antennehytta står en blikkboks med skruer. Varm den på noe her inne som er varmt nok. Det er mye her inne som er varmt nok. Det er problemet. Og hytta har kodelås. Koden står ikke på skiltet, jeg er ikke dum. Men hvordan man finner den, står der. Ikke si det til noen.»",
          rampenissen: "«Det står på skiltet. Han har skrive det på SKILTET.»",
          valg: [
            { tekst: "Og hvordan holder vi en glovarm boks?", neste: "vott" },
            { tekst: "Skjønner!" },
          ],
        },
        vott: {
          tekst:
            "«Med votten. Hjerteruds grytevott. Den er ikke her. Jeg har ikke tatt den. Hvis dere finner den under noe jeg sitter på, så var det Rudolf.»",
          rampenissen: "«Æ sei det te Hjerterud. Æ sei det med glede.»",
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
            "«Hjerterud har gjemt ei flaske et sted her inne. Hun tror jeg ikke vet hvor. Jeg vet hvor. Jeg vet ikke hvor dere skal smøre den, men jeg erklærer herved nødsituasjon, så alt merket NØD er åpent.»",
          valg: [{ tekst: "Herved notert." }],
        },
        landaas: {
          tekst:
            "«Jeg har risset en L i peileskiva, der Landås ligger, og en N for nord. Men skiva vet ikke hvor nord er. Det gjør nåla på tavla mi. Den må flyte i vann. Ikke ligge på is, is er ikke vann. Og når antenna står rett, må mottakeren i hytta stå på Landås. Tallet står på en lapp der inne.»",
          rampenissen:
            "«Nål, vann, nord, L, lapp. Æ skreiv det på handa. Æ skreiv det på feil hand, men det står der.»",
          valg: [{ tekst: "Nål, vann, nord, L, lapp. Skjønner." }],
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
      maal: "Kom inn i hytta ved antenna. Døra har kodelås, og skiltet sier TELL.",
      tips: [
        R +
          "«Nåkka av metall som hold på varmen, sa IQ. Boksen hans ligg i hytta ved antenna. Men døra har kodelås, og skiltet på døra sei meir enn det burde.»",
        R +
          "«Skiltet sei TELL. Lamper på masta, kabler i snøen, reinsdyr. SE på lampa, SE på kablan, og tell reinsdyr. Det går fort.»",
        R +
          "«Ei lampe, tre kabla, en Rudolf. BRUK hytta og still hjulan på 1, 3 og 1.»",
      ],
    },
    {
      id: "rudolf",
      ferdig: "rudolf_flyttet",
      maal: "Få Rudolf vekk fra kabelen.",
      kjent: {},
      tips: [
        R +
          "«Rudolf går ikkje fra kabelen frivillig. Han treng nåkka BEDRE å tygge på. Alt e bedre med sirup, sei IQ. Rudolf e enig.»",
        R +
          "«Sirup har Hjerterud gjømt i verkstedet, og nøden ligg i en skuff. I lag blir det nåkka Rudolf vil ha.»",
        R +
          "«Ta sirupen fra hylla og knekkebrødet fra skuffen i sidebordet. Trykk på sirupen i lomma, så på knekkebrødet. Gi det te Rudolf.»",
      ],
    },
    {
      id: "tannhjul",
      ferdig: "tannhjul_tint",
      maal: "Tin tannhjulet nederst på masta. Noe av metall, og varmt.",
      kjent: {},
      tips: [
        R +
          "«Tannhjulet nederst på masta e frosse. Det treng nåkka varmt av metall inntil sæ. Lenge. Håndvarmeren e ikkje nok, den e lunken som en unnskyldning.»",
        R +
          "«Blikkboksen kan varmes på radiorøran hos IQ. Men ikkje med fingran. Hjerterud sin grytevott heng under krakken te IQ. Boks og vott i lag først.»",
        R +
          "«Kombiner boksen og grytevotten i lomma. Bruk dem på radiorøran. Fly te tjernet og hold den varme boksen mot tannhjulet.»",
      ],
    },
    {
      id: "kopp",
      ferdig: "kopp_tint",
      maal: "Tin isen i koppen på peileskiva.",
      tips: [
        R +
          "«Nåla ska flyte i vann, sei IQ. Koppen på skiva e full av is. Is e ikkje vann, samme ka isen sei.»",
        R +
          "«Vi har allerede nåkka som tine is. Boksen e kald igjen, men røran hos IQ e ikkje det.»",
        R +
          "«Varm boksen på radiorøran en gang te, og hold den mot koppen på peileskiva.»",
      ],
    },
    {
      id: "peiling",
      ferdig: "antenne_peilet",
      maal: "Få antenna til å finne retningen mot Landås. Noe som vet hvor nord er.",
      tips: [
        R +
          "«Antenna snurre, koppen har vann, og IQ har rissa en L i skiva. No mangle bare nåkka som veit kor nord e.»",
        R +
          "«Nåla på tavla hos IQ peke bestandig mot nord. Ta ho med, med kork og alt.»",
        R +
          "«Ta magnetnåla fra tavla og bruk den på peileskiva på masta. Så finn antenna L sjøl.»",
      ],
    },
    {
      id: "mottaker",
      ferdig: "k2_ferdig",
      maal: "Still mottakeren i hyttevinduet på riktig tall.",
      tips: [
        R +
          "«Antenna står rett, men bildet e snø. Mottakeren i hyttevinduet suse. Nån har rørt rattet. Æ sei ikkje kem.»",
        R +
          "«IQ skriv alt på lappa. SE på benken i hytta. Der står tallet mottakeren ska stå på.»",
        R +
          "«BRUK mottakeren i vinduet og dra rattet te 90,0. Når søylene e fulle, trykk LÅS FREKVENS.»",
      ],
    },
  ],
};
