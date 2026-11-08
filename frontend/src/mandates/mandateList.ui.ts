import { getMandates, Mandate, setMandateOwner } from "./mandates.api";
import { createListTitle } from "../listTitle.ui";
import { sparklesIcon, userIcon } from "../icons";
import { createCriterionAbbreviation } from "./criterionAbbreviation.ui";
import { getUsername } from "../login/login.api";
import { showMandateDetailsDialog, showMandateDialog } from "./mandateDialog.ui";
import { createCompletionDot } from "./completionDot.ui";
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

// A mandate is its number followed by what it asks for, every criterion in short, and on the player's
// own, whether it is completed at the end of the row. Clicking anywhere on it opens it up in full,
// which is where a mandate nobody owns is claimed and the player's own is given up.
function createMandateItem(mandate: Mandate): HTMLElement {
  const item = document.createElement("div");
  item.className = "mandate-item";
  item.addEventListener("click", () => openMandate(mandate));

  const mandateNumber = document.createElement("span");
  mandateNumber.className = "mandate-number";
  mandateNumber.textContent = `${mandate.number}`;
  item.appendChild(mandateNumber);

  // A criterion the player's sektors already fulfil is left out: the row tells what is still to do.
  for (const criterion of mandate.criteria.filter(criterion => !criterion.completed)) {
    item.appendChild(createCriterionAbbreviation(criterion));
  }

  if (mandate.owner !== null) item.appendChild(createCompletionDot(mandate.completed));

  return item;
}

// A claimed mandate is the player's, and is no longer waiting in the list; a mandate given up is the
// player's no longer, so it leaves their list.
function openMandate(mandate: Mandate) {
  if (mandate.owner !== null) {
    showMandateDetailsDialog(mandate, renderMandateList);
    return;
  }

  showMandateDialog({
    mandate,
    onClaimed: () => {
      setMandateOwner(mandate.number, getUsername()!);
      renderMandateList();
    },
  });
}
