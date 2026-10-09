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

// A cycle road runs along the edge between two squares rather than standing on a square, so it is
// told by the two squares it runs between. A road along the rim of the map runs between a square of
// the map and one beyond it, whose x or y is -1 or the size of the map.
export type CycleRoad = [BuildingLocation, BuildingLocation];

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
  // A sektor made before there were any cycle roads carries none.
  cycleRoads?: CycleRoad[];
  // How much the ecosystem was supported when the sektor was made, before anybody built anything
  // there: all the EcosystemSupport its forests gave. A sektor made before there were any forests
  // carries none, and had none to give.
  initialEcosystemSupport?: number;
}
