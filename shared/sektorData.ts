export type ResourceThroughput = { name: string; value: number };

export interface BuildingLocation {
  x: number;
  y: number;
}

export interface BuildingCreation {
  type: string;
  location: BuildingLocation;
}

export interface Building extends BuildingCreation {
  capacity: number;
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
