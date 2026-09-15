import { SektorData } from "../../../shared/sektorData";

export type { SektorData };

export function getSektorData(sektorId: string): SektorData | null {
  const stored = localStorage.getItem(`sektor_${sektorId}`);
  if (!stored) return null;
  return JSON.parse(stored);
}

export function saveSektorData(sektorId: string, sektorData: SektorData): void {
  localStorage.setItem(`sektor_${sektorId}`, JSON.stringify(sektorData));
}

// Every sektor's data is stored under its own key, so they are gathered before any is removed:
// removing while reading the keys would skip over some of them.
export function deleteAllSektorData(): void {
  const sektorDataKeys: string[] = [];
  for (let keyIndex = 0; keyIndex < localStorage.length; keyIndex++) {
    const key = localStorage.key(keyIndex);
    if (key !== null && key.startsWith("sektor_")) sektorDataKeys.push(key);
  }
  for (const sektorDataKey of sektorDataKeys) localStorage.removeItem(sektorDataKey);
}
