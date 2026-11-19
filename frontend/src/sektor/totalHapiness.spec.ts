import { describe, it, expect } from "vitest";
import { totalHapiness } from "./totalHapiness";

describe("totalHapiness", () => {
  it("is the Hapiness of every sektor added up", () => {
    expect([totalHapiness([12, 0.1, 0.2]), totalHapiness([])]).toEqual([12.3, 0]);
  });
});
