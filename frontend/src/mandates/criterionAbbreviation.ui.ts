import { MandateCriterion } from "./mandates.api";
import { arrowDownTrayIcon, arrowUpTrayIcon } from "../icons";
import { getResourceIcon } from "../resources";
import { formatNumber } from "../formatNumber";

// A criterion in short is whether it is about exports or imports, the resource and the amount. The
// pictures carry the words they stand for, to be read on hovering them.
export function createCriterionAbbreviation(criterion: MandateCriterion): HTMLElement {
  const criterionElement = document.createElement("span");
  criterionElement.className = "mandate-criterion";
  criterionElement.dataset.criterionType = criterion.type;

  const direction = document.createElement("span");
  direction.className = "mandate-criterion-direction";
  if (criterion.type === "minimumExport") {
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
  amount.textContent = formatNumber(criterion.amount);
  criterionElement.appendChild(amount);

  return criterionElement;
}
