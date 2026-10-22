import type { Provider } from "@gcode/ai";
import { localProvider } from "@gcode/ai/providers/local";
import { describe, expect, it } from "vitest";
import { AuthStorage } from "../../../src/core/auth-storage.ts";
import { ModelRuntime } from "../../../src/core/model-runtime.ts";

describe("offline catalog refresh", () => {
	it("never starts a network refresh even when explicitly requested", async () => {
		// #7027: catalog refreshes must not hold local credential operations behind network requests.
		let networkRefreshes = 0;
		const base = localProvider();
		const provider: Provider = {
			...base,
			id: "offline-refresh",
			getModels: () => base.getModels().map((model) => ({ ...model, provider: "offline-refresh" })),
			refreshModels: async ({ allowNetwork }) => {
				if (allowNetwork) networkRefreshes++;
			},
		};
		const runtime = await ModelRuntime.create({ credentials: AuthStorage.inMemory(), modelsPath: null });
		runtime.registerNativeProvider(provider);
		await expect(runtime.refresh({ allowNetwork: true, providers: [provider.id] })).resolves.toMatchObject({
			aborted: false,
		});
		expect(networkRefreshes).toBe(0);
		await expect(runtime.setRuntimeApiKey(provider.id, "local-key")).resolves.toBeUndefined();
	});
});
