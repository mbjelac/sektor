import { getMandates, Mandate, MandateCriterion, setMandateOwner } from "./mandates.api";
import { createListTitle } from "../listTitle.ui";
import { arrowDownTrayIcon, arrowUpTrayIcon } from "../icons";
import { getResourceIcon } from "../resources";
import { formatNumber } from "../formatNumber";
import { getUsername } from "../login/login.api";
import { createClaimButton } from "../claimButton.ui";
import { showMandateDialog } from "./mandateDialog.ui";

// The mandates waiting to be claimed, standing under what the whole planet moves and named as the
// other lists of the page are. Drawn again whenever a mandate appears, so what stands there is
// cleared away first.
export function renderMandateList() {
  document.getElementById("mandate-panel")!.replaceChildren(
    createHeader(),
    ...getMandates().filter(mandate => mandate.owner === null).map(createMandateItem),
  );
}

// The name of the list stays at the top of the mandates while they are scrolled past it.
function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "mandate-header";
  header.appendChild(createListTitle("Mandates"));
  return header;
}

// A mandate is its number followed by what it asks for, every criterion in short, and the button for
// claiming it at the end of the row.
function createMandateItem(mandate: Mandate): HTMLElement {
  const item = document.createElement("div");
  item.className = "mandate-item";

  const mandateNumber = document.createElement("span");
  mandateNumber.className = "mandate-number";
  mandateNumber.textContent = `${mandate.number}`;
  item.appendChild(mandateNumber);

  for (const criterion of mandate.criteria) {
    item.appendChild(createCriterion(criterion));
  }

  const claimButton = createClaimButton(() => showMandateDialog({
    mandate,
    // A claimed mandate is the player's, and is no longer waiting in the list.
    onClaimed: () => {
      setMandateOwner(mandate.number, getUsername()!);
      renderMandateList();
    },
  }));
  claimButton.classList.add("mandate-claim-button");
  item.appendChild(claimButton);

  return item;
}

// A criterion in short is whether it is about exports or imports, the resource and the amount. The
// pictures carry the words they stand for, to be read on hovering them.
function createCriterion(criterion: MandateCriterion): HTMLElement {
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
