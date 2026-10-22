import type { ClientIdentity } from "@gcode/ai";
import type { SettingsManager } from "./settings-manager.ts";

/** A product name without device, runtime, or attribution metadata. */
export function getClientIdentity(_settingsManager: SettingsManager): ClientIdentity {
	return {
		userAgent: { custom: "gcode" },
		attribution: null,
	};
}
