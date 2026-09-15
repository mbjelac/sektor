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
  buildingDefinition("Hostel", ["Bread", "Care"], { name: "Lodging", value: 4 }),
  { name: "Wrecker", renderingCode: "box s(1,1,1)", buildingFunctions: [], properties: {} },
  // A trade of its own, of no use to anyone baking bread — something for a palette to be padded with.
  buildingDefinition("Quarry", [], { name: "Stone", locationProperty: "rock" }),
  buildingDefinition("Kiln", ["Stone"], { name: "Brick", value: 4 }),
  buildingDefinition("Smithy", ["Brick"], { name: "Tool", value: 3 }),
  buildingDefinition("Depot", ["Tool"], { name: "Crate", value: 2 }),
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
      everyLocationHasSome: sektorData.locationProperties[propertyName].flat().every(value => value > 0),
    }))).toEqual(neededProperties.map(propertyName => ({ property: propertyName, everyLocationHasSome: true })));
  });

  it("requires more of a higher level than of a lower one", () => {
    expect([1, 2, 4, 6].map(level => createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange).exportRequirements.length))
      .toEqual([1, 2, 3, 4]);
  });

  // A short chain is not handed a field of tiles nobody will build on, and a long one is not
  // crammed onto ground it cannot stand on, so the map grows along with what the sektor asks for.
  it("gives a sektor of a high level more ground than one of the lowest level", () => {
    const sizes = [1, 12].map(level =>
      createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange).size
    );

    expect(sizes).toEqual([4, 8]);
  });

  // Every location of the sektor holds a value of every property, so a property covers the map and
  // no more of it: a matrix wider than the sektor describes ground which is not there.
  it("lays every location property out over the whole of the sektor's map and no further", () => {
    const sektorData = createSektor(3, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange);

    expect(Object.entries(sektorData.locationProperties).map(([propertyName, matrix]) => ({
      property: propertyName,
      rows: matrix.length,
      rowLengths: [...new Set(matrix.map(row => row.length))],
    }))).toEqual([
      { property: "soil", rows: sektorData.size, rowLengths: [sektorData.size] },
      { property: "groundwater", rows: sektorData.size, rowLengths: [sektorData.size] },
      { property: "rock", rows: sektorData.size, rowLengths: [sektorData.size] },
    ]);
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

  // A local resource cannot be imported at any level, so a building needing one starves unless the
  // palette also holds something which makes it. The Hostel needs Care, which only the Surgery makes.
  it("allows a producer of every local resource its buildings need", () => {
    const palettesMissingAProducer = Array.from({ length: 300 }, (_, run) => 1 + run % 4).flatMap(level => {
      const sektorData = createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, Math.random);
      const palette = testDefinitions.filter(definition => sektorData.allowedBuildings.includes(definition.name));
      const produced = palette.flatMap(definition => definition.buildingFunctions).flatMap(buildingFunction => buildingFunction.outputs).map(output => output.name);
      return palette
        .flatMap(definition => definition.buildingFunctions)
        .flatMap(buildingFunction => buildingFunction.inputs)
        .map(input => input.name)
        .filter(resource => LOCAL_RESOURCES.includes(resource) && !produced.includes(resource));
    });

    expect(palettesMissingAProducer).toEqual([]);
  });

  it("makes a sektor which has no buildings in it yet", () => {
    const sektorData = createSektor(2, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange);

    expect({ level: sektorData.level, buildings: sektorData.buildings }).toEqual({ level: 2, buildings: [] });
  });
});
