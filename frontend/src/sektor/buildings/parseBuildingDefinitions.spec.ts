import { describe, it, expect } from "vitest";
import { parseBuildingDefinitions } from "./parseBuildingDefinitions";

describe("parseBuildingDefinitions", () => {
  it("returns empty array for empty input", () => {
    expect(parseBuildingDefinitions([], {})).toEqual([]);
  });

  it("returns empty array when there is no heading", () => {
    expect(parseBuildingDefinitions(["some text", "more text"], {})).toEqual([]);
  });

  it("leaves out a building without a rendering file", () => {
    expect(parseBuildingDefinitions(["# MyBuilding", "some text"], {})).toEqual([]);
  });

  it("parses a building with code only and no function", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
    ], { "MyBuilding/0.sgl": "box s(10,10,10)" });

    expect(result).toEqual([{
      name: "MyBuilding",
      renderingCodes: ["box s(10,10,10)"],
      buildingFunctions: [],
      properties: {},
    }]);
  });

  it("parses rendering code with multiple lines", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
    ], { "MyBuilding/0.sgl": "box s(10,10,10)\ncyl s(5,5,5)" });

    expect(result[0].renderingCodes).toEqual(["box s(10,10,10)\ncyl s(5,5,5)"]);
  });

  it("parses building function with inputs and outputs", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Function",
      "Iron 3",
      "Coal 2",
      "->",
      "Steel 5",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [
        { name: "Iron", value: 3 },
        { name: "Coal", value: 2 },
      ],
      outputs: [
        { name: "Steel", value: 5 },
      ],
    });
  });

  it("parses building function name", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Function",
      "Name: Steel making",
      "Iron 3",
      "->",
      "Steel 5",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0]).toEqual({
      name: "Steel making",
      inputs: [
        { name: "Iron", value: 3 },
      ],
      outputs: [
        { name: "Steel", value: 5 },
      ],
    });
  });

  it("parses each building function name separately", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Function",
      "Name: Steel making",
      "Iron 3",
      "->",
      "Steel 5",
      "## Function",
      "Coal 2",
      "->",
      "Heat 1",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions).toEqual([
      {
        name: "Steel making",
        inputs: [{ name: "Iron", value: 3 }],
        outputs: [{ name: "Steel", value: 5 }],
      },
      {
        inputs: [{ name: "Coal", value: 2 }],
        outputs: [{ name: "Heat", value: 1 }],
      },
    ]);
  });

  it("parses building function with inputs only", () => {
    const result = parseBuildingDefinitions([
      "# Consumer",
      "## Function",
      "Water 5",
    ], { "Consumer/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [{ name: "Water", value: 5 }],
      outputs: [],
    });
  });

  it("parses building function with outputs only", () => {
    const result = parseBuildingDefinitions([
      "# Source",
      "## Function",
      "->",
      "Energy 10",
    ], { "Source/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [],
      outputs: [{ name: "Energy", value: 10 }],
    });
  });

  it("keeps blank lines of the rendering file", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
      "",
    ], { "MyBuilding/0.sgl": "box s(10,10,10)\n\ncyl s(5,5,5)" });

    expect(result[0].renderingCodes).toEqual(["box s(10,10,10)\n\ncyl s(5,5,5)"]);
  });

  it("ignores blank lines in function section", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Function",
      "",
      "Iron 3",
      "",
      "->",
      "",
      "Steel 5",
      "",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [{ name: "Iron", value: 3 }],
      outputs: [{ name: "Steel", value: 5 }],
    });
  });

  it("ignores lines that don't match resource format", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Function",
      "some random text",
      "Iron 3",
      "->",
      "Steel 5",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [{ name: "Iron", value: 3 }],
      outputs: [{ name: "Steel", value: 5 }],
    });
  });

  it("parses showFloor=false property", () => {
    const result = parseBuildingDefinitions([
      "# Mine",
      "## Function",
      "Iron 3",
      "->",
      "Ore 5",
      "## Properties",
      "showFloor=false",
    ], { "Mine/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({ showFloor: false });
  });

  it("parses minLevel property", () => {
    const result = parseBuildingDefinitions([
      "# Mine",
      "## Properties",
      "minLevel=4",
    ], { "Mine/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({ minLevel: 4 });
  });

  it("parses an output marked as affected by pollution", () => {
    const result = parseBuildingDefinitions([
      "# Purifier",
      "## Function",
      "Energy 2",
      "->",
      "Water 5 pollution",
      "Steam 1",
    ], { "Purifier/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0].outputs).toEqual([
      { name: "Water", value: 5, affectedByPollution: true },
      { name: "Steam", value: 1 },
    ]);
  });

  it("parses pollutionArea property", () => {
    const result = parseBuildingDefinitions([
      "# Smokestack",
      "## Properties",
      "pollutionArea=3",
    ], { "Smokestack/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({ pollutionArea: 3 });
  });

  it("parses randomizedDelayAnimationStart property as a number of seconds", () => {
    const result = ["3", "1.5"].map(randomizedDelayAnimationStart => parseBuildingDefinitions([
      "# Windmill",
      "## Properties",
      `randomizedDelayAnimationStart=${randomizedDelayAnimationStart}`,
    ], { "Windmill/0.sgl": "box s(10,10,10)" })[0].properties);

    expect(result).toEqual([{ randomizedDelayAnimationStart: 3 }, { randomizedDelayAnimationStart: 1.5 }]);
  });

  it("ignores a randomizedDelayAnimationStart property which is not a number", () => {
    const result = parseBuildingDefinitions([
      "# Windmill",
      "## Properties",
      "randomizedDelayAnimationStart=soon",
    ], { "Windmill/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({});
  });

  // A building fouls the ground at least one square around it and at most four.
  it("ignores a pollutionArea property outside of 1 to 4", () => {
    const result = ["0", "5"].map(pollutionArea => parseBuildingDefinitions([
      "# Smokestack",
      "## Properties",
      `pollutionArea=${pollutionArea}`,
    ], { "Smokestack/0.sgl": "box s(10,10,10)" })[0].properties);

    expect(result).toEqual([{}, {}]);
  });

  it("parses Tags section as a list of tags, one per line", () => {
    const result = parseBuildingDefinitions([
      "# Mine",
      "## Tags",
      "",
      "fruit",
      "  metal  ",
      "",
    ], { "Mine/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({ tags: ["fruit", "metal"] });
  });

  it("returns empty properties when no Properties section exists", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({});
  });

  it("returns empty properties when Properties section has no recognized properties", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Properties",
      "unknownProp=true",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({});
  });

  it("ignores blank lines in properties section", () => {
    const result = parseBuildingDefinitions([
      "# Mine",
      "## Properties",
      "",
      "showFloor=false",
      "",
    ], { "Mine/0.sgl": "box s(10,10,10)" });

    expect(result[0].properties).toEqual({ showFloor: false });
  });

  it("parses multiple buildings", () => {
    const result = parseBuildingDefinitions([
      "# BuildingA",
      "## Function",
      "Water 2",
      "->",
      "Steam 1",
      "# BuildingB",
      "## Function",
      "Iron 4",
      "->",
      "Steel 3",
    ], { "BuildingA/0.sgl": "box s(1,1,1)", "BuildingB/0.sgl": "cyl s(5,5,5)" });

    expect(result).toEqual([
      {
        name: "BuildingA",
        renderingCodes: ["box s(1,1,1)"],
        buildingFunctions: [{
          inputs: [{ name: "Water", value: 2 }],
          outputs: [{ name: "Steam", value: 1 }],
        }],
        properties: {},
      },
      {
        name: "BuildingB",
        renderingCodes: ["cyl s(5,5,5)"],
        buildingFunctions: [{
          inputs: [{ name: "Iron", value: 4 }],
          outputs: [{ name: "Steel", value: 3 }],
        }],
        properties: {},
      },
    ]);
  });

  it("trims whitespace from building name", () => {
    const result = parseBuildingDefinitions([
      "#   SpacedName  ",
    ], { "SpacedName/0.sgl": "box s(1,1,1)" });

    expect(result[0].name).toEqual("SpacedName");
  });

  it("leaves out a building whose code is written in its definition instead of its rendering file", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
      "```",
      "box s(10,10,10)",
      "```",
    ], {});

    expect(result).toEqual([]);
  });

  it("trims blank lines around the code of the rendering file", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
    ], { "MyBuilding/0.sgl": "\nbox s(10,10,10)\n" });

    expect(result[0].renderingCodes).toEqual(["box s(10,10,10)"]);
  });

  it("parses the rendering files numbered from 0 up as the variants of the building", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
    ], { "MyBuilding/1.sgl": "cyl s(5,5,5)", "MyBuilding/0.sgl": "box s(10,10,10)", "MyBuilding/2.sgl": "pri4 s(3,3,3)" });

    expect(result[0].renderingCodes).toEqual(["box s(10,10,10)", "cyl s(5,5,5)", "pri4 s(3,3,3)"]);
  });

  it("ends the variants of the building at the first number without a rendering file", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
    ], { "MyBuilding/0.sgl": "box s(10,10,10)", "MyBuilding/1.sgl": "cyl s(5,5,5)", "MyBuilding/3.sgl": "pri4 s(3,3,3)" });

    expect(result[0].renderingCodes).toEqual(["box s(10,10,10)", "cyl s(5,5,5)"]);
  });

  it("does not take the construction rendering file for a variant of the building", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
    ], { "MyBuilding/0.sgl": "box s(10,10,10)", "MyBuilding/0.construction.sgl": "box s(2,2,2)" });

    expect(result[0].renderingCodes).toEqual(["box s(10,10,10)"]);
  });

  it("leaves out a building whose folder holds only other rendering files", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
    ], { "MyBuilding/1.sgl": "box s(10,10,10)", "OtherBuilding/0.sgl": "cyl s(5,5,5)" });

    expect(result).toEqual([]);
  });

  it("parses an output written with a location property name as a reference to that property", () => {
    const result = parseBuildingDefinitions([
      "# Farm",
      "## Function",
      "Water 3",
      "->",
      "Food soil",
      "Grain groundwater",
    ], { "Farm/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0].outputs).toEqual([
      { name: "Food", locationProperty: "soil" },
      { name: "Grain", locationProperty: "groundwater" },
    ]);
  });

  it("parses an output written with a fraction of a location property as that property and divisor", () => {
    const result = parseBuildingDefinitions([
      "# Orchard",
      "## Function",
      "Water 1",
      "->",
      "Food soil/3",
    ], { "Orchard/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0].outputs).toEqual([
      { name: "Food", locationProperty: "soil", locationPropertyDivisor: 3 },
    ]);
  });

  it("parses an output written with an amount as that amount", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Function",
      "Iron 3",
      "->",
      "Steel 5",
    ], { "Factory/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0].outputs).toEqual([
      { name: "Steel", value: 5 },
    ]);
  });

  it("parses outputs with amounts alongside outputs with location property names", () => {
    const result = parseBuildingDefinitions([
      "# MixedFactory",
      "## Function",
      "Energy 2",
      "->",
      "Heat 3",
      "Crop soil",
    ], { "MixedFactory/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0].outputs).toEqual([
      { name: "Heat", value: 3 },
      { name: "Crop", locationProperty: "soil" },
    ]);
  });

  it("gives each building function the location properties of its own outputs", () => {
    const result = parseBuildingDefinitions([
      "# Workshop",
      "## Function",
      "Ore 4",
      "->",
      "Tools ore",
      "## Function",
      "Wood 3",
      "->",
      "Tools wind",
    ], { "Workshop/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions.map(buildingFunction => buildingFunction.outputs)).toEqual([
      [{ name: "Tools", locationProperty: "ore" }],
      [{ name: "Tools", locationProperty: "wind" }],
    ]);
  });

  it("marks a function with the Active always property as always active", () => {
    const result = parseBuildingDefinitions([
      "# Reactor",
      "## Function",
      "Water 2",
      "->",
      "Energy 5",
      "## Function",
      "Active: always",
      "Energy 1",
      "->",
      "Water 1",
    ], { "Reactor/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions.map(buildingFunction => buildingFunction.alwaysActive))
      .toEqual([undefined, true]);
  });

  it("leaves a function with another Active value switchable", () => {
    const result = parseBuildingDefinitions([
      "# Reactor",
      "## Function",
      "Active: sometimes",
      "Water 2",
      "->",
      "Energy 5",
    ], { "Reactor/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions[0].alwaysActive).toEqual(undefined);
  });

  it("parses a building with two function sections", () => {
    const result = parseBuildingDefinitions([
      "# Workshop",
      "## Function",
      "Ore 4",
      "->",
      "Tools 2",
      "## Function",
      "Wood 3",
      "->",
      "Tools 3",
    ], { "Workshop/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions).toEqual([
      {
        inputs: [{ name: "Ore", value: 4 }],
        outputs: [{ name: "Tools", value: 2 }],
      },
      {
        inputs: [{ name: "Wood", value: 3 }],
        outputs: [{ name: "Tools", value: 3 }],
      },
    ]);
  });

  it("ignores resource lines outside of Function section", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
      "Iron 3",
      "->",
      "Steel 5",
    ], { "MyBuilding/0.sgl": "box s(10,10,10)" });

    expect(result[0].buildingFunctions).toEqual([]);
  });

  it("parses construction render from its rendering file with the duration of its definition", () => {
    const result = parseBuildingDefinitions([
      "# Tower",
      "## Construction",
      "",
      "duration=1500",
      "",
    ], { "Tower/0.sgl": "box s(10,10,10)", "Tower/0.construction.sgl": "box s(2,2,2)\ncyl s(1,1,1)\n" });

    expect(result).toEqual([{
      name: "Tower",
      renderingCodes: ["box s(10,10,10)"],
      constructionRender: { renderingCodes: ["box s(2,2,2)\ncyl s(1,1,1)"], duration: 1500 },
      buildingFunctions: [],
      properties: {},
    }]);
  });

  it("ignores construction render without duration", () => {
    const result = parseBuildingDefinitions([
      "# Tower",
    ], { "Tower/0.sgl": "box s(10,10,10)", "Tower/0.construction.sgl": "box s(2,2,2)" });

    expect(result[0].constructionRender).toEqual(undefined);
  });

  it("ignores construction duration without a construction rendering file", () => {
    const result = parseBuildingDefinitions([
      "# Tower",
      "## Construction",
      "duration=1000",
    ], { "Tower/0.sgl": "box s(10,10,10)" });

    expect(result[0].constructionRender).toEqual(undefined);
  });

  it("keeps construction render to the building it belongs to", () => {
    const result = parseBuildingDefinitions([
      "# Tower",
      "## Construction",
      "duration=1000",
      "# Shed",
    ], { "Tower/0.sgl": "box s(10,10,10)", "Tower/0.construction.sgl": "box s(2,2,2)", "Shed/0.sgl": "box s(5,5,5)" });

    expect(result.map(building => building.constructionRender)).toEqual([
      { renderingCodes: ["box s(2,2,2)"], duration: 1000 },
      undefined,
    ]);
  });

  it("parses the construction of every variant, leaving out a variant without one", () => {
    const result = parseBuildingDefinitions([
      "# Tower",
      "## Construction",
      "duration=1000",
    ], {
      "Tower/0.sgl": "box s(10,10,10)",
      "Tower/1.sgl": "box s(20,20,20)",
      "Tower/2.sgl": "box s(30,30,30)",
      "Tower/1.construction.sgl": "box s(2,2,2)",
      "Tower/2.construction.sgl": "box s(3,3,3)",
    });

    expect(result[0].constructionRender).toEqual({ renderingCodes: [null, "box s(2,2,2)", "box s(3,3,3)"], duration: 1000 });
  });

  it("ignores the construction of a variant the building does not have", () => {
    const result = parseBuildingDefinitions([
      "# Tower",
      "## Construction",
      "duration=1000",
    ], { "Tower/0.sgl": "box s(10,10,10)", "Tower/1.construction.sgl": "box s(2,2,2)" });

    expect(result[0].constructionRender).toEqual(undefined);
  });
});
