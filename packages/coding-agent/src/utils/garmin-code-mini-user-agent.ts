import { formatUserAgent } from "@garmin-code-mini/ai";

/** Application identity included in locally collected diagnostic metadata. */
export function getGarminCodeMiniUserAgent(version: string): string {
	return formatUserAgent({ userAgent: "detailed", version });
}
