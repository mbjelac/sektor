import { describe, it, expect } from "vitest";
import { formatNumber } from "./formatNumber";

describe("formatNumber", () => {
  it("displays a whole number without decimals", () => {
    expect(formatNumber(34)).toEqual("34");
  });

  it("displays a number without its trailing zeros", () => {
    expect(formatNumber(34.2)).toEqual("34.2");
  });

  it("displays a number with two decimal places", () => {
    expect(formatNumber(34.25)).toEqual("34.25");
  });

  it("rounds a number to two decimal places", () => {
    expect(formatNumber(34.256)).toEqual("34.26");
  });

  it("displays a negative number", () => {
    expect(formatNumber(-34.256)).toEqual("-34.26");
  });

  it("displays zero", () => {
    expect(formatNumber(0)).toEqual("0");
  });
});
