import { describe, it, expect } from "vitest";
import { displayedSektorStatus } from "./sektorStatus";

describe("displayedSektorStatus", () => {
  it("is what the sektor works out for itself when a player owns it", () => {
    expect([
      displayedSektorStatus("Ada", "InProgress"),
      displayedSektorStatus("Ada", "Done"),
      displayedSektorStatus("Ada", "Overrun"),
    ]).toEqual(["InProgress", "Done", "Overrun"]);
  });

  it("is Idle whatever the sektor works out, when nobody owns it", () => {
    expect([
      displayedSektorStatus(null, "InProgress"),
      displayedSektorStatus(null, "Done"),
      displayedSektorStatus(null, "Overrun"),
    ]).toEqual(["Idle", "Idle", "Idle"]);
  });
});
