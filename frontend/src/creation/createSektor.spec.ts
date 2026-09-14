import { describe, it, expect } from "vitest";
import { createSektor } from "./createSektor";
import { BuildingDefinition } from "../sektor/buildings/parseBuildingDefinitions";

function buildingDefinition(
  name: string,
  inputs: string[],
  output: { name: string, value?: number, locationProperty?: string },
): BuildingDefinition {
  return {
    name,
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: inputs.map(inputName => ({ name: inputName, value: 1 })),
      outputs: [output],
    }],
    properties: {},
  };
}

// Bread is baked from flour and water, flour is milled from wheat, wheat is grown on soil, and
// water is drawn from groundwater. The Scrapyard makes nothing anyone needs, and the Wrecker is
// the destruction tool: a building with no function at all.
const testDefinitions: BuildingDefinition[] = [
  buildingDefinition("Bakery", ["Flour", "Water"], { name: "Bread", value: 3 }),
  buildingDefinition("Mill", ["Wheat"], { name: "Flour", value: 4 }),
  buildingDefinition("WheatFarm", ["Water"], { name: "Wheat", locationProperty: "soil" }),
  buildingDefinition("Well", [], { name: "Water", locationProperty: "groundwater" }),
  buildingDefinition("Scrapyard", ["Bread"], { name: "Scrap", value: 1 }),
  buildingDefinition("Surgery", ["Bread"], { name: "Care", value: 2 }),
  { name: "Wrecker", renderingCode: "box s(1,1,1)", buildingFunctions: [], properties: {} },
];

// Care is made in the sektor and used there, and can never be carried out of it.
const LOCAL_RESOURCES = ["Care"];

// Scrap is what is left over, and a sektor scores worse the more of it it puts out.
const NEGATIVE_SCORING_RESOURCES = ["Scrap"];

// Every draw lands in the middle of whatever it is choosing from, so the same sektor comes out
// every time and the test can say exactly what it expects.
function middleOfTheRange(): number {
  return 0.5;
}

describe("createSektor", () => {
  it("allows a producer of every resource it restricts", () => {
    const sektorData = createSektor(3, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange);

    const producersOfRestrictedResources = sektorData.importRestrictions.map(restriction => ({
      resource: restriction.name,
      allowsAProducer: testDefinitions.some(definition =>
        sektorData.allowedBuildings.includes(definition.name)
        && definition.buildingFunctions.some(buildingFunction =>
          buildingFunction.outputs.some(output => output.name === restriction.name)
        )
      ),
    }));

    expect(producersOfRestrictedResources.every(producer => producer.allowsAProducer)).toEqual(true);
  });

  it("leaves something of every location property the palette needs, on every location", () => {
    const sektorData = createSektor(5, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, () => 0);

    const neededProperties = ["soil", "groundwater"].filter(propertyName =>
      testDefinitions.some(definition =>
        sektorData.allowedBuildings.includes(definition.name)
        && definition.buildingFunctions.some(buildingFunction =>
          buildingFunction.outputs.some(output => output.locationProperty === propertyName)
        )
      )
    );

    expect(neededProperties.map(propertyName => ({
      property: propertyName,
      lowestValue: Math.min(...sektorData.locationProperties[propertyName].flat()),
    }))).toEqual(neededProperties.map(propertyName => ({ property: propertyName, lowestValue: 1 })));
  });

  it("requires more of a higher level than of a lower one", () => {
    expect([1, 2, 4, 6].map(level => createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange).exportRequirements.length))
      .toEqual([1, 2, 3, 4]);
  });

  it("never allows a building which does nothing", () => {
    const sektorData = createSektor(6, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange);

    expect(sektorData.allowedBuildings.includes("Wrecker")).toEqual(false);
  });

  // A local resource cannot be exported at all, and exporting a negative one scores against the
  // player, so a sektor requiring either could never be worth finishing.
  it("never requires a resource which cannot leave the sektor or scores against the player", () => {
    const requiredResources = [1, 2, 3, 4, 5, 6].flatMap(level =>
      createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, Math.random).exportRequirements.map(requirement => requirement.name)
    );

    expect(requiredResources.some(resource =>
      [...LOCAL_RESOURCES, ...NEGATIVE_SCORING_RESOURCES].includes(resource)
    )).toEqual(false);
  });

  it("makes a sektor which has no buildings in it yet", () => {
    const sektorData = createSektor(2, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange);

    expect({ level: sektorData.level, buildings: sektorData.buildings }).toEqual({ level: 2, buildings: [] });
  });
});
