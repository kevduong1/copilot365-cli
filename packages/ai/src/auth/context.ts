import type { AuthContext } from "./types.ts";

/** Local credentials come only from explicitly named environment variables. */
export function defaultProviderAuthContext(): AuthContext {
	return {
		async env(name: string): Promise<string | undefined> {
			const value = typeof process === "undefined" ? undefined : process.env[name];
			return typeof value === "string" && value.trim().length > 0 ? value : undefined;
		},
		// Local inference does not discover cloud credentials in files.
		async fileExists(): Promise<boolean> {
			return false;
		},
	};
}
