// Forests grow on the plain ground of a sektor before the player gets to it. A forest counts as a
// building — it gives the sektor what it gives whoever owns it — but nobody builds one: it is not
// offered in the toolbar, and it comes with the sektor or not at all.

import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

// What a forest is called, on the map and in the panel.
export const FOREST_NAME = "Forest";

// The resource a forest gives the ecosystem it stands in.
export const ECOSYSTEM_SUPPORT_RESOURCE = "EcosystemSupport";

// A forest is drawn from one of several files, picked by where it stands, so its definition carries
// no rendering code of its own.
export const FOREST_DEFINITION: BuildingDefinition = {
  name: FOREST_NAME,
  renderingCode: "",
  // A forest takes nothing in: what it gives, it gives by standing there.
  buildingFunctions: [{
    inputs: [],
    outputs: [
      { name: "HealthPhysical", value: 2 },
      { name: "HealthSocial", value: 2 },
      { name: "HealthMental", value: 2 },
      { name: ECOSYSTEM_SUPPORT_RESOURCE, value: 14 },
    ],
  }],
  properties: {},
};

// How much EcosystemSupport a single forest gives.
export function forestEcosystemSupport(): number {
  return FOREST_DEFINITION.buildingFunctions
    .flatMap(buildingFunction => buildingFunction.outputs)
    .filter(output => output.name === ECOSYSTEM_SUPPORT_RESOURCE)
    .reduce((total, output) => total + (output.value ?? 0), 0);
}

// A forest is drawn in whichever of its shapes its square is counted down to, the way a square of
// rock is, so that forests side by side do not look stamped from one another.
export function forestRenderingCode(variation: number): string {
  return (forestRenderingCodes[`${FORESTS_FOLDER}/${variation}.sgl`] ?? "").trim();
}

const FORESTS_FOLDER = "../assets/terrain/temperate/forests";

// The bodies of every shape a forest stands in, by the path it was read from.
const forestRenderingCodes = import.meta.glob<string>(
  "../assets/terrain/temperate/forests/*.sgl",
  { query: "?raw", import: "default", eager: true },
);
