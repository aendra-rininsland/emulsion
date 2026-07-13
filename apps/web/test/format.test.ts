import { describe, it, expect } from "vitest";
import { formatAperture, formatExposureTime, formatFocalLength, formatIso } from "../src/lib/format.js";

describe("formatAperture", () => {
  it("formats a decimal f-number as f/x", () => {
    expect(formatAperture(2)).toBe("f/2");
    expect(formatAperture(1.8)).toBe("f/1.8");
    expect(formatAperture(2.8)).toBe("f/2.8");
  });

  it("returns undefined for undefined input", () => {
    expect(formatAperture(undefined)).toBeUndefined();
  });
});

describe("formatExposureTime", () => {
  it("formats sub-second exposures as a fraction", () => {
    expect(formatExposureTime(0.0005)).toBe("1/2000s");
    expect(formatExposureTime(1 / 250)).toBe("1/250s");
  });

  it("formats exposures of one second or longer as decimal seconds", () => {
    expect(formatExposureTime(2)).toBe("2s");
    expect(formatExposureTime(1.5)).toBe("1.5s");
  });

  it("returns undefined for undefined input", () => {
    expect(formatExposureTime(undefined)).toBeUndefined();
  });
});

describe("formatFocalLength", () => {
  it("appends mm", () => {
    expect(formatFocalLength(23)).toBe("23mm");
  });

  it("returns undefined for undefined input", () => {
    expect(formatFocalLength(undefined)).toBeUndefined();
  });
});

describe("formatIso", () => {
  it("prefixes with ISO", () => {
    expect(formatIso(200)).toBe("ISO 200");
  });

  it("returns undefined for undefined input", () => {
    expect(formatIso(undefined)).toBeUndefined();
  });
});
