import type { ProviderEnv } from "./types.ts";
import { getProviderEnvValue } from "./utils/provider-env.ts";

export function findEnvKeys(provider: string, env?: ProviderEnv): string[] | undefined {
	return provider === "local" && getProviderEnvValue("GCODE_API_KEY", env) ? ["GCODE_API_KEY"] : undefined;
}
export function getEnvApiKey(provider: string, env?: ProviderEnv): string | undefined {
	return provider === "local" ? getProviderEnvValue("GCODE_API_KEY", env) : undefined;
}
