import { SektorData } from "../../../shared/sektorData";

export type { SektorData };

export function getSektorData(name: string): SektorData | null {
  const stored = localStorage.getItem(`sektor_${name}`);
  if (!stored) return null;
  return JSON.parse(stored);
}

export function saveSektorData(name: string, data: SektorData): void {
  localStorage.setItem(`sektor_${name}`, JSON.stringify(data));
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
