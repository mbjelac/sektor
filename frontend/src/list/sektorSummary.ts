import { Sektor } from "../sektor/Sektor";
import { getSektorData } from "../sektor/sektor.api";
import { buildingDefinitions } from "../sektor/buildings/buildings";
import { locationPropertiesToLocations } from "../sektor/locationProperties";
import { getLocalResources } from "../resources";
import { LOWEST_LEVEL } from "../playerLevel";
import { ResourceThroughput } from "../../../shared/sektorData";

export interface SektorSummary {
  level: number;
  buildingCount: number;
  // What the sektor brings in and sends out of every resource it moves, which the sektors are added
  // up by into what the whole planet brings in and sends out, and scored against.
  imports: ResourceThroughput[];
  exports: ResourceThroughput[];
  importTotal: number;
  exportTotal: number;
}

// The stored sektor is played through again so that what is shown about it — what it moves in and
// out — comes out of the same rules as in the sektor itself.
export function getSektorSummary(sektorId: string): SektorSummary {
  const sektorData = getSektorData(sektorId);
  if (!sektorData) {
    return { level: LOWEST_LEVEL, buildingCount: 0, imports: [], exports: [], importTotal: 0, exportTotal: 0 };
  }

  const sektor = new Sektor(
    locationPropertiesToLocations(sektorData.locationProperties),
    buildingDefinitions,
    getLocalResources(),
  );
  sektor.loadState({ buildings: sektorData.buildings });

  const sektorState = sektor.getSektorState();

  return {
    level: sektorData.level,
    buildingCount: sektor.getState().buildings.length,
    imports: sektorState.imports,
    exports: sektorState.exports,
    importTotal: sumThroughputs(sektorState.imports),
    exportTotal: sumThroughputs(sektorState.exports),
  };
}

function sumThroughputs(throughputs: { value: number }[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.value, 0);
}
