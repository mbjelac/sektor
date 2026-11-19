import { ImportsAndExports } from "../globalImportsAndExports";
import { Mandate, MandateCriterion, ResourceCriterion } from "./mandates.api";

// How the player's sektors stand between them: what they move in and out, how much they are
// deforested and polluted, and how many people they house.
export interface PlayerTotals {
  importsAndExports: ImportsAndExports;
  deforestation: number;
  pollution: number;
  population: number;
}

// The mandate as the player's sektors together leave it: every criterion completed or not, and the
// mandate complete when every one of its criteria is.
export function completedMandate(mandate: Mandate, playerTotals: PlayerTotals): Mandate {
  const criteria = mandate.criteria.map(criterion => ({
    ...criterion,
    completed: isCriterionFulfilled(criterion, playerTotals),
  }));
  return { ...mandate, criteria, completed: criteria.every(criterion => criterion.completed) };
}

function isCriterionFulfilled(criterion: MandateCriterion, playerTotals: PlayerTotals): boolean {
  switch (criterion.type) {
    case "maximumDeforestation": return playerTotals.deforestation <= criterion.amount;
    case "maximumPollution": return playerTotals.pollution <= criterion.amount;
    case "minimumPopulation": return playerTotals.population >= criterion.amount;
    case "maximumPopulation": return playerTotals.population <= criterion.amount;
    case "minimumExport": return exportedOf(criterion, playerTotals) >= criterion.amount;
    case "maximumExport": return exportedOf(criterion, playerTotals) <= criterion.amount;
    case "minimumImport": return importedOf(criterion, playerTotals) >= criterion.amount;
    case "maximumImport": return importedOf(criterion, playerTotals) <= criterion.amount;
  }
}

function exportedOf(criterion: ResourceCriterion, playerTotals: PlayerTotals): number {
  return summedValue(playerTotals.importsAndExports.exports, criterion.resourceName);
}

function importedOf(criterion: ResourceCriterion, playerTotals: PlayerTotals): number {
  return summedValue(playerTotals.importsAndExports.imports, criterion.resourceName);
}

function summedValue(throughputs: { name: string; value: number }[], resourceName: string): number {
  return throughputs.find(throughput => throughput.name === resourceName)?.value ?? 0;
}
