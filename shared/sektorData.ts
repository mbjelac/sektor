export type ResourceThroughput = { name: string; value: number };

export interface BuildingLocation {
  x: number;
  y: number;
}

export interface BuildingCreation {
  type: string;
  location: BuildingLocation;
  // Drawn at random when the building is put up and kept for good, so that the building is drawn
  // as the same of its variants every time the sektor is opened. A building put up before buildings
  // had variants carries none, and is drawn as its first variant.
  variantIndex?: number;
}

// A building does every function of its definition. A function drawing on the building's pool is
// done as many times over as its multiplier says, and the multipliers are absent on a building whose
// pool was never drawn on, which then does none of those functions.
export interface Building extends BuildingCreation {
  functionMultipliers?: number[];
}

export interface Location {
  properties: { [key: string]: number };
}

export interface SektorData {
  // How hard the sektor is, the lowest being the first level of levels.md. Every sektor has one,
  // whether it was generated or made by hand.
  level: number;
  // What every square of the sektor's map is made of, being ground or sea. A sektor made before
  // there was any sea carries none, and is dry land the whole way across.
  terrain?: number[][];
  locationProperties: { [key: string]: number[][] };
  buildings: Building[];
  // How much the ecosystem was supported when the sektor was made, before anybody built anything
  // there: all the EcosystemSupport its forests gave. A sektor made before there were any forests
  // carries none, and had none to give.
  initialEcosystemSupport?: number;
}
