import { Building, IMPORT_EXPORT_RESOURCE } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

// A sektor ships nothing in or out without a hub, so tests about anything else stand one in their
// sektor which carries enough for every one of their buildings. It stands off the test map so that
// it takes no test building's place.
export const TEST_HUB_DEFINITION: BuildingDefinition = {
  name: "TestHub",
  renderingCode: "box s(1,1,1)",
  buildingFunctions: [{
    inputs: [],
    outputs: [{ name: IMPORT_EXPORT_RESOURCE, value: 100 }],
  }],
  properties: {},
};

export const TEST_HUB: Building = { type: "TestHub", location: { x: -1, y: -1 } };
