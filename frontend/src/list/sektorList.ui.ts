import { requireLogin } from "../login/requireLogin";
import { showUser } from "../login/userDisplay.ui";
import { getSektorList, removeSektorOwner, SektorListItem, setSektorOwner } from "./sektorList.api";
import { arrowDownTrayIcon, arrowRightIcon, arrowsPointingOutIcon, arrowUpTrayIcon, buildingOfficeIcon, puzzlePieceIcon, starIcon, sunIcon, userIcon } from "../icons";
import { SektorStatus } from "../sektor/Sektor";
import { showClaimDialog } from "../claimDialog.ui";
import { createClaimButton } from "../claimButton.ui";
import { showAbandonDialog } from "./abandonDialog.ui";
import { getUsername } from "../login/login.api";
import { getSektorSummary, SektorSummary } from "./sektorSummary";
import { renderLeaderboard } from "./leaderboard.ui";
import { scoreColor } from "../score";
import { formatNumber } from "../formatNumber";
import { createSektorIfNeeded, startCreatingSektors } from "../creation/sektorCreation";
import { showPurgeButton } from "./purgeButton.ui";
import { sektorSizeName } from "../../../shared/sektorSizes";

// A player may only work on so many sektors at a time, so that they finish the ones they have
// claimed before claiming more.
const MAXIMUM_UNFINISHED_SEKTORS = 5;

function renderList() {
  const container = document.getElementById("sektor-list")!;
  // The list is drawn again whenever a sektor appears, so whatever stands there is cleared away
  // first, or every sektor would be shown twice over.
  container.replaceChildren();
  const sektors = getSektorList();
  const summaries = sektors.map(sektor => getSektorSummary(sektor.id));
  const claimingAllowed = countUnfinishedSektors(sektors, summaries) < MAXIMUM_UNFINISHED_SEKTORS;

  container.appendChild(createHeader());

  for (const [sektorIndex, sektor] of sektors.entries()) {
    container.appendChild(createListItem(sektor, summaries[sektorIndex], claimingAllowed));
  }
}

// Every sektor of the player which is not done yet — in progress, exceeding its restrictions, or
// in any other unfinished state — counts towards the limit.
function countUnfinishedSektors(sektors: SektorListItem[], summaries: SektorSummary[]): number {
  return sektors.filter((sektor, sektorIndex) =>
    sektor.owner === getUsername() && summaries[sektorIndex].status !== "Done"
  ).length;
}

function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "sektor-list-header";

  const name = document.createElement("span");
  name.className = "sektor-list-name";
  name.textContent = "Sektor";
  header.appendChild(name);

  const level = document.createElement("span");
  level.className = "sektor-list-level";
  level.innerHTML = puzzlePieceIcon;
  level.title = "Difficulty";
  header.appendChild(level);

  const size = document.createElement("span");
  size.className = "sektor-list-size";
  size.innerHTML = arrowsPointingOutIcon;
  size.title = "Map size";
  header.appendChild(size);

  const owner = document.createElement("span");
  owner.className = "sektor-list-owner";
  owner.innerHTML = userIcon;
  owner.title = "Owned by";
  header.appendChild(owner);

  const status = document.createElement("span");
  status.className = "sektor-list-status";
  status.innerHTML = sunIcon;
  status.title = "Status";
  header.appendChild(status);

  header.appendChild(createHeaderIcon(buildingOfficeIcon, "Buildings"));
  header.appendChild(createHeaderIcon(arrowDownTrayIcon, "Imports"));
  header.appendChild(createHeaderIcon(arrowUpTrayIcon, "Exports"));
  header.appendChild(createHeaderIcon(starIcon, "Score"));

  header.appendChild(document.createElement("span"));
  header.appendChild(document.createElement("span"));

  return header;
}

function createHeaderIcon(icon: string, tooltip?: string): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-number";
  cell.innerHTML = icon;
  if (tooltip) cell.title = tooltip;
  return cell;
}

function createListItem(sektorListItem: SektorListItem, summary: SektorSummary, claimingAllowed: boolean): HTMLElement {
  const item = document.createElement("div");
  item.className = "sektor-list-item";

  const name = document.createElement("span");
  name.className = "sektor-list-name";
  // A sektor nobody has claimed and named yet is shown as having no name, rather than by its id.
  const givenName = (sektorListItem.name ?? "").trim();
  name.textContent = givenName || "No name";
  if (!givenName) name.classList.add("sektor-list-no-name");
  item.appendChild(name);

  item.appendChild(createLevel(summary.level));
  item.appendChild(createSize(summary.size));
  item.appendChild(createOwner(sektorListItem, claimingAllowed));
  item.appendChild(createStatus(summary.status));
  item.appendChild(createNumber(summary.buildingCount));
  item.appendChild(createNumber(summary.importTotal));
  item.appendChild(createNumber(summary.exportTotal));
  item.appendChild(createScore(summary.score));

  const button = document.createElement("button");
  button.className = "sektor-list-go";
  button.innerHTML = arrowRightIcon;
  button.addEventListener("click", () => {
    window.location.href = `/sektor.html?id=${encodeURIComponent(sektorListItem.id)}`;
  });
  item.appendChild(button);

  item.appendChild(createAbandon(sektorListItem));

  return item;
}

function createLevel(level: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-level";
  cell.textContent = `${level}`;
  return cell;
}

// A player picks a sektor by how big it is as much as by how hard it is, so the map is named
// rather than measured: a Tiny sektor is a handful of tiles, a Large one the whole hundred.
function createSize(size: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-size";
  cell.textContent = sektorSizeName(size);
  return cell;
}

// Only the player who owns a sektor can give it up, so only they are shown the button for it.
function createAbandon(sektorListItem: SektorListItem): HTMLElement {
  if (sektorListItem.owner !== getUsername()) return document.createElement("span");

  const abandonButton = document.createElement("button");
  abandonButton.className = "sektor-list-abandon";
  abandonButton.textContent = "Abandon";
  abandonButton.addEventListener("click", () => abandonSektor(sektorListItem));
  return abandonButton;
}

function abandonSektor(sektorListItem: SektorListItem) {
  showAbandonDialog({
    sektorName: sektorListItem.name ?? sektorListItem.id,
    onConfirmed: () => {
      removeSektorOwner(sektorListItem.id);
      // The abandoned sektor is up for claiming again, which the list shows once drawn anew.
      window.location.reload();
    },
  });
}

// A sektor without an owner is up for grabs, the player's own sektors are marked as theirs, and
// the rest carry the name of the player who claimed them.
function createOwner(sektorListItem: SektorListItem, claimingAllowed: boolean): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-owner";

  const owner = sektorListItem.owner;

  if (!owner) {
    cell.appendChild(createListClaimButton(sektorListItem, claimingAllowed));
    return cell;
  }

  if (owner === getUsername()) {
    const you = document.createElement("span");
    you.className = "sektor-list-you";
    you.textContent = "You";
    cell.appendChild(you);
    return cell;
  }

  cell.textContent = owner;
  return cell;
}

function createListClaimButton(sektorListItem: SektorListItem, claimingAllowed: boolean): HTMLElement {
  const claimButton = createClaimButton(() => claimSektor(sektorListItem));
  claimButton.classList.add("sektor-list-claim");
  claimButton.disabled = !claimingAllowed;
  return claimButton;
}

// A sektor carries the name it was made with, so the player is only asked whether they want it.
// Saying yes makes it theirs and opens it for building on.
function claimSektor(sektorListItem: SektorListItem) {
  showClaimDialog({
    sektorName: sektorListItem.name ?? sektorListItem.id,
    onConfirmed: () => {
      setSektorOwner(sektorListItem.id, getUsername()!);
      window.location.href = `/sektor.html?id=${encodeURIComponent(sektorListItem.id)}`;
    },
  });
}

function createStatus(status: SektorStatus): HTMLElement {
  const element = document.createElement("span");
  element.className = "sektor-list-status";

  if (status === "InProgress") {
    element.textContent = "In progress";
    element.style.color = "var(--color-neutral)";
  } else if (status === "Done") {
    element.textContent = "Done";
    element.style.color = "var(--color-good)";
    element.style.fontWeight = "bold";
  } else {
    element.textContent = "Restrictions exceeded";
    element.style.color = "var(--color-bad)";
    element.style.fontWeight = "bold";
  }

  return element;
}

function createNumber(value: number): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-number";
  cell.textContent = formatNumber(value);
  return cell;
}

function createScore(score: number): HTMLElement {
  const cell = createNumber(score);
  cell.style.color = scoreColor(score);
  return cell;
}

requireLogin();
showUser();
// A list which fills by itself cannot be looked at, as a sektor may appear on it at any moment. A
// test therefore lays this out before the page loads and makes the sektors it wants by hand, one
// call at a time, rather than sitting out the second between one round of making them and the next.
// Nothing in the game lays it out, so a player's list goes on filling on its own.
const areSektorsMadeByHand = (window as unknown as { makeSektorsByHand?: boolean }).makeSektorsByHand === true;

renderList();
showPurgeButton(refreshPage);
if (areSektorsMadeByHand) {
  (window as unknown as { createSektorIfNeeded: () => Promise<boolean> }).createSektorIfNeeded = createSektorIfNeeded;
} else {
  startCreatingSektors(refreshPage);
}
renderLeaderboard();

// The standings are worked out from the sektors, so they are drawn anew whenever the sektors change.
function refreshPage() {
  renderList();
  renderLeaderboard();
}
