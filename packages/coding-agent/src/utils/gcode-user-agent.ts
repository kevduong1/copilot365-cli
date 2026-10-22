import { formatUserAgent } from "@gcode/ai";

/** Application identity included in locally collected diagnostic metadata. */
export function getGcodeUserAgent(version: string): string {
	return formatUserAgent({ userAgent: "detailed", version });
}
