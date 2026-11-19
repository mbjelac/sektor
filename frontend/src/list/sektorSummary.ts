import { Sektor } from "../sektor/Sektor";
import { getSektorData } from "../sektor/sektor.api";
import { everyBuildingDefinition } from "../sektor/buildings/buildings";
import { locationPropertiesToLocations } from "../sektor/locationProperties";
import { getLocalResources } from "../resources";
import { ResourceThroughput } from "../../../shared/sektorData";
import { SektorEcosystem } from "../sektor/deforestation";

// How much the sektor's ecosystem was and is supported is what the player's sektors are told
// deforested by, between them.
export interface SektorSummary extends SektorEcosystem {
  // How polluted the sektor is where it does harm, and the most its polluting buildings can foul.
  pollution: number;
  pollutionFootprint: number;
  buildingCount: number;
  // What the sektor brings in and sends out of every resource it moves, which the sektors are added
  // up by into what the whole planet brings in and sends out.
  imports: ResourceThroughput[];
  exports: ResourceThroughput[];
  importTotal: number;
  exportTotal: number;
}

// The stored sektor is played through again so that what is shown about it — what it moves in and
// out, how much it supports its ecosystem and how polluted it is — comes out of the same rules as in the sektor itself.
export function getSektorSummary(sektorId: string): SektorSummary {
  const sektorData = getSektorData(sektorId);
  if (!sektorData) {
    return { buildingCount: 0, imports: [], exports: [], importTotal: 0, exportTotal: 0, initialEcosystemSupport: 0, ecosystemSupport: 0, pollution: 0, pollutionFootprint: 0 };
  }

  const sektor = new Sektor(
    locationPropertiesToLocations(sektorData.locationProperties),
    everyBuildingDefinition,
    getLocalResources(),
  );
  sektor.loadState({ buildings: sektorData.buildings });

  const sektorState = sektor.getSektorState();

  return {
    buildingCount: sektor.getState().buildings.length,
    imports: sektorState.imports,
    exports: sektorState.exports,
    importTotal: sumThroughputs(sektorState.imports),
    exportTotal: sumThroughputs(sektorState.exports),
    initialEcosystemSupport: sektorData.initialEcosystemSupport ?? 0,
    ecosystemSupport: sektorState.ecosystemSupport,
    pollution: sektor.findPollution(),
    pollutionFootprint: sektor.findPollutionFootprint(),
  };
}

function sumThroughputs(throughputs: { value: number }[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.value, 0);
}
