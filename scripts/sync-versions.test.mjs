import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const syncVersionsScript = fileURLToPath(new URL("./sync-versions.js", import.meta.url));

async function writeManifest(root, relativeDirectory, manifest) {
	const directory = join(root, relativeDirectory);
	await mkdir(directory, { recursive: true });
	await writeFile(join(directory, "package.json"), `${JSON.stringify(manifest, null, "\t")}\n`);
}

async function readManifest(root, relativeDirectory) {
	return JSON.parse(await readFile(join(root, relativeDirectory, "package.json"), "utf8"));
}

function runSyncVersions(root) {
	return spawnSync(process.execPath, [syncVersionsScript, join(root, "packages")], {
		cwd: root,
		encoding: "utf8",
	});
}

// #10865: caret ranges allowed older agents to install incompatible newer workspace dependencies.
test("pins published and private dependencies without touching registry aliases, generated manifests, or published lockstep", async () => {
	const root = await mkdtemp(join(tmpdir(), "gcode-sync-versions-"));
	try {
		await writeManifest(root, "packages/ai", {
			name: "@gcode/ai",
			version: "2.0.0",
		});
		await writeManifest(root, "packages/coding-agent", {
			name: "gcode",
			version: "2.0.0",
			dependencies: {
				"@gcode/ai": "^2.0.0",
			},
			devDependencies: {
				"@gcode/ai": "~1.0.0",
			},
			optionalDependencies: {
				"@gcode/ai": "1.0.0",
			},
		});
		await writeManifest(root, "packages/evals", {
			name: "@gcode/evals",
			version: "9.9.9",
			private: true,
			dependencies: {
				"gcode": "^1.0.0",
				"@gcode/ai": "npm:@gcode/ai@1.0.0",
			},
		});
		await writeManifest(root, "packages/coding-agent/install-lock", {
			name: "generated-install-lock",
			version: "0.0.0",
			private: true,
			dependencies: {
				"gcode": "^1.0.0",
			},
		});

		const result = runSyncVersions(root);
		assert.equal(result.status, 0, result.stderr);

		const agentManifest = await readManifest(root, "packages/coding-agent");
		for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
			assert.equal(agentManifest[section]["@gcode/ai"], "2.0.0");
		}
		const evalsManifest = await readManifest(root, "packages/evals");
		assert.equal(evalsManifest.dependencies["gcode"], "2.0.0");
		assert.equal(evalsManifest.dependencies["@gcode/ai"], "npm:@gcode/ai@1.0.0");
		const generatedManifest = await readManifest(root, "packages/coding-agent/install-lock");
		assert.equal(generatedManifest.dependencies["gcode"], "^1.0.0");

		const alreadySynced = runSyncVersions(root);
		assert.equal(alreadySynced.status, 0, alreadySynced.stderr);
		assert.match(alreadySynced.stdout, /All inter-package dependencies are already in sync/);

		await writeManifest(root, "packages/ai", {
			name: "@gcode/ai",
			version: "3.0.0",
		});
		const lockstepFailure = runSyncVersions(root);
		assert.equal(lockstepFailure.status, 1, lockstepFailure.stderr);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("writes the gcode-ai version constant", async () => {
	const root = await mkdtemp(join(tmpdir(), "gcode-sync-versions-"));
	try {
		await writeManifest(root, "packages/ai", {
			name: "@gcode/ai",
			version: "2.0.0",
		});
		const versionPath = join(root, "packages/ai/src/utils/version.ts");
		await mkdir(join(root, "packages/ai/src/utils"), { recursive: true });
		await writeFile(versionPath, 'export const GCODE_AI_VERSION = "1.0.0";\n');

		const result = runSyncVersions(root);
		assert.equal(result.status, 0, result.stderr);
		assert.match(await readFile(versionPath, "utf8"), /export const GCODE_AI_VERSION = "2\.0\.0";\n$/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
