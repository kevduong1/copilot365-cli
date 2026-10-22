import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig, { workspaceSourcePaths } from "../../vitest.base.ts";

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			globals: true,
			environment: "node",
			testTimeout: 30000,
			// Tests run offline by default; opt in with allowNetwork() from test/test-network-env.ts.
			env: { GARMIN_CODE_MINI_OFFLINE: "1" },
			unstubEnvs: true,
			reporters: process.env.GITHUB_ACTIONS ? ["dot", "github-actions"] : ["dot"],
			silent: "passed-only",
			server: {
				deps: {
					external: [/@silvia-odwyer\/photon-node/],
				},
			},
		},
		resolve: {
			alias: [
				{ find: /^@garmin-code-mini\/ai$/, replacement: workspaceSourcePaths.aiIndex },
				{ find: /^@garmin-code-mini\/agent-core$/, replacement: workspaceSourcePaths.agentIndex },
				{ find: /^@garmin-code-mini\/ai$/, replacement: workspaceSourcePaths.aiIndex },
				{ find: /^@garmin-code-mini\/ai\/oauth$/, replacement: workspaceSourcePaths.aiOAuth },
				{ find: /^@garmin-code-mini\/agent-core$/, replacement: workspaceSourcePaths.agentIndex },
				{ find: /^@garmin-code-mini\/tui$/, replacement: workspaceSourcePaths.tuiIndex },
			],
		},
	}),
);
