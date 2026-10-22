import type { ClientIdentity } from "@garmin-code-mini/ai";
import type { SettingsManager } from "./settings-manager.ts";

/** A product name without device, runtime, or attribution metadata. */
export function getClientIdentity(_settingsManager: SettingsManager): ClientIdentity {
	return {
		userAgent: { custom: "garmin-code-mini" },
		attribution: null,
	};
}
