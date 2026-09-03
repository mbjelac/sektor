import { describe, it, expect } from "vitest";
import { parseBuildingDefinitions } from "./parseBuildingDefinitions";

describe("parseBuildingDefinitions", () => {
  it("returns empty array for empty input", () => {
    expect(parseBuildingDefinitions([])).toEqual([]);
  });

  it("returns empty array when there is no heading", () => {
    expect(parseBuildingDefinitions(["some text", "more text"])).toEqual([]);
  });

  it("returns empty array when heading has no code block", () => {
    expect(parseBuildingDefinitions(["# MyBuilding", "some text"])).toEqual([]);
  });

  it("parses a building with code only and no function", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
    ]);

    expect(result).toEqual([{
      name: "MyBuilding",
      renderingCode: "box s(10,10,10)",
      buildingFunctions: [],
      outputModifiers: [],
      properties: {},
    }]);
  });

  it("parses rendering code with multiple lines", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
      "## Render",
      "```",
      "box s(10,10,10)",
      "cyl s(5,5,5)",
      "```",
    ]);

    expect(result[0].renderingCode).toEqual("box s(10,10,10)\ncyl s(5,5,5)");
  });

  it("parses building function with inputs and outputs", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "Iron 3",
      "Coal 2",
      "=",
      "Steel 5",
    ]);

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

  it("parses building function with inputs only", () => {
    const result = parseBuildingDefinitions([
      "# Consumer",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "Water 5",
    ]);

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [{ name: "Water", value: 5 }],
      outputs: [],
    });
  });

  it("parses building function with outputs only", () => {
    const result = parseBuildingDefinitions([
      "# Source",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "=",
      "Energy 10",
    ]);

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [],
      outputs: [{ name: "Energy", value: 10 }],
    });
  });

  it("accepts blank lines in rendering code section", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
      "",
      "## Render",
      "```",
      "box s(10,10,10)",
      "",
      "cyl s(5,5,5)",
      "```",
    ]);

    expect(result[0].renderingCode).toEqual("box s(10,10,10)\n\ncyl s(5,5,5)");
  });

  it("ignores blank lines in function section", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "",
      "Iron 3",
      "",
      "=",
      "",
      "Steel 5",
      "",
    ]);

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [{ name: "Iron", value: 3 }],
      outputs: [{ name: "Steel", value: 5 }],
    });
  });

  it("ignores lines that don't match resource format", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "some random text",
      "Iron 3",
      "=",
      "Steel 5",
    ]);

    expect(result[0].buildingFunctions[0]).toEqual({
      inputs: [{ name: "Iron", value: 3 }],
      outputs: [{ name: "Steel", value: 5 }],
    });
  });

  it("parses showFloor=false property", () => {
    const result = parseBuildingDefinitions([
      "# Mine",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "Iron 3",
      "=",
      "Ore 5",
      "## Properties",
      "showFloor=false",
    ]);

    expect(result[0].properties).toEqual({ showFloor: false });
  });

  it("returns empty properties when no Properties section exists", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
    ]);

    expect(result[0].properties).toEqual({});
  });

  it("returns empty properties when Properties section has no recognized properties", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Properties",
      "unknownProp=true",
    ]);

    expect(result[0].properties).toEqual({});
  });

  it("ignores blank lines in properties section", () => {
    const result = parseBuildingDefinitions([
      "# Mine",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Properties",
      "",
      "showFloor=false",
      "",
    ]);

    expect(result[0].properties).toEqual({ showFloor: false });
  });

  it("parses multiple buildings", () => {
    const result = parseBuildingDefinitions([
      "# BuildingA",
      "## Render",
      "```",
      "box s(1,1,1)",
      "```",
      "## Function",
      "Water 2",
      "=",
      "Steam 1",
      "# BuildingB",
      "## Render",
      "```",
      "cyl s(5,5,5)",
      "```",
      "## Function",
      "Iron 4",
      "=",
      "Steel 3",
    ]);

    expect(result).toEqual([
      {
        name: "BuildingA",
        renderingCode: "box s(1,1,1)",
        buildingFunctions: [{
          inputs: [{ name: "Water", value: 2 }],
          outputs: [{ name: "Steam", value: 1 }],
        }],
        outputModifiers: [],
        properties: {},
      },
      {
        name: "BuildingB",
        renderingCode: "cyl s(5,5,5)",
        buildingFunctions: [{
          inputs: [{ name: "Iron", value: 4 }],
          outputs: [{ name: "Steel", value: 3 }],
        }],
        outputModifiers: [],
        properties: {},
      },
    ]);
  });

  it("trims whitespace from building name", () => {
    const result = parseBuildingDefinitions([
      "#   SpacedName  ",
      "## Render",
      "```",
      "box s(1,1,1)",
      "```",
    ]);

    expect(result[0].name).toEqual("SpacedName");
  });

  it("ignores code block outside of Render section", () => {
    const result = parseBuildingDefinitions([
      "# MyBuilding",
      "```",
      "box s(10,10,10)",
      "```",
    ]);

    expect(result).toEqual([]);
  });

  it("parses output modifiers when property name is present", () => {
    const result = parseBuildingDefinitions([
      "# Farm",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "Water 3",
      "=",
      "Food 5 soil",
      "Grain 2 groundwater",
    ]);

    expect(result[0].outputModifiers).toEqual([
      { resource: "Food", property: "soil" },
      { resource: "Grain", property: "groundwater" },
    ]);
  });

  it("returns empty outputModifiers when no property names are present", () => {
    const result = parseBuildingDefinitions([
      "# Factory",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "Iron 3",
      "=",
      "Steel 5",
    ]);

    expect(result[0].outputModifiers).toEqual([]);
  });

  it("parses mixed outputs with and without property names", () => {
    const result = parseBuildingDefinitions([
      "# MixedFactory",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "Energy 2",
      "=",
      "Heat 3",
      "Crop 4 soil",
    ]);

    expect(result[0].outputModifiers).toEqual([
      { resource: "Crop", property: "soil" },
    ]);
  });

  it("parses a building with two function sections", () => {
    const result = parseBuildingDefinitions([
      "# Workshop",
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "## Function",
      "Ore 4",
      "=",
      "Tools 2",
      "## Function",
      "Wood 3",
      "=",
      "Tools 3",
    ]);

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
      "## Render",
      "```",
      "box s(10,10,10)",
      "```",
      "Iron 3",
      "=",
      "Steel 5",
    ]);

    expect(result[0].buildingFunctions).toEqual([]);
  });
});
