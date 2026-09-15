import { clearSektorList } from "./sektorList.api";
import { deleteAllSektorData } from "../sektor/sektor.api";
import { stopCreatingSektors } from "../creation/sektorCreation";

// Wipes every sektor there is, for when the ones lying about are of no more use.
export function showPurgeButton(onPurged: () => void): void {
  const purgeButton = document.createElement("button");
  purgeButton.id = "purge-button";
  purgeButton.textContent = "PURGE";
  purgeButton.addEventListener("click", () => {
    purgeSektors();
    onPurged();
  });

  document.body.appendChild(purgeButton);
}

// The making of sektors is stopped first, so that none is made in between the emptying of the list
// and the throwing away of what the sektors were. What a sektor was owned by and called goes with
// its entry in the list, so the next sektor to be given a number already used comes up unclaimed.
function purgeSektors(): void {
  stopCreatingSektors();
  clearSektorList();
  deleteAllSektorData();
}
