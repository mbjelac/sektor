import { describe, it, expect } from "vitest";
import { createMandate } from "./createMandate";

const EXPORTABLE_RESOURCES = ["Apples", "Bricks", "Cloth", "Dyes"];

function alwaysDrawing(draw: number): () => number {
  return () => draw;
}

describe("createMandate", () => {
  it("asks for at least so much of a resource drawn at random to be exported, owned and completed by nobody", () => {
    expect(createMandate(7, EXPORTABLE_RESOURCES, alwaysDrawing(0.5))).toEqual({
      number: 7,
      owner: null,
      criteria: [{ type: "minimumExport", resourceName: "Cloth", amount: 18, completed: false }],
      completed: false,
    });
  });

  it("asks for at least 5 and at most 30 exported", () => {
    expect([0, 0.9999].map(draw => createMandate(1, EXPORTABLE_RESOURCES, alwaysDrawing(draw)).criteria))
      .toEqual([
        [{ type: "minimumExport", resourceName: "Apples", amount: 5, completed: false }],
        [{ type: "minimumExport", resourceName: "Dyes", amount: 30, completed: false }],
      ]);
  });
});
