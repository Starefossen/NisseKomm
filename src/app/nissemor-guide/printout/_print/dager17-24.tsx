import type { ComponentType } from "react";
import Dag13Gravskilt from "./dager13-16/dag13-gravskilt";
import Dag14Serviettfugl from "./dager17-24/dag14-serviettfugl";
import Dag17Baandkort from "./dager17-24/dag17-baandkort";
import Dag17Losepengebrev from "./dager17-24/dag17-losepengebrev";
import Dag18Rosinkort from "./dager17-24/dag18-rosinkort";
import Dag19Bevislapper from "./dager17-24/dag19-bevislapper";
import Dag20Fortskilt from "./dager17-24/dag20-fortskilt";
import Dag20Putekort from "./dager17-24/dag20-putekort";
import Dag21Portkort from "./dager17-24/dag21-portkort";
import Dag22Sokkelapper from "./dager17-24/dag22-sokkelapper";
import Dag23Stjerner from "./dager17-24/dag23-stjerner";
import Dag24Krystallkort from "./dager17-24/dag24-krystallkort";
import Dag24Suvenirlapper from "./dager17-24/dag24-suvenirlapper";

/** Printables for days 17–24 and the prank signs, per docs/gaater-2026.md; served by [fil]/page.tsx. */
export const SIDER_17_24: Record<string, ComponentType> = {
  "dag13-gravskilt": Dag13Gravskilt,
  "dag14-serviettfugl": Dag14Serviettfugl,
  "dag17-baandkort": Dag17Baandkort,
  "dag17-losepengebrev": Dag17Losepengebrev,
  "dag18-rosinkort": Dag18Rosinkort,
  "dag19-bevislapper": Dag19Bevislapper,
  "dag20-fortskilt": Dag20Fortskilt,
  "dag20-putekort": Dag20Putekort,
  "dag21-portkort": Dag21Portkort,
  "dag22-sokkelapper": Dag22Sokkelapper,
  "dag23-stjerner": Dag23Stjerner,
  "dag24-krystallkort": Dag24Krystallkort,
  "dag24-suvenirlapper": Dag24Suvenirlapper,
};
