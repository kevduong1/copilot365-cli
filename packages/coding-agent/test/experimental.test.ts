import { afterEach, describe, expect, it } from "vitest";
import { areExperimentalFeaturesEnabled } from "../src/core/experimental.ts";

describe("areExperimentalFeaturesEnabled", () => {
	const originalPiExperimental = process.env.GARMIN_CODE_MINI_EXPERIMENTAL;

	afterEach(() => {
		if (originalPiExperimental === undefined) {
			delete process.env.GARMIN_CODE_MINI_EXPERIMENTAL;
		} else {
			process.env.GARMIN_CODE_MINI_EXPERIMENTAL = originalPiExperimental;
		}
	});

	it("returns false when GARMIN_CODE_MINI_EXPERIMENTAL is unset", () => {
		delete process.env.GARMIN_CODE_MINI_EXPERIMENTAL;

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns false when GARMIN_CODE_MINI_EXPERIMENTAL is empty", () => {
		process.env.GARMIN_CODE_MINI_EXPERIMENTAL = "";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns true when GARMIN_CODE_MINI_EXPERIMENTAL is set to 1", () => {
		process.env.GARMIN_CODE_MINI_EXPERIMENTAL = "1";

		expect(areExperimentalFeaturesEnabled()).toBe(true);
	});

	it("returns false when GARMIN_CODE_MINI_EXPERIMENTAL is set to 0", () => {
		process.env.GARMIN_CODE_MINI_EXPERIMENTAL = "0";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns false when GARMIN_CODE_MINI_EXPERIMENTAL is set to a non-1 value", () => {
		process.env.GARMIN_CODE_MINI_EXPERIMENTAL = "true";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});
});
