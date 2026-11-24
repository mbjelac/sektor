import { completedMandate } from "./mandateCompletion";
import { getMandates, replaceMandates } from "./mandates.api";
import { getPlayerTotals } from "./playerTotals";

// Whether a player's mandates, and every criterion of them, are completed is worked out anew from every sektor they own, as they
// stand stored, whenever the player changes one of them.
export function recalculateMandates(playerName: string | null) {
  if (!playerName) return;

  const playerTotals = getPlayerTotals(playerName);

  replaceMandates(
    getMandates()
      .filter(mandate => mandate.owner === playerName)
      .map(mandate => completedMandate(mandate, playerTotals)),
  );
}
