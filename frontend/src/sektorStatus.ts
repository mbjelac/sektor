import { SektorStatus } from "./sektor/Sektor";

// A sektor nobody has claimed is nobody's work, whatever stands in it, so it is shown as idle
// rather than by what its buildings add up to: nothing is in progress and nothing is overrun
// until a player takes the sektor up.
export function displayedSektorStatus(owner: string | null, calculatedStatus: SektorStatus): SektorStatus {
  return owner === null ? "Idle" : calculatedStatus;
}

// The sektor says the same thing about its state wherever it is shown — on the map and in the
// list — so both take the word and the color for it from here.
export function sektorStatusText(status: SektorStatus): string {
  if (status === "Idle") return "Idle";
  if (status === "InProgress") return "In progress";
  if (status === "Done") return "Done";
  return "Overrun";
}

export function sektorStatusColor(status: SektorStatus): string {
  if (status === "Idle") return "var(--color-status-idle)";
  if (status === "InProgress") return "var(--color-status-in-progress)";
  if (status === "Done") return "var(--color-status-done)";
  return "var(--color-status-overrun)";
}
