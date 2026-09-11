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
  locationProperties: { [key: string]: number[][] };
  importRestrictions: ResourceThroughput[];
  exportRequirements: ResourceThroughput[];
  buildings: Building[];
}
