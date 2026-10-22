import { afterEach, describe, expect, it } from "vitest";
import { areExperimentalFeaturesEnabled } from "../src/core/experimental.ts";

describe("areExperimentalFeaturesEnabled", () => {
	const originalPiExperimental = process.env.GCODE_EXPERIMENTAL;

	afterEach(() => {
		if (originalPiExperimental === undefined) {
			delete process.env.GCODE_EXPERIMENTAL;
		} else {
			process.env.GCODE_EXPERIMENTAL = originalPiExperimental;
		}
	});

	it("returns false when GCODE_EXPERIMENTAL is unset", () => {
		delete process.env.GCODE_EXPERIMENTAL;

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns false when GCODE_EXPERIMENTAL is empty", () => {
		process.env.GCODE_EXPERIMENTAL = "";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns true when GCODE_EXPERIMENTAL is set to 1", () => {
		process.env.GCODE_EXPERIMENTAL = "1";

		expect(areExperimentalFeaturesEnabled()).toBe(true);
	});

	it("returns false when GCODE_EXPERIMENTAL is set to 0", () => {
		process.env.GCODE_EXPERIMENTAL = "0";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns false when GCODE_EXPERIMENTAL is set to a non-1 value", () => {
		process.env.GCODE_EXPERIMENTAL = "true";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});
});
