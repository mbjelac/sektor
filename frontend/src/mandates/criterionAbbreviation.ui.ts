import { MandateCriterion, ResourceCriterion } from "./mandates.api";
import { arrowDownTrayIcon, arrowUpTrayIcon } from "../icons";
import { getResourceIcon } from "../resources";
import { formatNumber } from "../formatNumber";
import { asksForAtLeast, isAboutExports, isAboutResource } from "./criterionType";
import { criterionCurrentAmount, PlayerSektor, resourceTotal, sektorsMovingResource } from "./sektorsMovingResource";
import { measureOf, MeasureCriterion } from "./measures";

// A criterion in short is whether it is about exports or imports, the resource, and the amount, told
// as at least or at most by the sign in front of it. The pictures carry the words they stand for, to
// be read on hovering them. It ends with how far the player's sektors have got with it, so that the
// player need not open anything to see. A criterion about a measure, such as deforestation,
// pollution, population or hapiness, is told by its picture alone in place of a direction and a resource.
export function createCriterionAbbreviation(criterion: MandateCriterion, playerSektors: PlayerSektor[]): HTMLElement {
  const criterionElement = document.createElement("span");
  criterionElement.className = "mandate-criterion";
  criterionElement.dataset.criterionType = criterion.type;
  if (isAboutResource(criterion)) appendResourceAbbreviation(criterionElement, criterion, playerSektors);
  else appendMeasureAbbreviation(criterionElement, criterion, playerSektors);
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
  amount.textContent = `${asksForAtLeast(criterion) ? "\u2265" : "\u2264"} ${formatNumber(criterion.amount)}`;
  criterionElement.appendChild(amount);

  criterionElement.appendChild(createCurrentAmount(criterion, playerSektors));
}

// What the player's sektors move of the criterion's resource between them, in brackets, below nothing
// where they move it the other way to the one the criterion asks for.
function createCurrentAmount(criterion: ResourceCriterion, playerSektors: PlayerSektor[]): HTMLElement {
  const total = resourceTotal(sektorsMovingResource(playerSektors, criterion.resourceName));
  return createCurrentAmountElement(criterionCurrentAmount(criterion, total));
}

// How much of the measure the player's sektors come to between them stands in brackets at the end.
function appendMeasureAbbreviation(
  criterionElement: HTMLElement,
  criterion: MeasureCriterion,
  playerSektors: PlayerSektor[],
) {
  const measure = measureOf(criterion);
  const measureElement = document.createElement("span");
  measureElement.className = "mandate-criterion-measure";
  measureElement.textContent = measure.icon;
  measureElement.title = measure.name;
  criterionElement.appendChild(measureElement);

  const amount = document.createElement("span");
  amount.className = "mandate-criterion-amount";
  amount.textContent = `${measure.asksForAtLeast ? "\u2265" : "\u2264"} ${formatNumber(criterion.amount)}`;
  criterionElement.appendChild(amount);

  criterionElement.appendChild(createCurrentAmountElement(measure.playerAmount(playerSektors)));
}

function createCurrentAmountElement(current: number): HTMLElement {
  const currentAmount = document.createElement("span");
  currentAmount.className = "mandate-criterion-current-amount";
  currentAmount.textContent = `(${formatNumber(current)})`;
  return currentAmount;
}
