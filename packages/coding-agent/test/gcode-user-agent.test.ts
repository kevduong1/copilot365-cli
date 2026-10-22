import { describe, expect, it } from "vitest";
import { getGcodeUserAgent } from "../src/utils/gcode-user-agent.ts";

describe("getGcodeUserAgent", () => {
	it("formats local diagnostic application identity", () => {
		const runtime = process.versions.bun ? `bun/${process.versions.bun}` : `node/${process.version}`;
		const userAgent = getGcodeUserAgent("1.2.3");

		expect(userAgent).toBe(`gcode/1.2.3 (${process.platform}; ${runtime}; ${process.arch})`);
		expect(userAgent).toMatch(/^gcode\/[^\s()]+ \([^;()]+;\s*[^;()]+;\s*[^()]+\)$/);
	});
});
