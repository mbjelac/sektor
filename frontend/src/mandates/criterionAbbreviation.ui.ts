import { DeforestationCriterion, MandateCriterion, ResourceCriterion } from "./mandates.api";
import { arrowDownTrayIcon, arrowUpTrayIcon } from "../icons";
import { getResourceIcon } from "../resources";
import { formatNumber } from "../formatNumber";
import { asksForAtLeast, isAboutExports, isAboutResource } from "./criterionType";
import { criterionCurrentAmount, PlayerSektor, resourceTotal, sektorsMovingResource } from "./sektorsMovingResource";
import { totalDeforestation } from "../sektor/deforestation";

// A forest on fire stands for deforestation wherever it is told in short.
export const DEFORESTATION_ICON = "\u{1F333}\u{1F525}";

// A criterion in short is whether it is about exports or imports, the resource, and the amount, told
// as at least or at most by the sign in front of it. The pictures carry the words they stand for, to
// be read on hovering them. It ends with how far the player's sektors have got with it, so that the
// player need not open anything to see. A criterion about deforestation is told by its picture
// alone in place of a direction and a resource, and only ever asks for at most.
export function createCriterionAbbreviation(criterion: MandateCriterion, playerSektors: PlayerSektor[]): HTMLElement {
  const criterionElement = document.createElement("span");
  criterionElement.className = "mandate-criterion";
  criterionElement.dataset.criterionType = criterion.type;
  if (isAboutResource(criterion)) appendResourceAbbreviation(criterionElement, criterion, playerSektors);
  else appendDeforestationAbbreviation(criterionElement, criterion, playerSektors);
  return criterionElement;
}

function appendResourceAbbreviation(
  criterionElement: HTMLElement,
  criterion: ResourceCriterion,
  playerSektors: PlayerSektor[],
) {

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
}

// What the player's sektors move of the criterion's resource between them, in brackets, below nothing
// where they move it the other way to the one the criterion asks for.
function createCurrentAmount(criterion: ResourceCriterion, playerSektors: PlayerSektor[]): HTMLElement {
  const total = resourceTotal(sektorsMovingResource(playerSektors, criterion.resourceName));
  return createCurrentAmountElement(criterionCurrentAmount(criterion, total));
}

// How much the player's sektors are deforested between them stands in brackets at the end.
function appendDeforestationAbbreviation(
  criterionElement: HTMLElement,
  criterion: DeforestationCriterion,
  playerSektors: PlayerSektor[],
) {
  const deforestation = document.createElement("span");
  deforestation.className = "mandate-criterion-deforestation";
  deforestation.textContent = DEFORESTATION_ICON;
  deforestation.title = "Deforestation";
  criterionElement.appendChild(deforestation);

  const amount = document.createElement("span");
  amount.className = "mandate-criterion-amount";
  amount.textContent = `\u2264${formatNumber(criterion.amount)}`;
  criterionElement.appendChild(amount);

  const playerDeforestation = totalDeforestation(playerSektors.map(playerSektor => playerSektor.ecosystem));
  criterionElement.appendChild(createCurrentAmountElement(playerDeforestation));
}

function createCurrentAmountElement(current: number): HTMLElement {
  const currentAmount = document.createElement("span");
  currentAmount.className = "mandate-criterion-current-amount";
  currentAmount.textContent = `(${formatNumber(current)})`;
  return currentAmount;
}
