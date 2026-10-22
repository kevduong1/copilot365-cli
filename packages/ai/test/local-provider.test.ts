import { Type } from "typebox";
import { describe, expect, it, vi } from "vitest";
import { convertMessages, stream, streamSimple } from "../src/api/openai-completions.ts";
import { createModels } from "../src/models.ts";
import { builtinProviders } from "../src/providers/all.ts";
import { localModel, localProvider, validateLocalBaseUrl } from "../src/providers/local.ts";
import type { AssistantMessageEvent, FetchFunction } from "../src/types.ts";
import { normalizeContext } from "../src/utils/transcript.ts";

function sse(chunks: unknown[], finish = true): Response {
	const text =
		chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\r\n\r\n`).join("") + (finish ? "data: [DONE]\r\n\r\n" : "");
	const bytes = new TextEncoder().encode(text);
	return new Response(
		new ReadableStream<Uint8Array>({
			start(controller) {
				// One byte at a time exercises split UTF-8 characters, JSON, and SSE delimiters.
				for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
				controller.close();
			},
		}),
	);
}

const context = normalizeContext({ messages: [{ role: "user", content: "hello", timestamp: 0 }] });

describe("local inference", () => {
	it("registers only the configured local provider without fetching catalogs or requiring a key", async () => {
		const network = vi.spyOn(globalThis, "fetch");
		try {
			const models = createModels();
			models.setProvider(localProvider());
			await models.refresh({ allowNetwork: true });
			expect(builtinProviders().map((provider) => provider.id)).toEqual(["local"]);
			expect(await models.getAvailable()).toHaveLength(1);
			expect(network).not.toHaveBeenCalled();
		} finally {
			network.mockRestore();
		}
	});

	it("streams split UTF-8 text and usage using only the configured endpoint", async () => {
		let request: RequestInit | undefined;
		let destination: unknown;
		const requestFetch: FetchFunction = async (input, init) => {
			destination = input;
			request = init;
			return sse([
				{ choices: [{ delta: { content: "café" } }] },
				{ choices: [{ delta: {}, finish_reason: "stop" }] },
				{ choices: [], usage: { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 } },
			]);
		};
		const output = await stream(localModel({ baseUrl: "http://inference.internal:9000/v1/" }), context, {
			fetch: requestFetch,
		}).result();
		expect(destination).toBe("http://inference.internal:9000/v1/chat/completions");
		expect(request?.redirect).toBe("error");
		expect(new Headers(request?.headers).get("authorization")).toBeNull();
		expect(new Headers(request?.headers).get("user-agent")).toBeNull();
		expect(output.content).toEqual([{ type: "text", text: "café" }]);
		expect(output.usage.totalTokens).toBe(15);
		expect(output.stopReason).toBe("stop");
	});

	it("assembles fragmented tool arguments and replays tool results", async () => {
		const requestFetch: FetchFunction = async () =>
			sse([
				{
					choices: [
						{
							delta: {
								tool_calls: [{ index: 0, id: "call_1", function: { name: "read", arguments: '{"path":' } }],
							},
						},
					],
				},
				{
					choices: [
						{
							delta: { tool_calls: [{ index: 0, function: { arguments: '"file.txt"}' } }] },
							finish_reason: "tool_calls",
						},
					],
				},
			]);
		const events: AssistantMessageEvent[] = [];
		const response = stream(
			localModel(),
			normalizeContext({
				systemPrompt: "Use tools",
				tools: [{ name: "read", description: "Read", parameters: Type.Object({ path: Type.String() }) }],
				messages: context.messages,
			}),
			{ fetch: requestFetch },
		);
		for await (const event of response) events.push(event);
		const output = await response.result();
		expect(output.stopReason).toBe("toolUse");
		expect(output.content).toEqual([
			{ type: "toolCall", id: "call_1", name: "read", arguments: { path: "file.txt" } },
		]);
		expect(events.map((event) => event.type)).toEqual([
			"start",
			"toolcall_start",
			"toolcall_delta",
			"toolcall_delta",
			"toolcall_end",
			"done",
		]);
	});

	it("reports a truncated stream as an error", async () => {
		const output = await stream(localModel(), context, {
			fetch: async () => sse([{ choices: [{ delta: { content: "partial" } }] }], false),
		}).result();
		expect(output.stopReason).toBe("error");
		expect(output.errorMessage).toContain("ended before");
	});

	it("requires a finish reason even when the server sends DONE", async () => {
		const output = await stream(localModel(), context, {
			fetch: async () => sse([{ choices: [{ delta: { content: "partial" } }] }]),
		}).result();
		expect(output.stopReason).toBe("error");
		expect(output.errorMessage).toContain("finish reason");
	});

	it("supports servers without finish reasons or usage options when explicitly configured", async () => {
		let body: unknown;
		const model = { ...localModel(), compat: { supportsFinishReason: false, supportsUsageInStreaming: false } };
		const output = await stream(model, context, {
			fetch: async (_input, init) => {
				body = JSON.parse(String(init?.body));
				return sse([{ choices: [{ delta: { content: "complete" } }] }], false);
			},
		}).result();
		expect(body).not.toHaveProperty("stream_options");
		expect(output.stopReason).toBe("stop");
	});

	it("assembles interleaved parallel calls and infers tool use from their presence", async () => {
		const output = await stream(localModel(), context, {
			fetch: async () =>
				sse([
					{
						choices: [
							{
								delta: {
									tool_calls: [
										{ index: 1, id: "second", function: { name: "write", arguments: '{"value":' } },
										{ index: 0, id: "first", function: { name: "read", arguments: '{"path":' } },
									],
								},
							},
						],
					},
					{
						choices: [
							{
								delta: {
									tool_calls: [
										{ index: 0, function: { arguments: '"a"}' } },
										{ index: 1, function: { arguments: "2}" } },
									],
								},
								finish_reason: "stop",
							},
						],
					},
				]),
		}).result();
		expect(output.stopReason).toBe("toolUse");
		expect(output.content).toEqual([
			{ type: "toolCall", id: "second", name: "write", arguments: { value: 2 } },
			{ type: "toolCall", id: "first", name: "read", arguments: { path: "a" } },
		]);
	});

	it("does not replay partial tool calls from a cancelled response", () => {
		const model = localModel();
		const messages = convertMessages(
			normalizeContext({
				messages: [
					{
						role: "assistant",
						api: model.api,
						provider: model.provider,
						model: model.id,
						content: [{ type: "toolCall", id: "partial", name: "read", arguments: {} }],
						usage: {
							input: 0,
							output: 0,
							cacheRead: 0,
							cacheWrite: 0,
							totalTokens: 0,
							cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
						},
						stopReason: "aborted",
						timestamp: 0,
					},
				],
			}),
		);
		expect(messages[0]).not.toHaveProperty("tool_calls");
	});

	it("maps reasoning and sampling options and sends supported strict tool schemas", async () => {
		let body: unknown;
		const model = {
			...localModel(),
			reasoning: true,
			thinkingLevelMap: { medium: "balanced" },
			samplingParams: { top_k: 40 },
			samplingParamsByThinkingLevel: { medium: { top_k: 20 } },
			compat: { supportsStrictMode: true, maxTokensField: "max_completion_tokens" as const },
		};
		const output = await streamSimple(
			model,
			normalizeContext({
				messages: context.messages,
				tools: [
					{
						name: "read",
						description: "Read",
						parameters: Type.Object({ path: Type.String() }),
						constrainedSampling: { type: "json_schema", strict: "require" },
					},
				],
			}),
			{
				reasoning: "medium",
				maxTokens: 123,
				toolChoice: "auto",
				samplingParams: { min_p: 0.1 },
				fetch: async (_input, init) => {
					body = JSON.parse(String(init?.body));
					return sse([{ choices: [{ delta: {}, finish_reason: "stop" }] }]);
				},
			},
		).result();
		expect(output.stopReason).toBe("stop");
		expect(body).toMatchObject({
			reasoning_effort: "balanced",
			max_completion_tokens: 123,
			top_k: 20,
			min_p: 0.1,
			tool_choice: "auto",
			tools: [{ function: { strict: true, parameters: { additionalProperties: false, required: ["path"] } } }],
		});
	});

	it("reports cancellation that arrives while buffered chunks are being observed", async () => {
		const controller = new AbortController();
		const output = await stream(localModel(), context, {
			signal: controller.signal,
			onProviderStreamEvent: () => controller.abort(),
			fetch: async () => sse([{ choices: [{ delta: { content: "buffered" }, finish_reason: "stop" }] }]),
		}).result();
		expect(output.stopReason).toBe("aborted");
	});

	it("returns unsupported response modes as errors before dispatch", async () => {
		const requestFetch = vi.fn<FetchFunction>();
		const deferred = await streamSimple(localModel(), context, { deferred: true, fetch: requestFetch }).result();
		const websocket = await stream(localModel(), context, { transport: "websocket", fetch: requestFetch }).result();
		expect(deferred.errorMessage).toContain("deferred");
		expect(websocket.errorMessage).toContain("SSE");
		expect(requestFetch).not.toHaveBeenCalled();
	});

	it("returns malformed tool arguments for validation instead of accepting a partial prefix", async () => {
		const output = await stream(localModel(), context, {
			fetch: async () =>
				sse([
					{
						choices: [
							{
								delta: { tool_calls: [{ index: 0, function: { name: "read", arguments: '{"path":' } }] },
								finish_reason: "tool_calls",
							},
						],
					},
				]),
		}).result();
		const call = output.content[0];
		expect(call.type).toBe("toolCall");
		if (call.type === "toolCall") expect(call.argumentsError).toContain("Received arguments");
	});

	it("does not dispatch a request after cancellation", async () => {
		const controller = new AbortController();
		controller.abort();
		const requestFetch = vi.fn<FetchFunction>();
		const output = await stream(localModel(), context, { fetch: requestFetch, signal: controller.signal }).result();
		expect(output.stopReason).toBe("aborted");
		expect(requestFetch).not.toHaveBeenCalled();
	});

	it("rejects URL credentials and non-HTTP protocols while allowing LAN hosts", () => {
		expect(validateLocalBaseUrl("http://192.168.1.15:8080/v1/")).toBe("http://192.168.1.15:8080/v1");
		for (const url of ["file:///tmp/model", "http://user:pass@localhost/v1", "http://localhost/v1?relay=cloud"]) {
			expect(() => validateLocalBaseUrl(url)).toThrow();
		}
	});
});
