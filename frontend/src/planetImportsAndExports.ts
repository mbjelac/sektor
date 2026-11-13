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

// What the player's own sektors bring in and send out between them while they are building on one of
// the planet's sektors, set against each other just as the planet's are. The sektor being built on is
// taken as it stands, as it is for the planet, and counts only if it is the player's.
export function getPlayerImportsAndExportsWhileBuilding(
  sektorId: string | null,
  sektorImportsAndExports: ImportsAndExports,
  isShownSektorPlayers: boolean,
  playerName: string | null,
): ImportsAndExports {
  const otherPlayerSektors = getSektorList()
    .filter(sektorListItem => sektorListItem.id !== sektorId && playerName !== null && sektorListItem.owner === playerName)
    .map(sektorListItem => getSektorSummary(sektorListItem.id));

  return globalImportsAndExports(isShownSektorPlayers ? [...otherPlayerSektors, sektorImportsAndExports] : otherPlayerSektors);
}
