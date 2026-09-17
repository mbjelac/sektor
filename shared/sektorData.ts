export type ResourceThroughput = { name: string; value: number };

export interface BuildingLocation {
  x: number;
  y: number;
}

export interface BuildingCreation {
  type: string;
  location: BuildingLocation;
}

// A building does every function of its definition which is activated. The activations are
// absent on a building whose functions were never toggled, which then does the functions it
// started out with.
export interface Building extends BuildingCreation {
  activeFunctions?: boolean[];
}

export interface RestrictionsRequirements {
  importRestrictions: ResourceThroughput[];
  exportRequirements: ResourceThroughput[];
}

export interface Location {
  properties: { [key: string]: number };
}

export interface SektorData {
  // How hard the sektor is, the lowest being the first level of levels.md. Every sektor has one,
  // whether it was generated or made by hand.
  level: number;
  locationProperties: { [key: string]: number[][] };
  importRestrictions: ResourceThroughput[];
  exportRequirements: ResourceThroughput[];
  buildings: Building[];
}
