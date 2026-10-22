/**
 * Bash Spawn Hook Example
 *
 * Adjusts command, cwd, and env before execution.
 *
 * Usage:
 *   garmin-code-mini -e ./bash-spawn-hook.ts
 */

import type { ExtensionAPI } from "garmin-code-mini";
import { createBashTool } from "garmin-code-mini";

export default function (garminCodeMini: ExtensionAPI) {
	const cwd = process.cwd();

	const bashTool = createBashTool(cwd, {
		spawnHook: ({ command, cwd, env }) => ({
			command: `source ~/.profile\n${command}`,
			cwd,
			env: { ...env, GARMIN_CODE_MINI_SPAWN_HOOK: "1" },
		}),
	});

	garminCodeMini.registerTool({
		...bashTool,
		execute: async (id, params, signal, onUpdate, _ctx) => {
			return bashTool.execute(id, params, signal, onUpdate);
		},
	});
}
