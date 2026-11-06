import { getMandates, Mandate, MandateCriterion, setMandateOwner } from "./mandates.api";
import { createListTitle } from "../listTitle.ui";
import { arrowDownTrayIcon, arrowUpTrayIcon, sparklesIcon, userIcon } from "../icons";
import { getResourceIcon } from "../resources";
import { formatNumber } from "../formatNumber";
import { getUsername } from "../login/login.api";
import { createClaimButton } from "../claimButton.ui";
import { showMandateDialog } from "./mandateDialog.ui";
import { filterMandates, MandateFilter } from "./mandateFilter";

// The list opens on the mandates waiting to be claimed.
let mandateFilter: MandateFilter = "unclaimed";

// The list is named after the mandates it is showing.
const MANDATE_LIST_TITLES: Record<MandateFilter, string> = {
  unclaimed: "Available mandates",
  own: "My mandates",
};

// The mandates waiting to be claimed, or the player's own, standing under what the whole planet
// moves and named as the other lists of the page are. Drawn again whenever a mandate appears, so
// what stands there is cleared away first. A player with no mandates of their own has nothing to
// choose between, so they are shown the mandates waiting to be claimed and no buttons.
export function renderMandateList() {
  const mandates = getMandates();
  const hasOwnMandates = filterMandates(mandates, "own", getUsername()).length > 0;
  if (!hasOwnMandates) mandateFilter = "unclaimed";

  document.getElementById("mandate-panel")!.replaceChildren(
    createHeader(hasOwnMandates),
    ...filterMandates(mandates, mandateFilter, getUsername()).map(createMandateItem),
  );
}

// The name of the list stays at the top of the mandates while they are scrolled past it, with the
// buttons choosing which mandates are listed at the other end of it.
function createHeader(hasFilterButtons: boolean): HTMLElement {
  const header = document.createElement("div");
  header.className = "mandate-header";
  header.appendChild(createListTitle(MANDATE_LIST_TITLES[mandateFilter]));
  if (hasFilterButtons) header.appendChild(createFilterButtons());
  return header;
}

function createFilterButtons(): HTMLElement {
  const filterButtons = document.createElement("div");
  filterButtons.className = "mandate-filter-buttons";
  filterButtons.appendChild(createFilterButton("unclaimed", sparklesIcon, "Free to claim"));
  filterButtons.appendChild(createFilterButton("own", userIcon, "Yours"));
  return filterButtons;
}

// A button is only a picture, carrying what it lists to be read on hovering it. The mandates being
// listed are told by the line under their button, and clicking a button lists its mandates.
function createFilterButton(buttonFilter: MandateFilter, icon: string, tooltip: string): HTMLElement {
  const filterButton = document.createElement("button");
  filterButton.className = "mandate-filter-button";
  filterButton.classList.toggle("selected", buttonFilter === mandateFilter);
  filterButton.dataset.mandateFilter = buttonFilter;
  filterButton.title = tooltip;
  filterButton.innerHTML = icon;
  filterButton.addEventListener("click", () => {
    mandateFilter = buttonFilter;
    renderMandateList();
  });
  return filterButton;
}

// A mandate is its number followed by what it asks for, every criterion in short, and, while nobody
// owns it, the button for claiming it at the end of the row.
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

  if (mandate.owner === null) item.appendChild(createMandateClaimButton(mandate));

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

function createMandateClaimButton(mandate: Mandate): HTMLElement {
  const claimButton = createClaimButton(() => showMandateDialog({
    mandate,
    // A claimed mandate is the player's, and is no longer waiting in the list.
    onClaimed: () => {
      setMandateOwner(mandate.number, getUsername()!);
      renderMandateList();
    },
  }));
  claimButton.classList.add("mandate-claim-button");
  return claimButton;
}
