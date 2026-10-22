import { describe, expect, test } from "vitest";
import { formatCrashExtensionHint } from "../src/modes/interactive/interactive-mode.ts";

describe("InteractiveMode crash extension hints", () => {
	test("identifies extensions with frames in a crash stack", () => {
		expect(formatCrashExtensionHint(["npm:garmin-code-mini-observational-memory"])).toBe(
			"A stack frame came from loaded extension `npm:garmin-code-mini-observational-memory`, which may be involved. Try disabling it with `garmin-code-mini config`, or run `garmin-code-mini -ne` to confirm.",
		);
		expect(formatCrashExtensionHint(undefined)).toBeUndefined();
	});
});
