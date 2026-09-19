import { getResourceIcon } from "./resources";
import { formatNumber } from "./formatNumber";

export function resourceNameText(resourceName: string): string {
  return `${resourceName} ${getResourceIcon(resourceName) ?? ""}`;
}

// A resource which is neither brought in nor sent out says nothing in the column, so that what is
// actually moved stands out from what is merely touched.
export function throughputText(value: number): string {
  return value !== 0 ? formatNumber(value) : "";
}
