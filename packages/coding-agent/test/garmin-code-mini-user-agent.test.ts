import { describe, expect, it } from "vitest";
import { getGarminCodeMiniUserAgent } from "../src/utils/garmin-code-mini-user-agent.ts";

describe("getGarminCodeMiniUserAgent", () => {
	it("formats local diagnostic application identity", () => {
		const runtime = process.versions.bun ? `bun/${process.versions.bun}` : `node/${process.version}`;
		const userAgent = getGarminCodeMiniUserAgent("1.2.3");

		expect(userAgent).toBe(`garmin-code-mini/1.2.3 (${process.platform}; ${runtime}; ${process.arch})`);
		expect(userAgent).toMatch(/^garmin-code-mini\/[^\s()]+ \([^;()]+;\s*[^;()]+;\s*[^()]+\)$/);
	});
});
