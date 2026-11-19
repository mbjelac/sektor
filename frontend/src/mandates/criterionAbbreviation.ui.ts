import { MandateCriterion } from "./mandates.api";
import { arrowDownTrayIcon, arrowUpTrayIcon } from "../icons";
import { getResourceIcon } from "../resources";
import { formatNumber } from "../formatNumber";
import { asksForAtLeast, isAboutExports } from "./criterionType";
import { criterionCurrentAmount, PlayerSektor, resourceTotal, sektorsMovingResource } from "./sektorsMovingResource";

// A criterion in short is whether it is about exports or imports, the resource, and the amount, told
// as at least or at most by the sign in front of it. The pictures carry the words they stand for, to
// be read on hovering them. It ends with how far the player's sektors have got with it, so that the
// player need not open anything to see.
export function createCriterionAbbreviation(criterion: MandateCriterion, playerSektors: PlayerSektor[]): HTMLElement {
  const criterionElement = document.createElement("span");
  criterionElement.className = "mandate-criterion";
  criterionElement.dataset.criterionType = criterion.type;

  const direction = document.createElement("span");
  direction.className = "mandate-criterion-direction";
  if (isAboutExports(criterion)) {
    direction.innerHTML = arrowUpTrayIcon;
    direction.title = "Export";
  } else {
    direction.innerHTML = arrowDownTrayIcon;
    direction.title = "Import";
  }
  criterionElement.appendChild(direction);

  const resource = document.createElement("span");
  resource.className = "mandate-criterion-resource";
  resource.textContent = getResourceIcon(criterion.resourceName) ?? criterion.resourceName;
  resource.title = criterion.resourceName;
  criterionElement.appendChild(resource);

  const amount = document.createElement("span");
  amount.className = "mandate-criterion-amount";
  amount.textContent = `${asksForAtLeast(criterion) ? "\u2265" : "\u2264"}${formatNumber(criterion.amount)}`;
  criterionElement.appendChild(amount);

  criterionElement.appendChild(createCurrentAmount(criterion, playerSektors));

  return criterionElement;
}

// What the player's sektors move of the criterion's resource between them, in brackets, below nothing
// where they move it the other way to the one the criterion asks for.
function createCurrentAmount(criterion: MandateCriterion, playerSektors: PlayerSektor[]): HTMLElement {
  const total = resourceTotal(sektorsMovingResource(playerSektors, criterion.resourceName));
  const currentAmount = document.createElement("span");
  currentAmount.className = "mandate-criterion-current-amount";
  currentAmount.textContent = `(${formatNumber(criterionCurrentAmount(criterion, total))})`;
  return currentAmount;
}
