import type { ComponentType } from "react";
import Alfabetstrimmel from "./dager01-12/alfabetstrimmel";
import Dag01Ferdskriver from "./dager01-12/dag01-ferdskriver";
import Dag01Flylogg from "./dager01-12/dag01-flylogg";
import Dag01Frakt from "./dager01-12/dag01-frakt";
import Dag01Linjekort from "./dager01-12/dag01-linjekort";
import Dag01Tradkort from "./dager01-12/dag01-tradkort";
import Dag02Tallkort from "./dager01-12/dag02-tallkort";
import Dag03Frostlapp from "./dager01-12/dag03-frostlapp";
import Dag04Skokort from "./dager01-12/dag04-skokort";
import Dag05Brevfugl from "./dager01-12/dag05-brevfugl";
import Dag06Silhuetter from "./dager01-12/dag06-silhuetter";
import Dag07Frostlapp from "./dager01-12/dag07-frostlapp";
import Dag08Kretskort from "./dager01-12/dag08-lamper";
import Dag09Krystallark from "./dager01-12/dag09-krystallark";
import Dag10Fargekort from "./dager01-12/dag10-fargekort";
import Dag10Testark from "./dager01-12/dag10-testark";
import Dag11Tallkort from "./dager01-12/dag11-tallkort";
import Dag12FrostlappTredelt from "./dager01-12/dag12-frostlapp-tredelt";
import RunerFasit from "./dager01-12/runer-fasit";
import Runetavle from "./dager01-12/runetavle";
import Operasjonsbrett from "./dager01-12/operasjonsbrett";
import RodfilterRamme from "./dager01-12/rodfilter-ramme";
import Dag13Krydderkort from "./dager13-16/dag13-krydderkort";
import Dag13Gravskilt from "./dager13-16/dag13-gravskilt";
import Dag14Brettark from "./dager13-16/dag14-brettark";
import Dag14Serviettfugl from "./dager13-16/dag14-serviettfugl";
import Dag15Redskapskort from "./dager13-16/dag15-redskapskort";
import Dag16Sorteringslapper from "./dager13-16/dag16-sorteringslapper";

/** Printables in the <Utskrift> frame (days 1–16), per docs/gaater-2026.md; served by [fil]/page.tsx. */
export const SIDER_01_12: Record<string, ComponentType> = {
  alfabetstrimmel: Alfabetstrimmel,
  "dag01-ferdskriver": Dag01Ferdskriver,
  "dag01-flylogg": Dag01Flylogg,
  "dag01-frakt": Dag01Frakt,
  "dag01-linjekort": Dag01Linjekort,
  "dag01-tradkort": Dag01Tradkort,
  "dag02-tallkort": Dag02Tallkort,
  "dag03-frostlapp": Dag03Frostlapp,
  "dag04-skokort": Dag04Skokort,
  "dag05-brevfugl": Dag05Brevfugl,
  "dag06-silhuetter": Dag06Silhuetter,
  "dag07-frostlapp": Dag07Frostlapp,
  "dag08-lamper": Dag08Kretskort,
  "dag09-krystallark": Dag09Krystallark,
  "dag10-fargekort": Dag10Fargekort,
  "dag10-testark": Dag10Testark,
  "dag11-tallkort": Dag11Tallkort,
  "dag12-frostlapp-tredelt": Dag12FrostlappTredelt,
  "dag13-krydderkort": Dag13Krydderkort,
  "dag13-gravskilt": Dag13Gravskilt,
  "dag14-brettark": Dag14Brettark,
  "dag14-serviettfugl": Dag14Serviettfugl,
  "dag15-redskapskort": Dag15Redskapskort,
  "dag16-sorteringslapper": Dag16Sorteringslapper,
  operasjonsbrett: Operasjonsbrett,
  "rodfilter-ramme": RodfilterRamme,
  runetavle: Runetavle,
  "runer-fasit": RunerFasit,
};
