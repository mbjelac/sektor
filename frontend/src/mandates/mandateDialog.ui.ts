import { abandonMandate, Mandate } from "./mandates.api";
import { getUsername } from "../login/login.api";
import { createClaimButton } from "../claimButton.ui";
import { criterionDescription, CriterionDescription } from "./criterionDescription";
import { getResourceIcon } from "../resources";
import { createCompletionCheckbox, createMandateCheckbox } from "./completionCheckbox.ui";
import { getPlayerSektors } from "./playerSektors";
import { criterionCurrentAmount, PlayerSektor, resourceTotal, sektorsMovingResource } from "./sektorsMovingResource";
import { MandateCriterion } from "./mandates.api";
import { isAboutResource } from "./criterionType";
import { measureOf } from "./measures";
import { CriterionSektor, criterionSektors } from "./criterionSektors";
import { createSektorNameWithBiome } from "./sektorNameWithBiome.ui";
import { LocatedPlayerSektor } from "./playerSektors";
import { formatNumber } from "../formatNumber";
import { MANDATE_CATEGORY_NAMES, mandateCategory } from "./mandateCategory";

// A mandate is looked over before it is claimed, and is claimed only once the player says so, and
// only where the player may claim it: while they work on fewer mandates than they may, and hold no
// mandate sharing a criterion with it. The criteria they hold are told under what the mandate asks for.
export function showMandateDialog({ mandate, canClaimMore, heldCriteria, onClaimed }: {
  mandate: Mandate,
  canClaimMore: boolean,
  heldCriteria: MandateCriterion[],
  onClaimed: () => void
}) {
  const description = createDescription(mandate, false);
  if (heldCriteria.length > 0) description.appendChild(createHeldCriteria(heldCriteria));
  const overlay = createMandatePopup("mandate-dialog", mandate, description);
  overlay.firstElementChild!.appendChild(createClaimButtons(overlay, canClaimMore, heldCriteria.length > 0, onClaimed));
  document.body.appendChild(overlay);
}

// A mandate is looked into to see which of its criteria the player's sektors already complete, each
// told with a checkbox in front of it, as the mandate as a whole is in the list. A mandate of the player's
// own can be given up from here, and whoever opened it is told once it is.
export function showMandateDetailsDialog(mandate: Mandate, onAbandoned?: () => void) {
  const overlay = createMandatePopup("mandate-details-dialog", mandate, createDescription(mandate, true));
  overlay.firstElementChild!.appendChild(createDetailsButtons(overlay, mandate, onAbandoned));
  document.body.appendChild(overlay);
}

// Every popup of a mandate is titled with its number behind a big checkbox telling whether it is completed, names the
// mandate's category under the title, and tells what it asks for under both.
function createMandatePopup(dialogId: string, mandate: Mandate, description: HTMLElement): HTMLElement {
  const overlay = document.createElement("div");
  overlay.id = `${dialogId}-overlay`;
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.id = dialogId;
  dialog.className = "dialog mandate-dialog";
  dialog.dataset.mandateNumber = `${mandate.number}`;
  overlay.appendChild(dialog);

  dialog.appendChild(createMandateHeader(mandate));

  dialog.appendChild(description);

  return overlay;
}

// The checkbox stands beside the title and the category under it, held in the middle of the two.
function createMandateHeader(mandate: Mandate): HTMLElement {
  const header = document.createElement("div");
  header.className = "mandate-dialog-header";
  header.appendChild(createMandateCheckbox(mandate));

  const heading = document.createElement("div");
  heading.className = "mandate-dialog-heading";
  header.appendChild(heading);

  const title = document.createElement("div");
  title.className = "dialog-title mandate-dialog-title";
  title.textContent = `Mandate ${mandate.number}`;
  heading.appendChild(title);

  const category = document.createElement("div");
  category.className = "mandate-dialog-category";
  category.dataset.mandateCategory = mandateCategory(mandate);
  category.textContent = MANDATE_CATEGORY_NAMES[mandateCategory(mandate)];
  heading.appendChild(category);

  return header;
}

// What the mandate asks for, told in full, a line for every criterion, which may be told along with
// whether it is completed. Under every criterion stands what the player's sektors move of its
// resource now, or how much they come to of the measure it is about now, and which of their sektors
// make that up.
function createDescription(mandate: Mandate, showsCompletion: boolean): HTMLElement {
  const description = document.createElement("div");
  description.className = "mandate-description";
  const playerSektors = getPlayerSektors();

  for (const criterion of mandate.criteria) {
    description.appendChild(createCriterionLine(criterion, showsCompletion));
    description.appendChild(createCurrentLine(criterion, playerSektors, showsCompletion));
    const sektorsMakingItUp = criterionSektors(criterion, playerSektors);
    if (sektorsMakingItUp.length > 0) {
      description.appendChild(createCriterionSektorList(criterion, sektorsMakingItUp, playerSektors, showsCompletion));
    }
  }

  return description;
}

// Set in under the criterion it belongs to, a little smaller than it, and named Current on the left
// with the amount in bold on the right, over the amounts of the sektors making it up: what the
// player's sektors move of the resource between them, below nothing where they move it the other way
// to the one the criterion asks for; or how much they come to of the measure, such as deforestation
// or pollution, between them.
function createCurrentLine(criterion: MandateCriterion, playerSektors: PlayerSektor[], showsCompletion: boolean): HTMLElement {
  const currentLine = document.createElement("div");
  currentLine.className = "mandate-description-current";
  currentLine.classList.toggle("mandate-description-current-beside-completion", showsCompletion);

  const label = document.createElement("span");
  label.className = "mandate-description-current-label";
  label.textContent = "Current";
  currentLine.appendChild(label);

  const value = document.createElement("span");
  value.className = "mandate-description-current-value";
  value.textContent = formatNumber(currentAmount(criterion, playerSektors));
  currentLine.appendChild(value);

  return currentLine;
}

function currentAmount(criterion: MandateCriterion, playerSektors: PlayerSektor[]): number {
  if (!isAboutResource(criterion)) return measureOf(criterion).playerAmount(playerSektors);
  return criterionCurrentAmount(criterion, resourceTotal(sektorsMovingResource(playerSektors, criterion.resourceName)));
}

// Under what the player's sektors come to between them stands every one of their sektors making it
// up, whether the mandate is theirs or is still to be claimed, by name and the picture of its biome, and how much it
// counts towards the criterion. A sektor counting against a criterion about a resource, moving it the
// other way, does so below nothing, and one counting towards it is told by a plus. Where no sektor
// makes it up there is no list at all. A sektor clicked is opened on its map, unless its map is the one
// already open, when the popup is only put away.
function createCriterionSektorList(
  criterion: MandateCriterion,
  sektorsMakingItUp: CriterionSektor[],
  playerSektors: LocatedPlayerSektor[],
  showsCompletion: boolean,
): HTMLElement {
  const sektorList = document.createElement("div");
  sektorList.className = "mandate-criterion-sektors";
  sektorList.classList.toggle("mandate-criterion-sektors-beside-completion", showsCompletion);
  for (const criterionSektor of sektorsMakingItUp) {
    const row = document.createElement("div");
    row.className = "mandate-criterion-sektor";
    row.dataset.sektorId = criterionSektor.sektorId;
    row.addEventListener("click", () => {
      if (isSektorOnMap(criterionSektor.sektorId)) {
        row.closest(".dialog-overlay")?.remove();
        return;
      }
      window.location.href = `/sektor.html?id=${encodeURIComponent(criterionSektor.sektorId)}`;
    });
    const location = playerSektors.find(playerSektor => playerSektor.sektorId === criterionSektor.sektorId)?.location;
    row.appendChild(createSektorNameWithBiome(criterionSektor.sektorName, location, "mandate-criterion-sektor-name"));

    const amount = document.createElement("span");
    amount.className = "mandate-criterion-sektor-amount";
    const sign = isAboutResource(criterion) && criterionSektor.amount > 0 ? "+" : "";
    amount.textContent = `${sign}${formatNumber(criterionSektor.amount)}`;
    row.appendChild(amount);

    sektorList.appendChild(row);
  }
  return sektorList;
}

// The map of a sektor is open where the page is the sektor page of that sektor.
function isSektorOnMap(sektorId: string): boolean {
  return window.location.pathname.endsWith("/sektor.html")
    && new URLSearchParams(window.location.search).get("id") === sektorId;
}

// The criteria of the player's own mandates which this one shares, told as this one's are, under a
// small white heading, so that the player sees what they would have to give up to claim it.
function createHeldCriteria(heldCriteria: MandateCriterion[]): HTMLElement {
  const heldCriteriaSection = document.createElement("div");
  heldCriteriaSection.className = "mandate-held-criteria";

  const heading = document.createElement("div");
  heading.className = "mandate-held-criteria-heading";
  heading.textContent = "Already claimed:";
  heldCriteriaSection.appendChild(heading);

  for (const heldCriterion of heldCriteria) heldCriteriaSection.appendChild(createCriterionLine(heldCriterion, false));

  return heldCriteriaSection;
}

function createCriterionLine(criterion: MandateCriterion, showsCompletion: boolean): HTMLElement {
  const line = document.createElement("div");
  line.className = "mandate-description-line";
  if (showsCompletion) line.appendChild(createCompletionCheckbox(criterion.completed));
  const resourceIcon = isAboutResource(criterion) ? getResourceIcon(criterion.resourceName) : null;
  line.appendChild(createCriterionText(criterionDescription(criterion, resourceIcon)));
  return line;
}

// The criterion in words, its amount in white among them.
function createCriterionText(description: CriterionDescription): HTMLElement {
  const text = document.createElement("span");
  text.className = "mandate-description-text";
  const amount = document.createElement("span");
  amount.className = "mandate-description-amount";
  amount.textContent = description.amount;
  text.append(description.beforeAmount, amount, description.afterAmount);
  return text;
}

// Closing the popup without claiming stands on the left, as it does on any other popup of a mandate,
// and claiming on the right, where it is offered everywhere else. A player working on as many
// mandates as they may is told why in its place; one holding a mandate sharing a criterion with it is
// offered nothing there, the criteria they hold being told above. Either way the popup goes.
function createClaimButtons(
  overlay: HTMLElement,
  canClaimMore: boolean,
  holdsSameCriterion: boolean,
  onClaimed: () => void,
): HTMLElement {
  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons mandate-dialog-buttons";

  const closeButton = document.createElement("button");
  closeButton.id = "mandate-close-button";
  closeButton.className = "dialog-button dialog-button-plain";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(closeButton);

  if (!canClaimMore) {
    buttons.appendChild(createClaimRefusal());
    return buttons;
  }
  if (holdsSameCriterion) return buttons;

  const claimButton = createClaimButton(() => {
    overlay.remove();
    onClaimed();
  });
  claimButton.id = "mandate-claim-button";
  buttons.appendChild(claimButton);

  return buttons;
}

// A player working on as many mandates as they may is told so, in red, where Claim would stand.
function createClaimRefusal(): HTMLElement {
  const claimRefusal = document.createElement("div");
  claimRefusal.id = "mandate-claim-refusal";
  claimRefusal.append("Too many", document.createElement("br"), "incomplete mandates!");
  return claimRefusal;
}

// A popup only looked at has nothing to do but go, from the bottom right. Giving the mandate up, where
// it is the player's to give up, stands at the other end, in red.
function createDetailsButtons(overlay: HTMLElement, mandate: Mandate, onAbandoned?: () => void): HTMLElement {
  const buttons = document.createElement("div");
  buttons.className = "dialog-buttons mandate-details-buttons";

  if (onAbandoned && mandate.owner !== null && mandate.owner === getUsername()) {
    const abandonButton = document.createElement("button");
    abandonButton.id = "mandate-abandon-button";
    abandonButton.className = "dialog-button dialog-button-danger";
    abandonButton.textContent = "Abandon";
    abandonButton.addEventListener("click", () => {
      abandonMandate(mandate.number);
      overlay.remove();
      onAbandoned();
    });
    buttons.appendChild(abandonButton);
  }

  const closeButton = document.createElement("button");
  closeButton.id = "mandate-close-button";
  closeButton.className = "dialog-button dialog-button-plain";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => overlay.remove());
  buttons.appendChild(closeButton);

  return buttons;
}
