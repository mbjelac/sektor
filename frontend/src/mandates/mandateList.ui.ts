import { getMandates, Mandate, setMandateOwner } from "./mandates.api";
import { createListTitle } from "../listTitle.ui";
import { checkBadgeIcon, clipboardDocumentCheckIcon, sparklesIcon, userIcon } from "../icons";
import { createCriterionAbbreviation } from "./criterionAbbreviation.ui";
import { getUsername } from "../login/login.api";
import { showMandateDetailsDialog, showMandateDialog } from "./mandateDialog.ui";
import { createCompletionDot } from "./completionDot.ui";
import { filterMandates, MandateFilter, withoutFulfilledMinimumMandates } from "./mandateFilter";
import { recalculateMandates } from "./recalculateMandates";
import { getPlayerTotals } from "./playerTotals";
import { getPlayerSektors } from "./playerSektors";
import { PlayerSektor } from "./sektorsMovingResource";
import { mandateCategory } from "./mandateCategory";
import { createNewMandate } from "./mandateCreation";
import { canClaimMandates } from "./mandateCap";
import { heldCriteria } from "./heldCriteria";

// The list opens on the mandates waiting to be claimed.
let mandateFilter: MandateFilter = "unclaimed";

// Whoever else shows the player's mandates, told whenever the player claims or gives one up from the
// list, so that they can show it too.
let mandatesChangedCallback: (() => void) | null = null;

export function onMandatesChanged(callback: () => void) {
  mandatesChangedCallback = callback;
}

// The list shows the player's own mandates the next time it is drawn, where the player has any.
export function showOwnMandates() {
  mandateFilter = "own";
}

// The list is named after the mandates it is showing.
const MANDATE_LIST_TITLES: Record<MandateFilter, string> = {
  unclaimed: "Available mandates",
  own: "My mandates",
};

// The mandates waiting to be claimed, or the player's own, standing under what the whole planet
// moves and named as the other lists of the page are. Drawn again whenever a mandate appears, so
// what stands there is cleared away first. A player with no mandates of their own has nothing to
// choose between, so they are shown the mandates waiting to be claimed and no buttons. Where the list
// is not open, there is nothing to draw.
export function renderMandateList() {
  const mandatePanel = document.getElementById("mandate-panel");
  if (!mandatePanel) return;

  const mandates = getMandates();
  const hasOwnMandates = filterMandates(mandates, "own", getUsername()).length > 0;
  if (!hasOwnMandates) mandateFilter = "unclaimed";

  const playerSektors = getPlayerSektors();
  mandatePanel.replaceChildren(
    createHeader(hasOwnMandates),
    ...listedMandates(mandates).map(mandate => createMandateItem(mandate, mandates, playerSektors)),
  );
}

// Of the mandates waiting to be claimed, those the player's sektors already fulfil by making at least
// so much are not listed, worked out from the sektors as they stand whenever the list is drawn.
function listedMandates(mandates: Mandate[]): Mandate[] {
  const filteredMandates = filterMandates(mandates, mandateFilter, getUsername());
  if (mandateFilter !== "unclaimed") return filteredMandates;
  return withoutFulfilledMinimumMandates(filteredMandates, getPlayerTotals(getUsername()));
}

// The name of the list stays at the top of the mandates while they are scrolled past it, with the
// buttons choosing which mandates are listed at the other end of it.
function createHeader(hasFilterButtons: boolean): HTMLElement {
  const header = document.createElement("div");
  header.className = "mandate-header";
  header.appendChild(createListTitle(MANDATE_LIST_TITLES[mandateFilter], clipboardDocumentCheckIcon));
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
  filterButton.dataset.title = tooltip;
  filterButton.innerHTML = icon;
  filterButton.addEventListener("click", () => {
    mandateFilter = buttonFilter;
    renderMandateList();
  });
  return filterButton;
}

// A mandate is its badge and number followed by what it asks for, every criterion in short, and on
// the player's own, whether it is completed at the end of the row. A mandate nobody owns which shares
// a criterion with one of the player's own ends with a warning instead. Clicking anywhere on it opens
// it up in full, which is where a mandate nobody owns is claimed and the player's own is given up.
function createMandateItem(mandate: Mandate, mandates: Mandate[], playerSektors: PlayerSektor[]): HTMLElement {
  const item = document.createElement("div");
  item.className = "mandate-item";
  item.dataset.mandateNumber = `${mandate.number}`;
  item.dataset.mandateCategory = mandateCategory(mandate);
  item.addEventListener("click", () => openMandate(mandate));

  const mandateNumber = document.createElement("span");
  mandateNumber.className = "mandate-number";
  mandateNumber.innerHTML = checkBadgeIcon;
  mandateNumber.append(`${mandate.number}`);
  item.appendChild(mandateNumber);

  // A criterion the player's sektors already fulfil stands on pale green.
  for (const criterion of mandate.criteria) {
    const criterionAbbreviation = createCriterionAbbreviation(criterion, playerSektors);
    criterionAbbreviation.classList.toggle("mandate-criterion-completed", criterion.completed);
    item.appendChild(criterionAbbreviation);
  }

  if (mandate.owner !== null) item.appendChild(createCompletionDot(mandate.completed));
  if (mandate.owner === null && heldCriteria(mandate, mandates, getUsername()).length > 0) {
    item.appendChild(createHeldCriterionWarning());
  }

  return item;
}

// The same warning sign as a starved building function's.
function createHeldCriterionWarning(): HTMLElement {
  const warning = document.createElement("span");
  warning.className = "mandate-held-criterion-warning";
  warning.textContent = "⚠️";
  warning.dataset.title = "Already claimed";
  return warning;
}

// A claimed mandate is the player's, and is no longer waiting in the list; a new one is made in its
// place, so that as many are waiting to be claimed as before. A mandate given up is the player's no
// longer, so it leaves their list. A mandate just claimed may be completed already by the sektors the
// player has, so that is worked out at once. The list then turns to the player's own mandates, where
// the one just claimed is brought into view.
function openMandate(mandate: Mandate) {
  if (mandate.owner !== null) {
    showMandateDetailsDialog(mandate, showChangedMandates);
    return;
  }

  showMandateDialog({
    mandate,
    canClaimMore: canClaimMandates(getMandates(), getUsername()),
    heldCriteria: heldCriteria(mandate, getMandates(), getUsername()),
    onClaimed: () => {
      setMandateOwner(mandate.number, getUsername()!);
      createNewMandate();
      recalculateMandates(getUsername());
      mandateFilter = "own";
      showChangedMandates();
      revealMandateInList(mandate.number);
    },
  });
}

function showChangedMandates() {
  renderMandateList();
  mandatesChangedCallback?.();
}

// The mandate is scrolled to only if it is out of view, and then to just below the header standing
// over the list, which would otherwise hide it.
function revealMandateInList(mandateNumber: number) {
  const item = document.querySelector<HTMLElement>(`#mandate-panel .mandate-item[data-mandate-number="${mandateNumber}"]`);
  if (!item) return;

  const header = document.querySelector<HTMLElement>("#mandate-panel .mandate-header");
  item.style.scrollMarginTop = `${header?.offsetHeight ?? 0}px`;
  item.scrollIntoView({ block: "nearest" });
}
