import { getSektorList, SektorListItem } from "./sektorList.api";
import { arrowRightIcon } from "../icons";
import { Sektor, SektorStatus } from "../sektor/Sektor";
import { getSektorData } from "../sektor/sektor.api";
import { buildingDefinitions } from "../sektor/buildings/buildings";
import { locationPropertiesToLocations } from "../sektor/locationProperties";

function renderList() {
  const container = document.getElementById("sektor-list")!;
  const sektors = getSektorList();

  for (const sektor of sektors) {
    container.appendChild(createListItem(sektor));
  }
}

function createListItem(sektorListItem: SektorListItem): HTMLElement {
  const item = document.createElement("div");
  item.className = "sektor-list-item";

  const name = document.createElement("span");
  name.className = "sektor-list-name";
  name.textContent = sektorListItem.name;
  item.appendChild(name);

  const status = createStatus(computeStatus(sektorListItem.name));
  item.appendChild(status);

  const button = document.createElement("button");
  button.className = "sektor-list-go";
  button.innerHTML = arrowRightIcon;
  button.addEventListener("click", () => {
    window.location.href = `/sektor.html?name=${encodeURIComponent(sektorListItem.name)}`;
  });
  item.appendChild(button);

  return item;
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

function computeStatus(sektorName: string): SektorStatus {
  const sektorData = getSektorData(sektorName);
  if (!sektorData) return "InProgress";

  const sektor = new Sektor(
    locationPropertiesToLocations(sektorData.locationProperties),
    buildingDefinitions,
    {
      importRestrictions: sektorData.importRestrictions,
      exportRequirements: sektorData.exportRequirements,
    }
  );
  sektor.loadState({ buildings: sektorData.buildings });

  return sektor.getSektorState().status;
}

renderList();
