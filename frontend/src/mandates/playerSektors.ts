import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { getUsername } from "../login/login.api";
import { TriangleCoordinate } from "../list/planetGrid";
import { PlayerSektor } from "./sektorsMovingResource";

// A player's sektor, along with the triangle of the planet it lies on, whose biome stands beside it.
export type LocatedPlayerSektor = PlayerSektor & { location?: TriangleCoordinate };

// Every sektor the player owns, as it stands stored, which is how the map stores it on every change.
export function getPlayerSektors(): LocatedPlayerSektor[] {
  const playerName = getUsername();
  return getSektorList()
    .filter(sektorListItem => playerName !== null && sektorListItem.owner === playerName)
    .map(sektorListItem => {
      const sektorSummary = getSektorSummary(sektorListItem.id);
      return {
        sektorId: sektorListItem.id,
        sektorName: sektorListItem.name ?? sektorListItem.id,
        importsAndExports: sektorSummary,
        ecosystem: sektorSummary,
        location: sektorListItem.location,
      };
    });
}
