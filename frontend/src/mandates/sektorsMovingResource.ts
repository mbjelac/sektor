import { findThroughputValue, ImportsAndExports } from "../globalImportsAndExports";

// A sektor of the player, by the id it is stored under and the name it is known by, with what it
// brings in and sends out.
export interface PlayerSektor {
  sektorId: string;
  sektorName: string;
  importsAndExports: ImportsAndExports;
}

// How much of a resource a sektor of the player brings in and sends out.
export interface ResourceMovingSektor {
  sektorId: string;
  sektorName: string;
  imported: number;
  exported: number;
}

// The sektors which bring in or send out any of the resource, each with how much, in the order they
// were given. A sektor moving none of it has nothing to do with it, and is left out.
export function sektorsMovingResource(playerSektors: PlayerSektor[], resourceName: string): ResourceMovingSektor[] {
  return playerSektors
    .map(playerSektor => ({
      sektorId: playerSektor.sektorId,
      sektorName: playerSektor.sektorName,
      imported: findThroughputValue(playerSektor.importsAndExports.imports, resourceName),
      exported: findThroughputValue(playerSektor.importsAndExports.exports, resourceName),
    }))
    .filter(resourceMovingSektor => resourceMovingSektor.imported > 0 || resourceMovingSektor.exported > 0);
}

// Which column of the list of sektors moving a resource its sektors are put in order by.
export type SektorSortOrder = "sektor" | "imported" | "exported";

// Sektors by name, or the one moving most of the resource the asked way first. Sektors moving equally
// much keep the order their names put them in.
export function sortSektorsMovingResource(
  resourceMovingSektors: ResourceMovingSektor[],
  sortOrder: SektorSortOrder,
): ResourceMovingSektor[] {
  return [...resourceMovingSektors].sort((first, second) => {
    const byName = first.sektorName.localeCompare(second.sektorName);
    if (sortOrder === "imported") return second.imported - first.imported || byName;
    if (sortOrder === "exported") return second.exported - first.exported || byName;
    return byName;
  });
}

// What the player's sektors move of a resource between them: exported if they send out more of it than
// they bring in, imported if they bring in more than they send out, by the difference, or neither when
// the two cancel out.
export interface ResourceTotal {
  direction: "import" | "export" | null;
  amount: number;
}

export function resourceTotal(resourceMovingSektors: ResourceMovingSektor[]): ResourceTotal {
  const exportedMinusImported = roundToOneDecimal(resourceMovingSektors.reduce(
    (total, resourceMovingSektor) => total + resourceMovingSektor.exported - resourceMovingSektor.imported,
    0,
  ));
  if (exportedMinusImported > 0) return { direction: "export", amount: exportedMinusImported };
  if (exportedMinusImported < 0) return { direction: "import", amount: -exportedMinusImported };
  return { direction: null, amount: 0 };
}

// Amounts are written with a single decimal place, so rounding to it keeps the floating point noise
// out of the amounts added up from them.
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
