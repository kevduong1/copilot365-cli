import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import { getBinDir } from "../config.ts";

const TOOLS = { fd: ["fd", "fdfind"], rg: ["rg"] } as const;

/** Find an already installed tool; Gcode never downloads executables. */
export function getToolPath(tool: "fd" | "rg"): string | null {
	const localPath = join(getBinDir(), `${tool}${platform() === "win32" ? ".exe" : ""}`);
	if (existsSync(localPath)) return localPath;
	for (const command of TOOLS[tool]) {
		const result = spawnSync(command, ["--version"], { stdio: "pipe" });
		if (!result.error && result.status === 0) return command;
	}
	return null;
}

export interface ToolStatus {
	type: "info" | "warning";
	message: string;
}

export async function ensureTool(
	tool: "fd" | "rg",
	onStatus?: (status: ToolStatus) => void,
): Promise<string | undefined> {
	const path = getToolPath(tool);
	if (path) return path;
	onStatus?.({ type: "warning", message: `${tool} not found. Install it locally and add it to PATH.` });
	return undefined;
}
