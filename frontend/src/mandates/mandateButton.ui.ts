import { clipboardDocumentCheckIcon } from "../icons";
import { renderMandateList, showOwnMandates } from "./mandateList.ui";
import { getMandates } from "./mandates.api";
import { getUsername } from "../login/login.api";
import { mandateCounts } from "./mandateCounts";
import { canClaimMandates } from "./mandateCap";

// The space between the icon and the panel of mandates under it.
const PANEL_GAP_PIXELS = 6;

// The mandates are reached from the map by the mandate list's own icon, standing in front of the
// player's name in the top right corner.
export function showMandateButton(): void {
  const userDisplay = document.getElementById("user-display");
  if (!userDisplay) return;

  const mandateButton = createMandateStats("button");
  mandateButton.id = "mandate-button";
  mandateButton.dataset.title = "Mandates";
  mandateButton.addEventListener("click", () => toggleMandatePanel(mandateButton));

  userDisplay.prepend(mandateButton);
  showMandateCounts();
}

// On the list page the player reads the same counts in the same place, but nothing opens from them,
// the list of mandates standing on the page already.
export function showMandateStats(): void {
  const userDisplay = document.getElementById("user-display");
  if (!userDisplay) return;

  const mandateStats = createMandateStats("span");
  mandateStats.id = "mandate-stats";
  mandateStats.classList.add("mandate-stats");

  userDisplay.prepend(mandateStats);
  showMandateCounts();
}

// The icon of the list of mandates, with the player's counts of mandates beside it.
function createMandateStats(tagName: "button" | "span"): HTMLElement {
  const mandateStats = document.createElement(tagName);
  mandateStats.className = "mandate-button";
  mandateStats.innerHTML = clipboardDocumentCheckIcon;

  const counts = document.createElement("span");
  counts.id = "mandate-counts";
  counts.className = "mandate-counts";
  mandateStats.appendChild(counts);

  return mandateStats;
}

// The icon opens the panel, and closes it again.
function toggleMandatePanel(mandateButton: HTMLElement) {
  if (document.getElementById("mandate-panel")) {
    hideMandatePanel();
    return;
  }
  showMandatePanel(mandateButton);
}

// The panel is put away whenever the player turns to something else on the map.
export function hideMandatePanel() {
  document.getElementById("mandate-panel")?.remove();
}

// The same list of mandates as beside the sektors, opened over the map right under the icon, its
// right edge under the icon's rather than under the counts beside it, so that the icon stands over the
// panel's top right corner. Over the map the player is building towards their own mandates, so the
// list opens on those.
function showMandatePanel(mandateButton: HTMLElement) {
  const mandatePanel = document.createElement("div");
  mandatePanel.id = "mandate-panel";
  mandatePanel.className = "mandate-panel-on-map";

  const buttonBox = mandateButton.getBoundingClientRect();
  const iconBox = mandateButton.querySelector(".icon")!.getBoundingClientRect();
  mandatePanel.style.top = `${buttonBox.bottom + PANEL_GAP_PIXELS}px`;
  mandatePanel.style.right = `${window.innerWidth - iconBox.right}px`;

  document.body.appendChild(mandatePanel);
  showOwnMandates();
  renderMandateList();
}

// Beside the icon the player reads how many of their mandates are not completed yet, on red, and how
// many are, on green. A count of nothing is left out, and a player who has claimed nothing is shown the
// icon alone. A player who works on as many mandates as they may sees the red count bordered in bright
// red, as they cannot claim any more.
export function showMandateCounts() {
  const counts = document.getElementById("mandate-counts");
  if (!counts) return;

  const mandates = getMandates();
  const playerName = getUsername();
  const { incomplete, complete } = mandateCounts(mandates, playerName);
  const incompleteClassName = canClaimMandates(mandates, playerName)
    ? "mandate-count-incomplete"
    : "mandate-count-incomplete mandate-count-at-cap";

  counts.replaceChildren(
    ...(incomplete > 0 ? [createCount(incompleteClassName, incomplete, "Unfulfilled mandates")] : []),
    ...(complete > 0 ? [createCount("mandate-count-complete", complete, "Fulfilled mandates")] : []),
  );
}

function createCount(className: string, count: number, tooltip: string): HTMLElement {
  const countElement = document.createElement("span");
  countElement.className = `mandate-count ${className}`;
  countElement.textContent = `${count}`;
  countElement.dataset.title = tooltip;
  return countElement;
}
