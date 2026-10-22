import type { ProviderEnv } from "./types.ts";
import { getProviderEnvValue } from "./utils/provider-env.ts";

export function findEnvKeys(provider: string, env?: ProviderEnv): string[] | undefined {
	return provider === "local" && getProviderEnvValue("GARMIN_CODE_MINI_API_KEY", env)
		? ["GARMIN_CODE_MINI_API_KEY"]
		: undefined;
}
export function getEnvApiKey(provider: string, env?: ProviderEnv): string | undefined {
	return provider === "local" ? getProviderEnvValue("GARMIN_CODE_MINI_API_KEY", env) : undefined;
}
