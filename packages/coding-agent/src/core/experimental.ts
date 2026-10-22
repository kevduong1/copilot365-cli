export function areExperimentalFeaturesEnabled(): boolean {
	return process.env.GARMIN_CODE_MINI_EXPERIMENTAL === "1";
}
