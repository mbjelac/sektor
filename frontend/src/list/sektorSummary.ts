import { ScoredThroughput, Sektor, SektorStatus } from "../sektor/Sektor";
import { getSektorData } from "../sektor/sektor.api";
import { buildingDefinitions } from "../sektor/buildings/buildings";
import { locationPropertiesToLocations } from "../sektor/locationProperties";
import { getLocalResources, getNegativeScoringResources } from "../resources";
import { LOWEST_LEVEL } from "../playerLevel";
import { LARGEST_SEKTOR_SIZE } from "../../../shared/sektorSizes";
import { getSektorOwner } from "./sektorList.api";
import { displayedSektorStatus } from "../sektorStatus";

export interface SektorSummary {
  level: number;
  // How many tiles the sektor's map is across.
  size: number;
  status: SektorStatus;
  buildingCount: number;
  importTotal: number;
  exportTotal: number;
  score: number;
}

// The stored sektor is played through again so that everything shown about it — how far along it
// is, what it moves in and out, and what it scores — comes out of the same rules as in the sektor
// itself.
export function getSektorSummary(sektorId: string): SektorSummary {
  const owner = getSektorOwner(sektorId);
  const sektorData = getSektorData(sektorId);
  if (!sektorData) return { level: LOWEST_LEVEL, size: LARGEST_SEKTOR_SIZE, status: displayedSektorStatus(owner, "InProgress"), buildingCount: 0, importTotal: 0, exportTotal: 0, score: 0 };

  const sektor = new Sektor(
    locationPropertiesToLocations(sektorData.locationProperties),
    buildingDefinitions,
    {
      importRestrictions: sektorData.importRestrictions,
      exportRequirements: sektorData.exportRequirements,
    },
    getNegativeScoringResources(),
    getLocalResources(),
  );
  sektor.loadState({ buildings: sektorData.buildings });

  const sektorState = sektor.getSektorState();

  return {
    level: sektorData.level,
    // A sektor saved before sektors had sizes was made back when every sektor was of the one size
    // there was, which is the largest.
    size: sektorData.size ?? LARGEST_SEKTOR_SIZE,
    status: displayedSektorStatus(owner, sektorState.status),
    buildingCount: sektor.getState().buildings.length,
    importTotal: sumThroughputs(sektorState.imports),
    exportTotal: sumThroughputs(sektorState.exports),
    score: sumScores([...sektorState.imports, ...sektorState.exports]),
  };
}

function sumThroughputs(throughputs: { value: number }[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.value, 0);
}

function sumScores(throughputs: ScoredThroughput[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.score, 0);
}
