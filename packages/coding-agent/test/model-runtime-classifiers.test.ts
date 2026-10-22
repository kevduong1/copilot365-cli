import { createProvider, InMemoryModelsStore } from "@gcode/ai";
import { describe, expect, it, vi } from "vitest";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { ModelRuntime } from "../src/core/model-runtime.ts";

describe("ModelRuntime classifiers", () => {
	it("lists extension classifiers separately and resolves auth before dispatch", async () => {
		const runtime = await ModelRuntime.create({
			credentials: AuthStorage.inMemory(),
			modelsStore: new InMemoryModelsStore(),
			modelsPath: null,
			allowModelNetwork: false,
		});
		const classify = vi.fn(async () => ({
			api: "test-classifier",
			provider: "classifier",
			model: "local-classifier",
			answers: { approved: { type: "bool" as const, probability: 0.8 } },
			stopReason: "stop" as const,
			timestamp: 0,
		}));
		runtime.registerNativeProvider(
			createProvider({
				id: "classifier",
				auth: {
					apiKey: {
						name: "Local classifier",
						resolve: async ({ credential }) =>
							credential?.key
								? {
										auth: { apiKey: credential.key },
										source: "stored",
									}
								: undefined,
					},
				},
				models: [
					{
						type: "classifier",
						id: "local-classifier",
						name: "Local classifier",
						api: "test-classifier",
						provider: "classifier",
						baseUrl: "http://localhost:8080/v1",
						input: ["text"],
						cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
						contextWindow: 1000,
					},
				],
				classifiers: { "test-classifier": { classify } },
			}),
		);
		const model = runtime.getModelOfType("classifier", "classifier", "local-classifier")!;
		expect(runtime.getModel("classifier", "local-classifier")).toBeUndefined();
		const context = {
			state: {},
			questions: {
				approved: { type: "bool" as const, instructions: "Approved?", criteria: { true: "Yes", false: "No" } },
			},
		};
		expect((await runtime.classify(model, context)).stopReason).toBe("error");
		expect(classify).not.toHaveBeenCalled();
		await runtime.setRuntimeApiKey("classifier", "local-key");
		expect(await runtime.getAvailableOfType("classifier", "classifier")).toEqual([model]);
		expect((await runtime.classify(model, context)).answers.approved).toEqual({ type: "bool", probability: 0.8 });
		expect(classify).toHaveBeenCalledWith(
			expect.any(Object),
			context,
			expect.objectContaining({ apiKey: "local-key" }),
		);
	});
});
