import { requireLogin } from "../login/requireLogin";
import { showUser } from "../login/userDisplay.ui";
import { getSektorList, SektorListItem } from "./sektorList.api";
import { arrowDownTrayIcon, arrowRightIcon, arrowUpTrayIcon, buildingOfficeIcon, starIcon } from "../icons";
import { ScoredThroughput, Sektor, SektorStatus } from "../sektor/Sektor";
import { getSektorData } from "../sektor/sektor.api";
import { getSektorOwner, setSektorOwner } from "../sektor/sektorOwner.api";
import { getUsername } from "../login/login.api";
import { buildingDefinitions } from "../sektor/buildings/buildings";
import { locationPropertiesToLocations } from "../sektor/locationProperties";
import { getNegativeScoringResources } from "../resources";
import { scoreColor } from "../score";
import { formatNumber } from "../formatNumber";

// A player may only work on so many sektors at a time, so that they finish the ones they have
// claimed before claiming more.
const MAXIMUM_UNFINISHED_SEKTORS = 5;

interface SektorSummary {
  status: SektorStatus;
  buildingCount: number;
  importTotal: number;
  exportTotal: number;
  score: number;
}

function renderList() {
  const container = document.getElementById("sektor-list")!;
  const sektors = getSektorList();
  const summaries = sektors.map(sektor => getSektorSummary(sektor.name));
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
    getSektorOwner(sektor.name) === getUsername() && summaries[sektorIndex].status !== "Done"
  ).length;
}

function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "sektor-list-header";

  const name = document.createElement("span");
  name.className = "sektor-list-name";
  name.textContent = "Sektor";
  header.appendChild(name);

  const owner = document.createElement("span");
  owner.className = "sektor-list-owner";
  owner.textContent = "Owner";
  header.appendChild(owner);

  const status = document.createElement("span");
  status.className = "sektor-list-status";
  status.textContent = "Status";
  header.appendChild(status);

  header.appendChild(createHeaderIcon(buildingOfficeIcon));
  header.appendChild(createHeaderIcon(arrowDownTrayIcon));
  header.appendChild(createHeaderIcon(arrowUpTrayIcon));
  header.appendChild(createHeaderIcon(starIcon, "Score"));

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
  name.textContent = sektorListItem.name;
  item.appendChild(name);

  item.appendChild(createOwner(sektorListItem.name, claimingAllowed));
  item.appendChild(createStatus(summary.status));
  item.appendChild(createNumber(summary.buildingCount));
  item.appendChild(createNumber(summary.importTotal));
  item.appendChild(createNumber(summary.exportTotal));
  item.appendChild(createScore(summary.score));

  const button = document.createElement("button");
  button.className = "sektor-list-go";
  button.innerHTML = arrowRightIcon;
  button.addEventListener("click", () => {
    window.location.href = `/sektor.html?name=${encodeURIComponent(sektorListItem.name)}`;
  });
  item.appendChild(button);

  return item;
}

// A sektor without an owner is up for grabs, the player's own sektors are marked as theirs, and
// the rest carry the name of the player who claimed them.
function createOwner(sektorName: string, claimingAllowed: boolean): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "sektor-list-owner";

  const owner = getSektorOwner(sektorName);

  if (!owner) {
    cell.appendChild(createClaimButton(sektorName, claimingAllowed));
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

function createClaimButton(sektorName: string, claimingAllowed: boolean): HTMLElement {
  const claimButton = document.createElement("button");
  claimButton.className = "sektor-list-claim";
  claimButton.textContent = "Claim";
  claimButton.disabled = !claimingAllowed;
  claimButton.addEventListener("click", () => claimSektor(sektorName));
  return claimButton;
}

// Claiming a sektor makes the player its owner, which opens it for building.
function claimSektor(sektorName: string) {
  setSektorOwner(sektorName, getUsername()!);
  window.location.href = `/sektor.html?name=${encodeURIComponent(sektorName)}`;
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

function getSektorSummary(sektorName: string): SektorSummary {
  const sektorData = getSektorData(sektorName);
  if (!sektorData) return { status: "InProgress", buildingCount: 0, importTotal: 0, exportTotal: 0, score: 0 };

  const sektor = new Sektor(
    locationPropertiesToLocations(sektorData.locationProperties),
    buildingDefinitions,
    {
      importRestrictions: sektorData.importRestrictions,
      exportRequirements: sektorData.exportRequirements,
    },
    getNegativeScoringResources()
  );
  sektor.loadState({ buildings: sektorData.buildings });

  const sektorState = sektor.getSektorState();

  return {
    status: sektorState.status,
    buildingCount: sektor.getState().buildings.length,
    importTotal: sumThroughputs(sektorState.imports),
    exportTotal: sumThroughputs(sektorState.exports),
    score: sumScores([...sektorState.imports, ...sektorState.exports]),
  };
}

function sumThroughputs(throughputs: { value: number }[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.value, 0);
}

function sumScores(throughputs: ScoredThroughput[]): number {
  return throughputs.reduce((total, throughput) => total + throughput.score, 0);
}

requireLogin();
showUser();
renderList();
