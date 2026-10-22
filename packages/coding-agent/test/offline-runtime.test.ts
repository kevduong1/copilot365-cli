import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { resolveCliModel } from "../src/core/model-resolver.ts";
import { ModelRuntime } from "../src/core/model-runtime.ts";
import { DefaultPackageManager } from "../src/core/package-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";

const directories: string[] = [];

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("offline runtime", () => {
	it("has a usable local default without credentials or background requests", async () => {
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		vi.stubEnv("GARMIN_CODE_MINI_MODEL", "test-local-model");
		const runtime = await ModelRuntime.create({ credentials: AuthStorage.inMemory(), modelsPath: null });
		expect(runtime.getProviders().map((provider) => provider.id)).toEqual(["local"]);
		expect(runtime.getAvailableSnapshot().map((model) => model.id)).toEqual(["test-local-model"]);
		await runtime.refresh({ allowNetwork: true });
		expect(fetch).not.toHaveBeenCalled();
		const selected = resolveCliModel({ cliModel: "different-local-model", modelRuntime: runtime });
		expect(selected.error).toBeUndefined();
		expect(selected.model).toMatchObject({ provider: "local", id: "different-local-model" });
	});

	it("loads local packages and rejects remote installation and fetching", async () => {
		const directory = mkdtempSync(join(tmpdir(), "garmin-mini-offline-"));
		directories.push(directory);
		const packageDirectory = join(directory, "extension");
		mkdirSync(packageDirectory);
		writeFileSync(join(packageDirectory, "index.ts"), "export default () => {};\n");
		const settingsManager = SettingsManager.create(directory, join(directory, "agent"));
		const manager = new DefaultPackageManager({
			cwd: directory,
			agentDir: join(directory, "agent"),
			settingsManager,
		});
		await manager.installAndPersist(packageDirectory);
		const resolved = await manager.resolve();
		expect(resolved.extensions.some((entry) => entry.path === packageDirectory)).toBe(true);
		await expect(manager.install("npm:remote-package")).rejects.toThrow("Remote package installation");
		await expect(manager.resolveExtensionSources(["https://github.com/example/package"])).rejects.toThrow(
			"Remote package sources",
		);
		await expect(manager.update()).rejects.toThrow("Online package updates");
	});
});
