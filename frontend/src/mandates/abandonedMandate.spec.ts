import { describe, it, expect } from "vitest";
import { abandonedMandate } from "./abandonedMandate";

describe("abandonedMandate", () => {
  it("leaves a mandate given up with no owner and nothing of it completed", () => {
    expect(abandonedMandate({
      number: 4,
      owner: "Ada",
      criteria: [
        { type: "minimumExport", resourceName: "Apples", amount: 12, completed: true },
        { type: "maximumImport", resourceName: "Bricks", amount: 7, completed: false },
      ],
      completed: false,
    })).toEqual({
      number: 4,
      owner: null,
      criteria: [
        { type: "minimumExport", resourceName: "Apples", amount: 12, completed: false },
        { type: "maximumImport", resourceName: "Bricks", amount: 7, completed: false },
      ],
      completed: false,
    });
  });
});
