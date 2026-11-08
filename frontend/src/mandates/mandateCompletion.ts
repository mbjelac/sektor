import { ImportsAndExports } from "../globalImportsAndExports";
import { Mandate, MandateCriterion } from "./mandates.api";

// The mandate as the player's sektors together leave it: every criterion completed or not, and the
// mandate complete when every one of its criteria is.
export function completedMandate(mandate: Mandate, playerImportsAndExports: ImportsAndExports): Mandate {
  const criteria = mandate.criteria.map(criterion => ({
    ...criterion,
    completed: isCriterionFulfilled(criterion, playerImportsAndExports),
  }));
  return { ...mandate, criteria, completed: criteria.every(criterion => criterion.completed) };
}

function isCriterionFulfilled(criterion: MandateCriterion, playerImportsAndExports: ImportsAndExports): boolean {
  const exported = summedValue(playerImportsAndExports.exports, criterion.resourceName);
  const imported = summedValue(playerImportsAndExports.imports, criterion.resourceName);
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
