import { getSektorList } from "./list/sektorList.api";
import { getSektorSummary } from "./list/sektorSummary";
import { globalImportsAndExports, ImportsAndExports } from "./globalImportsAndExports";

// What the whole planet brings in and sends out while a player is building on one of its sektors.
// The sektor being built on is taken as it stands rather than as it was last stored, so that a
// building just put up counts towards the planet at once; it is left out of the stored sektors so
// that it is not counted twice over.
export function getPlanetImportsAndExportsWhileBuilding(
  sektorId: string | null,
  sektorImportsAndExports: ImportsAndExports,
): ImportsAndExports {
  const otherSektors = getSektorList()
    .filter(sektorListItem => sektorListItem.id !== sektorId)
    .map(sektorListItem => getSektorSummary(sektorListItem.id));

  return globalImportsAndExports([...otherSektors, sektorImportsAndExports]);
}
