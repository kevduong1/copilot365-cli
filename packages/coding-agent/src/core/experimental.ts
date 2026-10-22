export function areExperimentalFeaturesEnabled(): boolean {
	return process.env.GCODE_EXPERIMENTAL === "1";
}
