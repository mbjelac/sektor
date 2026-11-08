import { clipboardDocumentCheckIcon } from "../icons";
import { renderMandateList, showOwnMandates } from "./mandateList.ui";
import { getMandates } from "./mandates.api";
import { getUsername } from "../login/login.api";
import { mandateCounts } from "./mandateCounts";

// The space between the icon and the panel of mandates under it.
const PANEL_GAP_PIXELS = 6;

// The mandates are reached from the map by the mandate list's own icon, standing in front of the
// player's name in the top right corner.
export function showMandateButton(): void {
  const userDisplay = document.getElementById("user-display");
  if (!userDisplay) return;

  const mandateButton = document.createElement("button");
  mandateButton.id = "mandate-button";
  mandateButton.className = "mandate-button";
  mandateButton.title = "Mandates";
  mandateButton.innerHTML = clipboardDocumentCheckIcon;
  mandateButton.addEventListener("click", () => toggleMandatePanel(mandateButton));

  const counts = document.createElement("span");
  counts.id = "mandate-counts";
  counts.className = "mandate-counts";
  mandateButton.appendChild(counts);

  userDisplay.prepend(mandateButton);
  showMandateCounts();
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

// Beside the icon the player reads how many of their mandates are not completed yet, on red, how many
// are, on green, and how many they have claimed altogether. A count of nothing is left out, and a
// player who has claimed nothing is shown the icon alone.
export function showMandateCounts() {
  const counts = document.getElementById("mandate-counts");
  if (!counts) return;

  const { incomplete, complete, claimed } = mandateCounts(getMandates(), getUsername());
  if (claimed === 0) {
    counts.replaceChildren();
    return;
  }

  counts.replaceChildren(
    ...(incomplete > 0 ? [createCount("mandate-count-incomplete", incomplete)] : []),
    ...(complete > 0 ? [createCount("mandate-count-complete", complete)] : []),
    document.createTextNode(" / "),
    createCount("mandate-count-claimed", claimed),
  );
}

function createCount(className: string, count: number): HTMLElement {
  const countElement = document.createElement("span");
  countElement.className = `mandate-count ${className}`;
  countElement.textContent = `${count}`;
  return countElement;
}
