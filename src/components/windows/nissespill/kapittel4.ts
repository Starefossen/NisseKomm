/**
 * Kapittel 4: «Klar til avgang» (dag 22). The gate has stood open since the
 * solstice and Winter holds the departure list: Julius' glasses (a letter bird
 * broods on them), Rampenissen's lucky bell from chapter 1 (behind the wood
 * box), and the screaming right gate wing (tallow from the gate lantern). Ends
 * with Julius' thumbs-up. Side story only: no clues or codes for the daily
 * puzzles. Rampenissen speaks nordlandsk, everyone else bokmål.
 *
 * Images: reuses spill/port-aapen.jpg and feed/julius-kontor.jpg. No new
 * images required. Optional:
 * - spill/port-winter.jpg: the open gate with Winter beside the right post,
 *   clipboard and three scarves, a packed sleigh visible through the arch.
 */
import type { Kapittel } from "./motor";

const R = "Rampenissen: ";

export const KAPITTEL_4: Kapittel = {
  n: 4,
  tittel: "Klar til avgang",
  dag: 22,
  klar: true,
  start: "porten",
  slutt: "k4_ferdig",
  intro: [
    R +
      "«Dokker! Det e snart. Porten står åpen, sleden e pakka, og Winter står ved porten med ei LISTE. Tre punkt. Ingen flyg før alle tre e kryssa av.»",
    R +
      "«Julius finn ikkje brillan sine. Lykkebjella mi, den vi redda fra postkassen, e BORTE fra knaggen. Og porten hyle som en katt kvar gang nån tar i den.»",
    R +
      "«Knerten står ved porten. Snakk med Winter først, han har lista. Så Julius på kontoret. Dokker kan dette no. TIPS-knappen e her vess det låse sæ.»",
  ],
  utro:
    R +
    "«Briller, bjelle, port. Tre av tre. Sleden e klar, og lykkebjella mi heng der ho ska, så Julius finn fram te stua dokkers. Det va dokker som gjord det. Heile veien, fra postkassa te porten. Æ ... æ må gå og finn ei klementin. Det e nåkka i øyet. Over og ut. Og god jul!»",
  gjenstander: {
    fjaer: {
      id: "fjaer",
      navn: "Fjærpenn",
      ikon: "feather",
      se: "Julius' fjærpenn, med grønt blekk på spissen og en veldig myk fjær i den andre enden. Den kiler bare av å se på den.",
    },
    klementin: {
      id: "klementin",
      navn: "Klementin",
      ikon: "sun",
      se: "En rund, blank klementin fra skåla i vinduskarmen. Rampenissen ser på den gjennom skjermen. Du hører ham svelge.",
    },
    briller: {
      id: "briller",
      navn: "Julius' briller",
      ikon: "sunglasses",
      se: "Runde lesebriller med gullinnfatning. Litt varme, og med ei lita fjær på det ene glasset. Noen har ruget på dem.",
    },
    magnet: {
      id: "magnet",
      navn: "Hestesko-magnet",
      ikon: "zap",
      se: "En rød hestesko-magnet. Den holdt fast tre lapper på skapet til taletrakten. Nå holder den fast i Knertens fot. Hun får den løs. Så vidt.",
    },
    hyssing: {
      id: "hyssing",
      navn: "Rød hyssing",
      ikon: "spinner",
      se: "En lang rød tråd fra brevbunken. Sterk nok til å holde hundre brev fra Bergen sammen, og de er tunge av regn.",
    },
    fiskesnoere: {
      id: "fiskesnoere",
      navn: "Magnet i hyssing",
      ikon: "fish",
      se: "Hestesko-magneten knyttet fast i enden av den røde hyssingen. Ei fiskestang for ting som ikke er fisk.",
    },
    bjelle: {
      id: "bjelle",
      navn: "Lykkebjella",
      ikon: "bell",
      se: "Rampenissens lykkebjelle, med den røde garntråden fra garnkurven. Litt støv, litt vedflis. Den gnistrer fortsatt.",
    },
    talgstump: {
      id: "talgstump",
      navn: "Talgstump",
      ikon: "fire",
      se: "En myk, fet stump av talglyset fra lanterna. Lukter litt sau. Glir mellom fingrene. Akkurat det et rustent hengsel drømmer om.",
    },
  },
  kombinasjoner: [
    {
      a: "magnet",
      b: "hyssing",
      gir: "fiskesnoere",
      tekst:
        "Du knytter hyssingen rundt magneten med en dobbel knute. Knerten strammer med nebbet. " +
        R +
        "«Fiskestang! Æ fiska en gang. Æ fikk en sokk. Det va min egen sokk.»",
    },
  ],
  scener: [
    {
      id: "porten",
      navn: "Porten til Snøfall",
      bilde: "spill/port-aapen.jpg",
      utganger: [{ til: "kontor", navn: "Fly opp til Julius' kontor" }],
      hotspots: [
        {
          id: "himmelen",
          navn: "Himmelen",
          rect: { x: 0, y: 0, w: 100, h: 12 },
          smart: "se",
          se: "Grønne slør over takene og stjerner mellom dem. Det er den slags himmel en slede liker.",
        },
        {
          id: "urtaarnet",
          navn: "Urtårnet",
          rect: { x: 56, y: 10, w: 8, h: 20 },
          smart: "se",
          se: "Urtårnet med de fire viserne. Den fjerde viseren, «tid til neste julekake», er fortsatt bøyd. Den peker nå på «snart». Det stemmer.",
        },
        {
          id: "husene_v",
          navn: "Husene til venstre",
          rect: { x: 0, y: 14, w: 30, h: 32 },
          smart: "se",
          se: "Gule og røde tømmerhus med røyk fra pipene. I ett vindu står en nisse og pakker. I et annet står en nisse og pakker opp det den første pakket. De er brødre.",
        },
        {
          id: "husene_h",
          navn: "Husene til høyre",
          rect: { x: 66, y: 12, w: 34, h: 34 },
          smart: "se",
          se: "Bak muren ligger hele Snøfall med lys i alle vinduer. Et sted der inne står IQs verksted. Det summer ikke i kveld. Det er første gang.",
        },
        {
          id: "portbuen",
          navn: "Portbuen",
          rect: { x: 38, y: 12, w: 24, h: 30 },
          smart: "se",
          se: "En portbue av stein og tømmer, med snø på taket og to drager skåret ut øverst. Dragene ser på hverandre. De har gjort det i tre hundre år. De er ikke ferdige med å snakke.",
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
                "Lanterna lyser videre, med et litt kortere lys. Haspen er lukket igjen. Winter lukket den selv.",
            },
            {
              tekst:
                "Ei lanterne av jern og glass med et tykt talglys inni. Flammen er gul og rolig. Lanterna er lukket med en liten hasp.",
            },
          ],
          ta: {
            item: "talgstump",
            hvis: "winter_talg",
            tekst:
              "Winter åpner haspen med to fingre og ser en annen vei. Du klyper av en myk stump av talglyset. Én. Han sa én.",
          },
          bruk: [
            {
              hvis: "tok_talgstump",
              tekst: "Du har fått din stump. Winter telte.",
            },
            {
              tekst:
                "Lanterna er lukket med en liten hasp. Winter ser på deg. Du ser på Winter. Winter ser på haspen.",
            },
          ],
        },
        {
          id: "lanterne_h",
          navn: "Lanterna til høyre",
          rect: { x: 60, y: 52, w: 6, h: 13 },
          smart: "se",
          se: "Samme lanterne som til venstre, bare speilvendt. Flammen inni lener seg mot venstre, som om den savner noen.",
        },
        {
          id: "sleden",
          navn: "Sleden",
          rect: { x: 44, y: 54, w: 10, h: 20 },
          smart: "bruk",
          se: [
            {
              hvis: "bjelle_montert",
              tekst:
                "Julius' slede står rett innenfor porten, pakket og pusset, og i tømmene henger lykkebjella og gnistrer. Nå finner den fram.",
            },
            {
              tekst:
                "Julius' slede står rett innenfor porten, pakket og pusset. Det mangler noe i tømmene. Noe lite som pleier å klinge.",
            },
          ],
          bruk: "Du klapper på sleden. Den er kald og blank og klar. Den venter bare på en bjelle og en nisse.",
          bruker: [
            {
              item: "bjelle",
              hvis: "briller_levert",
              uten: "bjelle_montert",
              flagg: "bjelle_montert",
              forbruker: true,
              tekst:
                "Du knytter lykkebjella fast i tømmene med den røde garntråden. Den klinger ikke. Den gnistrer. Winter krysser av punkt to uten å se opp. " +
                R +
                "«BJELLA MI! På sleden! No finn han fram. No finn han HEIM.»",
            },
            {
              item: "bjelle",
              tekst:
                "Winter løfter én finger uten å se opp fra listen. «Punkt to før punkt én? Nei.» Du tar bjella med deg igjen. " +
                R +
                "«Han e umulig. Men han har ei liste, og lista e lov. Brillan først.»",
            },
          ],
          feil: {
            klementin:
              "Du legger klementinen i sleden. Winter: «Last registreres av Nissemor, ikke av ugler.» Du tar den igjen.",
            fiskesnoere:
              "Du fisker i sleden. Du får en vott. Winter noterer: «Vott. Funnet.»",
          },
        },
        {
          id: "hengslet",
          navn: "Hengslet på høyre portfløy",
          rect: { x: 53, y: 56, w: 6, h: 20 },
          smart: "bruk",
          se: [
            {
              hvis: "k4_ferdig",
              tekst:
                "Høyre portfløy står vidåpen og stille. Hengslet skinner av talg. Winter har notert «smurt» med stor, pen skrift.",
            },
            {
              tekst:
                "Høyre portfløy står halvveis åpen, og hengslet er rødt av rust. Hver gang vinden tar i porten, hyler den så hele Snøfall hører det.",
            },
          ],
          bruk: [
            {
              hvis: "k4_ferdig",
              tekst: "Du dytter portfløyen. Ikke en lyd. Winter nikker.",
            },
            {
              tekst:
                "Du dytter portfløyen. HYYYYL. Winter holder seg for ørene. Rudolf, et sted langt borte, svarer.",
            },
          ],
          bruker: [
            {
              item: "talgstump",
              uten: "k4_ferdig",
              flagg: "k4_ferdig",
              forbruker: true,
              tekst:
                "Du gnir talg inn i hengslet. En gang. To. Portfløyen glir opp, stille som snø, og står vidåpen. Winter krysser av. Tre av tre. Oppe i kontorvinduet står Julius med brillene på nesa og løfter tommelen. " +
                R +
                "«TOMMEL OPP FRA JULIUS! Det e den høgaste utmerkelsen i Snøfall. Høgare enn medalje.»",
            },
          ],
          feil: {
            klementin:
              "Du gnir klementinskall på hengslet. Nå hyler det og lukter godt.",
            fiskesnoere:
              "Du fisker etter hengslet. Magneten klikker fast. Du drar. Hengslet hyler. Du slipper.",
            bjelle:
              "Du henger bjella på hengslet. Nå hyler det med bjelle på. Winter: «Nei.»",
          },
        },
        {
          id: "skiene",
          navn: "Skiene",
          rect: { x: 64, y: 58, w: 6, h: 22 },
          smart: "se",
          se: "To par ski lent mot muren. Det ene paret er for en nisse. Det andre er for en rein. Rudolf har aldri brukt dem. Han vil ikke snakke om det.",
        },
        {
          id: "winter",
          navn: "Winter",
          rect: { x: 72, y: 58, w: 14, h: 28 },
          smart: "snakk",
          snakk: "winter",
          se: "Winter står ved høyre portstolpe med skriveplate og blyant. To runder med skjerf i dag. Bare to. Han har krysset av ingenting ennå, og blyanten er spisset til en nål.",
          bruk: "Du prikker Winter på armen. Han noterer: «Prikket. Igjen. Kl. 17.12.»",
        },
        {
          id: "muren",
          navn: "Muren",
          rect: { x: 0, y: 50, w: 36, h: 24 },
          smart: "se",
          se: "En lav steinmur med snø på toppen, bygd for lenge siden av noen som ville holde varmen inne, ikke folk ute. Steinen er varm der sola har vært. Det har den ikke vært på lenge.",
        },
        {
          id: "veien",
          navn: "Veien",
          rect: { x: 20, y: 80, w: 60, h: 20 },
          smart: "se",
          se: "Snøen foran porten er tråkket flat av støvler og hover. Ett spor går i sirkel tre ganger og ender ved lanterna. Det er reinsdyrspor. Han ville bare se på lyset.",
          bruk: "Knerten tegner en ugle i snøen med foten. Den ligner. Litt.",
        },
      ],
    },
    {
      id: "kontor",
      navn: "Julius' kontor",
      bilde: "spill/julius-kontor.jpg",
      utganger: [{ til: "porten", navn: "Ned til porten" }],
      hotspots: [
        {
          id: "juletreet",
          navn: "Juletreet",
          rect: { x: 4, y: 0, w: 30, h: 76 },
          smart: "se",
          se: "Juletreet, nå med fire småkaker færre enn sist. Knerten ser i gulvet. Knerten vet ingenting om småkaker.",
        },
        {
          id: "vedkassa",
          navn: "Vedkassa",
          rect: { x: 0, y: 78, w: 16, h: 22 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_bjelle",
              tekst:
                "Vedkassa ved foten av treet. Sprekken bak den er tom nå, bortsett fra tre nøtter og en knapp. De får ligge.",
            },
            {
              tekst:
                "Ei vedkasse av tre ved foten av treet. Mellom kassa og veggen er det en sprekk, smal som en blyant. Noe blinker der nede. Noe som gnistrer.",
            },
          ],
          bruk: [
            {
              hvis: "tok_bjelle",
              tekst: "Tom sprekk. Tre nøtter. En knapp. Fred.",
            },
            {
              tekst:
                "Knerten stikker nebbet ned i sprekken. For trangt. Hun stikker foten ned. For trangt. Hun stikker hodet ned. Nei. " +
                R +
                "«For trangt for hender og ugler. Men ikkje for nåkka på ei snor.»",
            },
          ],
          bruker: [
            {
              item: "fiskesnoere",
              uten: "tok_bjelle",
              flagg: "tok_bjelle",
              gir: "bjelle",
              forbruker: true,
              tekst:
                "Du senker magneten ned i sprekken. Den svinger, den leter ... KLIKK. Du drar forsiktig opp, og der kommer lykkebjella, med rød garntråd og litt vedflis. " +
                R +
                "«DER E HO! Æ visste det. Æ visste det ikkje. Men æ håpa.»",
            },
          ],
          feil: {
            magnet:
              "Du slipper magneten ned i sprekken. KLIKK, den sitter fast i bjella der nede. Og du når ikke ned. Knerten river den opp igjen med nebbet. Du trenger noe å senke den ned MED.",
            hyssing:
              "Du senker hyssingen ned. Den henger der og gjør ingenting. Bjella er ikke imponert. Noe må sitte i enden.",
            fjaer:
              "Du stikker fjærpennen ned i sprekken. Det kiler bjella. Den ler ikke.",
            klementin:
              "Du triller klementinen inn i sprekken. Nå er det to ting der nede. Knerten får den ut igjen etter en stund. Dette gikk feil vei.",
          },
        },
        {
          id: "lampa",
          navn: "Lampa",
          rect: { x: 36, y: 14, w: 7, h: 14 },
          smart: "se",
          se: "Vegglampa lyser som vanlig. Under den henger en tom knagg. Det er der bjella pleier å henge. Pleide.",
        },
        {
          id: "bokhylla",
          navn: "Bokhylla",
          rect: { x: 42, y: 0, w: 12, h: 30 },
          smart: "se",
          se: "«Alt om sirup» er lånt ut. Det står en lapp i hullet: «LÅNT. – IQ». Under står det «LÅNT FRA IQ. – RUDOLF». Rudolf kan ikke skrive. Noen hjalp ham.",
        },
        {
          id: "bamsen",
          navn: "Bamsen",
          rect: { x: 43, y: 30, w: 8, h: 10 },
          smart: "se",
          se: "Bamsen med ett øye har fått ny sløyfe til jul. Han ser ikke mer begeistret ut enn vanlig. Innvendig jubler han.",
        },
        {
          id: "vinduet",
          navn: "Vinduet",
          rect: { x: 56, y: 0, w: 40, h: 40 },
          smart: "se",
          se: "Gjennom buevinduet ser du porten der nede, vidåpen og gul av lys, og en liten figur med skriveplate som ikke har rørt seg på en time.",
        },
        {
          id: "lysene",
          navn: "Lysene i vinduskarmen",
          rect: { x: 65, y: 46, w: 11, h: 13 },
          smart: "se",
          se: "Begge lysene brenner i kveld. Nissemor sier de skal brenne hver kveld til sleden er hjemme igjen. Hun har kjøpt inn mange lys.",
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
                "Skåla med nøtter og én klementin mindre. Nøttene merker ingenting.",
            },
            {
              tekst:
                "Ei skål med nøtter og klementiner. Klementinene er runde og blanke og ser ut som små soler. Rampenissen sukker gjennom skjermen.",
            },
          ],
          ta: {
            item: "klementin",
            tekst:
              "Du tar den rundeste klementinen. " +
              R +
              "«Ikkje spis den. Ikkje spis den. Æ sei det te mæ sjøl òg.»",
          },
          bruk: "Én klementin er nok. Resten er til Julius. Han trenger energi.",
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
                "Taletrakten og skapet med plugger. Tre lapper ligger på gulvet nå som magneten er borte. Den øverste: «RING LANDÅS JULAFTEN. IKKE GLEM.»",
            },
            {
              tekst:
                "Taletrakten og skapet med plugger. På skapdøra holder en rød hestesko-magnet tre lapper fast. Den øverste: «RING LANDÅS JULAFTEN. IKKE GLEM.»",
            },
          ],
          ta: {
            item: "magnet",
            tekst:
              "Du tar hestesko-magneten. Tre lapper seiler ned på gulvet. Du legger dem pent på skapet. Julius glemmer ikke. Han har tre lapper.",
          },
          bruk: "Du blåser i trakten. Ute ved tjernet sier IQ «hva i all verden». Han sier det hver gang.",
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
                "Julius sitter i stolen med brillene på nesa og listen i fanget. Han leser sakte og smiler for hvert navn.",
            },
            {
              tekst:
                "Julius sitter i stolen og myser mot den åpne boka. Han holder den helt opp mot nesa. Så langt fra nesa. Så opp igjen. Det hjelper ikke.",
            },
          ],
          bruk: "Du setter deg på Julius' skulder. Han klapper deg på hodet uten å se. «Knerten. Du lukter talg.»",
          bruker: [
            {
              item: "briller",
              uten: "briller_levert",
              flagg: "briller_levert",
              forbruker: true,
              tekst:
                "Julius tar brillene, blåser bort ei fjær og setter dem på nesa. «Å.» Han ser ned på listen. «Å!» Han ser på deg. «Knerten, du har sot på nebbet.» Nede ved porten krysser Winter av punkt én. " +
                R +
                "«Han ser! Han ser lista! Han ser Knerten sitt skitne nebb!»",
            },
          ],
          feil: {
            klementin:
              "Julius tar klementinen, takker og legger den i lomma. Så gir han den tilbake. «Du trenger den til noe, tror jeg. Jeg ser det på deg. Jeg ser ikke mye, men det ser jeg.»",
            fjaer:
              "Du kiler Julius under nesa med fjærpennen. Han nyser så listen flyr. Du henter den.",
            bjelle:
              "Julius lytter. «Rampenissens bjelle. Den skal på sleden, ikke på meg.»",
            fiskesnoere:
              "Du fisker etter Julius. Magneten setter seg fast i brillekjedet hans. Det er ikke briller i det. Bare kjede.",
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
                "Brevbunken fra Bergen ligger løs nå. Den holder seg likevel. Brevene liker hverandre.",
            },
            {
              tekst:
                "Brev til Julius, bundet med en lang rød hyssing. Bunken fra Bergen er tykkest. Den er alltid tykkest.",
            },
          ],
          ta: {
            item: "hyssing",
            tekst:
              "Du løsner den røde hyssingen fra bunken og vikler den opp. Lang. Sterk. Brevene blir liggende pent. De har vært på reise, de vet hvordan man oppfører seg.",
          },
          bruk: "Brevene ligger løst og pent. Du lar dem ligge.",
        },
        {
          id: "boka",
          navn: "Den tykke boka",
          rect: { x: 17, y: 78, w: 12, h: 12 },
          smart: "se",
          se: "Den brune boka uten tittel. Du åpner den igjen. «Takk, se: det man sier når noen har gjort noe uten å bli bedt.» Du lukker den.",
        },
        {
          id: "blekkhuset",
          navn: "Blekkhuset",
          rect: { x: 35, y: 81, w: 6, h: 9 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_fjaer",
              tekst: "Blekkhuset uten penn. Blekket er fortsatt grønt.",
            },
            {
              tekst:
                "Blekkhuset med fjærpennen i. Fjæra er lang og myk og vipper hver gang noen puster.",
            },
          ],
          ta: {
            item: "fjaer",
            tekst:
              "Du drar fjærpennen opp av blekkhuset. En grønn dråpe faller på skrivebordet og blir til en liten gran. Nesten.",
          },
          bruk: "Grønt blekk. Du dypper ikke nebbet. Du har lært det også.",
        },
        {
          id: "brevfuglen",
          navn: "Brevfuglen",
          rect: { x: 56, y: 84, w: 9, h: 10 },
          smart: "bruk",
          se: [
            {
              hvis: "tok_briller",
              tekst:
                "Brevfuglen ruger på klementinen med lukkede øyne og dyp tilfredshet. Hun tror det er verdens fineste egg. Ingen sier noe annet.",
            },
            {
              hvis: "fugl_kilt",
              tekst:
                "En liten grå brevfugl sitter på skrivebordet ved den åpne boka. Du vet hva hun ruger på nå: briller. Hun vet at du vet. Hun flytter seg ikke.",
            },
            {
              tekst:
                "En liten grå brevfugl sitter på skrivebordet ved den åpne boka og ruger. På hva? Hun sitter helt i ro og ser på deg med ett øye. Det andre sover.",
            },
          ],
          bruk: [
            {
              hvis: "tok_briller",
              tekst:
                "Du stryker fuglen over ryggen. Hun kurrer. Klementinen er trygg.",
            },
            {
              tekst:
                "Du dytter forsiktig på fuglen. Hun dytter ikke tilbake. Hun bare blir. Brevfugler er laget av tålmodighet og fjær.",
            },
          ],
          bruker: [
            {
              item: "fjaer",
              uten: "fugl_kilt",
              flagg: "fugl_kilt",
              tekst:
                "Du kiler fuglen under vingen med fjærpennen. Hun fniser, en brevfugl-fnis, og letter en centimeter. Under henne: Julius' briller! Så setter hun seg igjen. " +
                R +
                "«Brevfugla ruge på alt som e rundt og blankt. Gi ho nåkka ANNA rundt, så flytte ho sæ.»",
            },
            {
              item: "fjaer",
              hvis: "fugl_kilt",
              tekst:
                "Du kiler henne igjen. Hun fniser igjen. Brillene glimter igjen. Hun setter seg igjen. Dette kan dere holde på med hele kvelden.",
            },
            {
              item: "klementin",
              uten: "tok_briller",
              flagg: "tok_briller",
              gir: "briller",
              forbruker: true,
              tekst:
                "Du legger klementinen ved siden av fuglen. Hun ser på den. Hun ser på brillene. Klementinen er rundere. Hun flytter seg over på klementinen med et lite, fornøyd pip, og du plukker opp brillene. " +
                R +
                "«Byttehandel! Og ho fikk den beste delen, spør du mæ.»",
            },
          ],
          feil: {
            hyssing:
              "Du legger hyssingen rundt fuglen. Hun ser på den som om du har gitt henne et skjerf. Det er ikke helt feil.",
            magnet: "Brevfugler er ikke magnetiske. Du sjekket. Nå vet du.",
            fiskesnoere:
              "Du fisker etter fuglen. Hun ser på magneten som svinger forbi, og gjesper.",
          },
        },
        {
          id: "lupa",
          navn: "Lupa",
          rect: { x: 46, y: 74, w: 16, h: 7 },
          smart: "se",
          se: "Julius' lupe. Han har prøvd å lese listen med den. Bokstavene ble store, men like uklare. Store og uklare er verre.",
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
                "Snill-listen ligger åpen, og Julius leser den selv nå. Du kikker ikke. Knerten kikker ikke. Nesten ikke.",
            },
            {
              tekst:
                "Snill-listen ligger åpen på skrivebordet. Julius holder hånda over den. «Ikke før brillene. Jeg vil lese den selv.»",
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
                "«Avgangslisten er komplett. Tre av tre. Jeg har aldri hatt tre av tre. Jeg vet ikke helt hva jeg skal gjøre med hendene.»",
            },
            {
              hvis: "winter_snakket",
              tekst:
                "«Avgangslisten. Punkt én: briller. Punkt to: bjelle. Punkt tre: port. I den rekkefølgen. Jeg gjentar ikke mer enn tre ganger, og dette var nummer to.»",
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
              tekst: "Kan vi få litt talg fra lanterna?",
              hvis: "bjelle_montert",
              uten: "winter_talg",
              neste: "talg",
              flagg: "winter_talg",
            },
            {
              tekst: "Kan vi få litt talg fra lanterna?",
              hvis: "winter_snakket",
              uten: "bjelle_montert",
              neste: "talg_nei",
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
            "«Punkt én: Julius leser Snill-listen. Han finner ikke brillene sine. Punkt to: lykkebjella henger på sleden. Den er borte fra knaggen. Punkt tre: høyre portfløy smøres. Den hyler. Rekkefølgen er bindende.»",
          rampenissen:
            "«Bjella MI? Æ hang ho på knaggen hos Julius! ... Æ trur æ hang ho der.»",
          valg: [
            { tekst: "Hvorfor i den rekkefølgen?", neste: "rekkefolge" },
            { tekst: "Vi fikser det." },
          ],
        },
        rekkefolge: {
          tekst:
            "«Fordi Julius må lese listen før han flyr, bjella må henge før porten åpnes helt, og porten åpnes sist, så ingen flyr før de to første er gjort. Det er ikke byråkrati. Det er omsorg med nummer på.»",
          rampenissen:
            "«Omsorg med nummer på. Det e det peneste han har sagt.»",
          valg: [{ tekst: "Skjønner." }],
        },
        talg: {
          tekst:
            "«Lanternene er offentlig belysning, paragraf 14.» Han ser på listen. På bjella i tømmene. På porten. «Paragraf 15: avgangen går foran alt. Jeg åpner haspen. Ta en stump. Én.»",
          rampenissen: "«ÉN. Han sa én. Ta én. Ikkje to. Æ kjenne dokker.»",
          valg: [{ tekst: "Én stump. Takk, Winter." }],
        },
        talg_nei: {
          tekst:
            "«Punkt tre kommer etter punkt to. Jeg åpner ingen lanterne før bjella henger på sleden. Det er systemet, og systemet er varmt i dag.»",
          valg: [{ tekst: "Vi kommer tilbake med bjella." }],
        },
        hyl: {
          tekst:
            "«Fordi ingen har smurt den siden den sist var helt åpen. Det er lenge siden. Jeg har sendt tre klager. Til meg selv. Jeg har ikke svart.»",
          rampenissen: "«Han klage te sæ sjøl. Æ elske han litt.»",
          valg: [{ tekst: "Vi finner noe fett." }],
        },
        skjerf: {
          tekst:
            "Winter ser ned på skjerfet. «To runder i dag. Det er mildere. Jeg vet ikke hvorfor. Det er ingen paragraf for det.» Han retter på skriveplaten. «Jeg har det bra. Takk for at du spurte. Ingen spør.»",
          rampenissen: "«Han har tatt av en runde! Det e tøvær i Winter!»",
          valg: [{ tekst: "Vi spør igjen i morgen." }],
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
                "«Tre av tre, sier Winter. Jeg har aldri sett ham så ... fornøyd? Han smilte nesten. Nesten. Og du, Knerten: hils Rampenissen og si at bjella henger. Han vet det. Si det likevel.»",
            },
            {
              hvis: "briller_levert",
              tekst:
                "«Brillene! Nå ser jeg listen. Og nå ser jeg deg, Knerten. Du har fortsatt sot på nebbet.»",
            },
            {
              tekst:
                "«Knerten! Kom hit. Jeg ser ikke stort uten brillene mine. Jeg la dem her ved boka i går kveld, og nå er det bare ... fjær der. Og noe som ser på meg.»",
            },
          ],
          valg: [
            {
              tekst: "Hvor er brillene dine?",
              uten: "briller_levert",
              neste: "briller",
            },
            {
              tekst: "Hva med lykkebjella?",
              hvis: "briller_levert",
              neste: "bjelle",
            },
            {
              tekst: "Hva med lykkebjella?",
              uten: "briller_levert",
              neste: "bjelle_senere",
            },
            { tekst: "Hva står på listen?", neste: "liste" },
            { tekst: "Ha det, Julius." },
          ],
        },
        briller: {
          tekst:
            "«Ved boka. Under den brevfuglen. Hun kom med et brev fra Landås i natt, så brillene mine, og bestemte at de var et egg. Jeg har ikke hjerte til å jage henne. Hun har fløyet langt.»",
          rampenissen:
            "«Brevfugla ruge på alt som e rundt og blankt. Kil ho, så ser dokker. Og gi ho nåkka ANNA rundt.»",
          valg: [{ tekst: "Vi finner noe rundt." }],
        },
        bjelle: {
          tekst:
            "«Rampenissens bjelle? Den hang på knaggen under lampa. Så kom Rudolf innom for å låne en bok, og nå ligger den bak vedkassa. Det er for trangt for hender der. Og for ugler, er jeg redd.»",
          rampenissen:
            "«Rudolf. Sjølvsagt. For trangt for hender, men ikkje for nåkka på ei snor.»",
          valg: [{ tekst: "Vi fisker den opp." }],
        },
        bjelle_senere: {
          tekst:
            "«Bjella? Én ting om gangen, Knerten. Først må jeg se. Så kan vi lete.»",
          valg: [{ tekst: "Brillene først." }],
        },
        liste: {
          tekst:
            "«Navn. Alle som har hjulpet noen i år uten å bli bedt om det. Det er en lang liste. Den blir lengre hvert år, og det gjør meg gladere hvert år.»",
          rampenissen: "«Står æ der? Ikkje svar. Jo, svar. Nei. Ikkje svar.»",
          valg: [{ tekst: "Det er en fin liste." }],
        },
      },
    },
  },
  gaater: [
    {
      id: "briller",
      ferdig: "briller_levert",
      tips: [
        R +
          "«Julius finn ikkje brillan. Spør han kor han la dem. Han veit det, han ser dem bare ikkje.»",
        R +
          "«Brevfugla på skrivebordet ruge på nåkka. Kil ho med fjærpennen fra blekkhuset, så ser dokker ka. Og gi ho nåkka ANNA rundt å ruge på.»",
        R +
          "«Ta klementinen fra skåla i vinduskarmen og gi den te brevfugla. Så gir dokker brillan te Julius.»",
      ],
    },
    {
      id: "bjelle",
      ferdig: "bjelle_montert",
      tips: [
        R +
          "«Bjella ligg bak vedkassa hos Julius. For trangt for hender og ugler. Men ikkje for nåkka på ei snor.»",
        R +
          "«Magneten på skapet ved taletrakten, og den røde hyssingen rundt brevbunken. Saman blir det ei fiskestang.»",
        R +
          "«Kombiner magneten og hyssingen, fisk bjella opp bak vedkassa, og heng ho på sleden innenfor porten.»",
      ],
    },
    {
      id: "talg",
      ferdig: "tok_talgstump",
      tips: [
        R +
          "«Porten hyle. Hengslet treng fett. Ka e det som brenn i lanternan ved porten? Talg. Fett.»",
        R +
          "«Lanterna e lukka med hasp. Winter passe haspen. Spør han pent, no som punkt to e kryssa av.»",
        R +
          "«SNAKK med Winter og spør om talg fra lanterna. Så BRUK lanterna te venstre og ta en stump.»",
      ],
    },
    {
      id: "port",
      ferdig: "k4_ferdig",
      tips: [
        R + "«Talg i lomma, hengsel som hyle. Dokker veit ka som skjer no.»",
        R + "«Høyre portfløy. Hengslet.»",
        R + "«Bruk talgstumpen på hengslet på høyre portfløy.»",
      ],
    },
  ],
};
