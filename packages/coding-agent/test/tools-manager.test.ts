import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureTool, getToolPath, type ToolStatus } from "../src/utils/tools-manager.ts";

vi.mock("node:fs", async (importOriginal) => ({
	...(await importOriginal<typeof Fs>()),
	existsSync: vi.fn(() => false),
}));
vi.mock("node:child_process", () => ({ spawnSync: vi.fn(() => ({ error: new Error("not found") })) }));

afterEach(() => vi.unstubAllGlobals());

describe("local tool discovery", () => {
	it("never downloads missing tools", async () => {
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		const statuses: ToolStatus[] = [];
		expect(getToolPath("fd")).toBeNull();
		await expect(ensureTool("fd", (status) => statuses.push(status))).resolves.toBeUndefined();
		await expect(ensureTool("rg")).resolves.toBeUndefined();
		expect(fetch).not.toHaveBeenCalled();
		expect(statuses).toEqual([{ type: "warning", message: "fd not found. Install it locally and add it to PATH." }]);
	});
});

import type * as Fs from "node:fs";
