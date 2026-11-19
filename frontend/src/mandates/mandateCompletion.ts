import { ImportsAndExports } from "../globalImportsAndExports";
import { Mandate, MandateCriterion } from "./mandates.api";

// How the player's sektors stand between them: what they move in and out, and how much they are
// deforested and polluted.
export interface PlayerTotals {
  importsAndExports: ImportsAndExports;
  deforestation: number;
  pollution: number;
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
  if (criterion.type === "maximumDeforestation") return playerTotals.deforestation <= criterion.amount;
  if (criterion.type === "maximumPollution") return playerTotals.pollution <= criterion.amount;

  const exported = summedValue(playerTotals.importsAndExports.exports, criterion.resourceName);
  const imported = summedValue(playerTotals.importsAndExports.imports, criterion.resourceName);
  switch (criterion.type) {
    case "minimumExport": return exported >= criterion.amount;
    case "maximumExport": return exported <= criterion.amount;
    case "minimumImport": return imported >= criterion.amount;
    case "maximumImport": return imported <= criterion.amount;
  }
}

function summedValue(throughputs: { name: string; value: number }[], resourceName: string): number {
  return throughputs.find(throughput => throughput.name === resourceName)?.value ?? 0;
}
