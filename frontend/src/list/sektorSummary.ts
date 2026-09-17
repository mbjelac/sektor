import { ScoredThroughput, Sektor } from "../sektor/Sektor";
import { getSektorData } from "../sektor/sektor.api";
import { buildingDefinitions } from "../sektor/buildings/buildings";
import { locationPropertiesToLocations } from "../sektor/locationProperties";
import { getLocalResources, getNegativeScoringResources } from "../resources";
import { LOWEST_LEVEL } from "../playerLevel";

export interface SektorSummary {
  level: number;
  buildingCount: number;
  importTotal: number;
  exportTotal: number;
  score: number;
}

// The stored sektor is played through again so that everything shown about it — what it moves in
// and out, and what it scores — comes out of the same rules as in the sektor itself.
export function getSektorSummary(sektorId: string): SektorSummary {
  const sektorData = getSektorData(sektorId);
  if (!sektorData) return { level: LOWEST_LEVEL, buildingCount: 0, importTotal: 0, exportTotal: 0, score: 0 };

  const sektor = new Sektor(
    locationPropertiesToLocations(sektorData.locationProperties),
    buildingDefinitions,
    getNegativeScoringResources(),
    getLocalResources(),
  );
  sektor.loadState({ buildings: sektorData.buildings });

  const sektorState = sektor.getSektorState();

  return {
    level: sektorData.level,
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
