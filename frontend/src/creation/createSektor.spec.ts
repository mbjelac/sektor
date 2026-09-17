import { describe, it, expect } from "vitest";
import { createSektor } from "./createSektor";
import { BuildingDefinition } from "../sektor/buildings/parseBuildingDefinitions";
import { SektorData } from "../../../shared/sektorData";
import { Sektor } from "../sektor/Sektor";
import { locationPropertiesToLocations } from "../sektor/locationProperties";
import { buildTheSolutionOn } from "./solutionPlan";

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

// A chain deeper than a walk can restrict: each building makes what the one above it eats, all the
// way down to loam, which nothing makes and anyone may import. The quarries are a trade of their
// own, there so the distractors have something to be drawn from other than the chain itself.
const deepChainDefinitions: BuildingDefinition[] = [
  buildingDefinition("Bakery", ["Dough"], { name: "Bread", value: 3 }),
  buildingDefinition("Doughworks", ["Flour"], { name: "Dough", value: 3 }),
  buildingDefinition("Mill", ["Wheat"], { name: "Flour", value: 3 }),
  buildingDefinition("WheatFarm", ["Seed"], { name: "Wheat", value: 3 }),
  buildingDefinition("SeedHouse", ["Sapling"], { name: "Seed", value: 3 }),
  buildingDefinition("Nursery", ["Cutting"], { name: "Sapling", value: 3 }),
  buildingDefinition("Grafter", ["Rootstock"], { name: "Cutting", value: 3 }),
  buildingDefinition("Rootery", ["Loam"], { name: "Rootstock", value: 3 }),
  buildingDefinition("Quarry", [], { name: "Stone", value: 1 }),
  buildingDefinition("Claypit", [], { name: "Clay", value: 1 }),
  buildingDefinition("Peatworks", [], { name: "Peat", value: 1 }),
  buildingDefinition("Saltings", [], { name: "Salt", value: 1 }),
  buildingDefinition("Gravelpit", [], { name: "Gravel", value: 1 }),
  buildingDefinition("Chalkpit", [], { name: "Chalk", value: 1 }),
];

// Bread is the only thing worth carrying out of this sektor, since everything else scores against
// the player, so the only requirement it can be given is bread and every walk goes down the chain.
const EVERYTHING_BUT_BREAD = deepChainDefinitions
  .flatMap(definition => definition.buildingFunctions)
  .flatMap(buildingFunction => buildingFunction.outputs)
  .map(output => output.name)
  .filter(resource => resource !== "Bread");

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

    expect(restrictedResourcesWithoutAProducer(sektorData, testDefinitions)).toEqual([]);
  });

  // A walk hands a restricted resource its producer only in the layer below the one which restricted
  // it, so a walk which stops because it has run out of layers must still go that one layer further.
  // The bread chain is deeper than a level 6 walk can restrict, so the walk down it ends that way
  // rather than by reaching something no building makes.
  it("allows a producer of the last resource it restricts, where the chain outlasts the layers", () => {
    const sektorData = createSektor(6, deepChainDefinitions, LOCAL_RESOURCES, EVERYTHING_BUT_BREAD, middleOfTheRange);

    expect(restrictedResourcesWithoutAProducer(sektorData, deepChainDefinitions)).toEqual([]);
  });

  // The guarantee is made on the flat ground, which is most of every map: high ground carries less
  // soil than flat ground does, so a mountainside can be left holding nothing of a property the
  // palette needs, and the sektor is solved on the plain below it instead.
  it("leaves something of every location property the palette needs, on every flat location", () => {
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
      everyFlatLocationHasSome: flatLocationValues(sektorData, propertyName).every(value => value > 0),
    }))).toEqual(neededProperties.map(propertyName => ({ property: propertyName, everyFlatLocationHasSome: true })));
  });

  it("requires more of a higher level than of a lower one", () => {
    expect([1, 2, 4, 6].map(level => createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange).exportRequirements.length))
      .toEqual([1, 2, 3, 4]);
  });

  // A sektor's map is not settled by its level, only bounded by it: the easiest levels are kept off
  // the biggest maps, where a short chain would sit in a field of tiles nobody builds on, and from
  // the sixth level on any size may come up.
  it("gives a sektor one of the sizes its level allows", () => {
    const levelsAndAllowedSizes: [number, number[]][] = [
      [1, [4, 6]], [2, [4, 6]], [3, [4, 6, 8]], [5, [4, 6, 8]], [6, [4, 6, 8, 10]], [12, [4, 6, 8, 10]],
    ];

    expect(levelsAndAllowedSizes.map(([level]) => ({
      level,
      sizes: [...new Set(Array.from({ length: 80 }, () =>
        createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, Math.random).size
      ))].sort((size, otherSize) => size - otherSize),
    }))).toEqual(levelsAndAllowedSizes.map(([level, sizes]) => ({ level, sizes })));
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
      { property: "altitude", rows: sektorData.size, rowLengths: [sektorData.size] },
    ]);
  });

  // The whole point of building the ground before asking anything of it: what a sektor requires is
  // a share of what a real arrangement of buildings was seen to deliver on that very map, so laying
  // that arrangement out again finishes the sektor. Not usually, and not with high probability.
  it("makes sektors which can be finished", () => {
    const levels = [1, 2, 3, 5, 8, 12];

    const outcomes = levels.map(level => {
      const sektorData = createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange);
      return {
        level,
        // A sektor asking for nothing would be "Done" the moment it was opened, which is not the
        // same thing as one which can be finished.
        asksForSomething: sektorData.exportRequirements.length > 0,
        status: statusOfTheSolvedSektor(sektorData),
      };
    });

    expect(outcomes).toEqual(levels.map(level => ({ level, asksForSomething: true, status: "Done" })));
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

  // A requirement asks for a resource to be sent out of the sektor, which already rules out
  // bringing any of it in, so a restriction on the same resource says nothing new.
  it("never restricts a resource it already requires", () => {
    const restrictedRequirements = Array.from({ length: 300 }, (_, run) => 1 + run % 6).flatMap(level => {
      const sektorData = createSektor(level, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, Math.random);
      const requiredResources = sektorData.exportRequirements.map(requirement => requirement.name);
      return sektorData.importRestrictions
        .map(restriction => restriction.name)
        .filter(resource => requiredResources.includes(resource));
    });

    expect(restrictedRequirements).toEqual([]);
  });

  it("makes a sektor which has no buildings in it yet", () => {
    const sektorData = createSektor(2, testDefinitions, LOCAL_RESOURCES, NEGATIVE_SCORING_RESOURCES, middleOfTheRange);

    expect({ level: sektorData.level, buildings: sektorData.buildings }).toEqual({ level: 2, buildings: [] });
  });
});

// Every resource a sektor caps the import of, which nothing it allows can make. A player handed one
// of these can neither bring it in nor produce it, so the sektor cannot be finished.
// What the sektor comes to once the solution it was built around is laid out on it: "Done" means a
// player placing those same buildings on those same locations has met every requirement without
// breaking a restriction.
function statusOfTheSolvedSektor(sektorData: SektorData): string {
  const locations = locationPropertiesToLocations(sektorData.locationProperties);
  const sektor = new Sektor(
    locations,
    testDefinitions,
    { importRestrictions: sektorData.importRestrictions, exportRequirements: sektorData.exportRequirements },
    NEGATIVE_SCORING_RESOURCES,
    LOCAL_RESOURCES,
    sektorData.allowedBuildings,
  );
  buildTheSolutionOn(
    sektor,
    sektorData.exportRequirements.map(requirement => requirement.name),
    sektorData.locationProperties,
    sektorData.importRestrictions,
    testDefinitions,
    sektorData.allowedBuildings,
    LOCAL_RESOURCES,
  );
  return sektor.getSektorState().status;
}

// What a property holds on the ground lying at the lowest altitude, which is the ground every
// building can be put up on.
function flatLocationValues(sektorData: SektorData, propertyName: string): number[] {
  return sektorData.locationProperties[propertyName]
    .flatMap((row, x) => row.filter((_, z) => sektorData.locationProperties.altitude[x][z] === 0));
}

function restrictedResourcesWithoutAProducer(sektorData: SektorData, buildingDefinitions: BuildingDefinition[]): string[] {
  return sektorData.importRestrictions
    .map(restriction => restriction.name)
    .filter(resource => !buildingDefinitions.some(definition =>
      sektorData.allowedBuildings.includes(definition.name)
      && definition.buildingFunctions.some(buildingFunction =>
        buildingFunction.outputs.some(output => output.name === resource)
      )
    ));
}
