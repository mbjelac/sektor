import { Rotation, UNTURNED } from "./planetRotation";

const PLANET_ROTATION_STORAGE_KEY = "planetRotation";

// The planet as it was last turned, so that it is shown turned the same way when the page is come
// back to. Never turned, it stands as it first did.
export function getPlanetRotation(): Rotation {
  const stored = localStorage.getItem(PLANET_ROTATION_STORAGE_KEY);
  return stored ? JSON.parse(stored) as Rotation : UNTURNED;
}

export function savePlanetRotation(rotation: Rotation): void {
  localStorage.setItem(PLANET_ROTATION_STORAGE_KEY, JSON.stringify(rotation));
}
