export interface SektorListItem {
  name: string;
}

export function getSektorList(): SektorListItem[] {
  const stored = localStorage.getItem("sektors");
  if (!stored) return [];
  return (JSON.parse(stored) as SektorListItem[]).map(sektor => ({ name: sektor.name }));
}
