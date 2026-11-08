import type { Mandate } from "./mandates.api";

// A mandate given up is nobody's again, waiting to be claimed as it was when it was made: nothing of
// it is completed, as nobody's sektors are working towards it.
export function abandonedMandate(mandate: Mandate): Mandate {
  return {
    ...mandate,
    owner: null,
    criteria: mandate.criteria.map(criterion => ({ ...criterion, completed: false })),
    completed: false,
  };
}
