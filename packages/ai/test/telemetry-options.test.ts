import { NOOP_TELEMETRY_CONTEXT, type TelemetrySpan } from "@garmin-code-mini/telemetry";
import { describe, expect, it } from "vitest";
import { buildBaseOptions } from "../src/api/simple-options.ts";
import { createModels, createProvider } from "../src/models.ts";
import type { DeferredHandle, Model, ProviderRequestOptions } from "../src/types.ts";
import { AssistantMessageEventStream } from "../src/utils/event-stream.ts";
import { normalizeContext } from "../src/utils/transcript.ts";

const telemetry: TelemetrySpan = NOOP_TELEMETRY_CONTEXT;
const context = normalizeContext({ messages: [] });

const model: Model<"telemetry-test"> = {
	id: "model",
	name: "Model",
	api: "telemetry-test",
	provider: "telemetry-provider",
	baseUrl: "https://example.test",
	reasoning: false,
	input: ["text"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 1000,
	maxTokens: 100,
};

function completedStream(requestModel: Model<string>): AssistantMessageEventStream {
	const stream = new AssistantMessageEventStream();
	queueMicrotask(() => {
		stream.push({
			type: "done",
			reason: "stop",
			message: {
				role: "assistant",
				content: [],
				api: requestModel.api,
				provider: requestModel.provider,
				model: requestModel.id,
				usage: {
					input: 0,
					output: 0,
					cacheRead: 0,
					cacheWrite: 0,
					totalTokens: 0,
					cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
				},
				stopReason: "stop",
				timestamp: 0,
			},
		});
	});
	return stream;
}

describe("ProviderRequestOptions.telemetry", () => {
	it("is inherited by every request option surface and simple-stream conversion", () => {
		const options = { telemetry } satisfies ProviderRequestOptions;
		expect(options.telemetry).toBe(telemetry);
		expect(buildBaseOptions(model, context, { telemetry }).telemetry).toBe(telemetry);
		const compileTimeFailures = () => {
			const removed: ProviderRequestOptions = {
				// @ts-expect-error telemetryContext was renamed, with no compatibility alias
				telemetryContext: telemetry,
			};
			return removed;
		};
		expect(compileTimeFailures).toBeTypeOf("function");
	});

	it("survives provider and Models stream/deferred dispatch", async () => {
		const observed: Array<TelemetrySpan | undefined> = [];
		const handle: DeferredHandle = {
			provider: model.provider,
			modelId: model.id,
			api: model.api,
			id: "response",
		};
		const provider = createProvider({
			id: model.provider,
			auth: { apiKey: { name: "Test", resolve: async () => ({ auth: {} }) } },
			models: [model],
			api: {
				stream: (requestModel, _context, options) => {
					observed.push(options?.telemetry);
					return completedStream(requestModel);
				},
				streamSimple: (requestModel, _context, options) => {
					observed.push(options?.telemetry);
					return completedStream(requestModel);
				},
				fetchDeferred: (requestModel, _handle, options) => {
					observed.push(options?.telemetry);
					return completedStream(requestModel);
				},
				cancelDeferred: async (_requestModel, _handle, options) => {
					observed.push(options?.telemetry);
				},
			},
		});

		await provider.stream(model, context, { telemetry }).result();
		await provider.streamSimple(model, context, { telemetry }).result();
		await provider.fetchDeferred!(model, handle, { telemetry }).result();
		await provider.cancelDeferred!(model, handle, { telemetry });

		const models = createModels();
		models.setProvider(provider);
		await models.stream(model, context, { telemetry }).result();
		await models.streamSimple(model, context, { telemetry }).result();
		await models.fetchDeferred(model, handle, { telemetry });
		await models.cancelDeferred(model, handle, { telemetry });

		expect(observed).toHaveLength(8);
		expect(observed.every((value) => value === telemetry)).toBe(true);
	});
});
