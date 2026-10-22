import { calculateCost, clampThinkingLevel } from "../models.ts";
import type {
	AssistantMessage,
	JsonObject,
	SimpleStreamOptions,
	StreamFunction,
	StreamOptions,
	ToolCall,
	TranscriptContext,
} from "../types.ts";
import { AssistantMessageEventStream } from "../utils/event-stream.ts";
import { headersToRecord, providerHeadersToRecord } from "../utils/headers.ts";
import { parseStreamingJson, parseToolCallArguments } from "../utils/json-parse.ts";
import { retryProviderRequest } from "../utils/provider-retry.ts";
import { getCurrentSystemPrompt, getCurrentTools } from "../utils/transcript.ts";
import { getJsonSchemaToolParameters, resolveJsonSchemaStrictSampling } from "./constrained-sampling.ts";
import { lazyStream } from "./lazy.ts";
import { buildBaseOptions } from "./simple-options.ts";

export interface OpenAICompletionsOptions extends StreamOptions {
	toolChoice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
	reasoningEffort?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Translate the agent transcript to the local server's chat-completions protocol. */
export function convertMessages(context: TranscriptContext): Record<string, unknown>[] {
	const messages: Record<string, unknown>[] = [];
	const systemPrompt = getCurrentSystemPrompt(context.messages);
	if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
	for (const message of context.messages) {
		if (message.role === "system") continue;
		if (message.role === "user") {
			messages.push({
				role: "user",
				content:
					typeof message.content === "string"
						? message.content
						: message.content.map((part) =>
								part.type === "text"
									? { type: "text", text: part.text }
									: {
											type: "image_url",
											image_url: { url: `data:${part.mimeType};base64,${part.data}` },
										},
							),
			});
		} else if (message.role === "assistant") {
			const calls = message.content.filter(
				(part): part is ToolCall =>
					part.type === "toolCall" && message.stopReason !== "error" && message.stopReason !== "aborted",
			);
			const text = message.content
				.filter((part) => part.type === "text")
				.map((part) => part.text)
				.join("");
			messages.push({
				role: "assistant",
				content: text || null,
				...(calls.length
					? {
							tool_calls: calls.map((call) => ({
								id: call.id,
								type: "function",
								function: {
									name: call.name,
									arguments: JSON.stringify(call.arguments),
								},
							})),
						}
					: {}),
			});
		} else {
			messages.push({
				role: "tool",
				tool_call_id: message.toolCallId,
				content: message.content
					.filter((part) => part.type === "text")
					.map((part) => part.text)
					.join("\n"),
			});
			const images = message.content.filter((part) => part.type === "image");
			if (images.length)
				messages.push({
					role: "user",
					content: images.map((part) => ({
						type: "image_url",
						image_url: { url: `data:${part.mimeType};base64,${part.data}` },
					})),
				});
		}
	}
	return messages;
}

/** Parse SSE with incremental UTF-8 decoding, CRLF support, and a final unterminated event. */
async function* serverEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let data: string[] = [];
	try {
		for (;;) {
			const { value, done } = await reader.read();
			buffer += decoder.decode(value, { stream: !done });
			let newline = buffer.indexOf("\n");
			while (newline >= 0) {
				const line = buffer.slice(0, newline).replace(/\r$/u, "");
				buffer = buffer.slice(newline + 1);
				if (line === "") {
					if (data.length) yield data.join("\n");
					data = [];
				} else if (line.startsWith("data:")) {
					data.push(line.slice(5).replace(/^ /u, ""));
				}
				newline = buffer.indexOf("\n");
			}
			if (done) break;
		}
		if (buffer.startsWith("data:")) data.push(buffer.slice(5).replace(/^ /u, "").replace(/\r$/u, ""));
		if (data.length) yield data.join("\n");
	} finally {
		await reader.cancel().catch(() => {});
		reader.releaseLock();
	}
}

export const stream: StreamFunction<"openai-completions", OpenAICompletionsOptions> = (model, context, options) => {
	const events = new AssistantMessageEventStream();
	const output: AssistantMessage = {
		role: "assistant",
		content: [],
		api: model.api,
		provider: model.provider,
		model: model.id,
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		stopReason: "pending",
		timestamp: Date.now(),
	};
	void (async () => {
		try {
			options?.signal?.throwIfAborted();
			if (options?.transport && options.transport !== "sse" && options.transport !== "auto") {
				throw new Error(`Local inference supports SSE transport, received ${options.transport}`);
			}
			if (model.api !== "openai-completions") throw new Error(`Unsupported local API: ${model.api}`);
			const baseUrl = new URL(model.baseUrl);
			if (
				!["http:", "https:"].includes(baseUrl.protocol) ||
				baseUrl.username ||
				baseUrl.password ||
				baseUrl.search ||
				baseUrl.hash
			) {
				throw new Error("Invalid local inference endpoint");
			}
			const tools = getCurrentTools(context.messages);
			let payload: unknown = {
				model: model.id,
				messages: convertMessages(context),
				stream: true,
				...(model.compat?.supportsUsageInStreaming === false ? {} : { stream_options: { include_usage: true } }),
				[model.compat?.maxTokensField ?? "max_tokens"]: options?.maxTokens ?? model.maxTokens,
				...(options?.temperature === undefined ? {} : { temperature: options.temperature }),
				...(tools.length
					? {
							tools: tools.map((tool) => {
								const strict = resolveJsonSchemaStrictSampling(tool, model.compat?.supportsStrictMode ?? false);
								return {
									type: "function",
									function: {
										name: tool.name,
										description: tool.description,
										parameters: getJsonSchemaToolParameters(tool, strict),
										...(strict === undefined ? {} : { strict }),
									},
								};
							}),
						}
					: {}),
				...(options?.toolChoice === undefined ? {} : { tool_choice: options.toolChoice }),
				...(model.reasoning && model.compat?.supportsReasoningEffort !== false && options?.reasoningEffort
					? { reasoning_effort: options.reasoningEffort }
					: {}),
				...model.samplingParams,
				...options?.samplingParams,
			};
			const transformed = await options?.onPayload?.(payload, model);
			if (transformed !== undefined) payload = transformed;
			const headers = providerHeadersToRecord(
				{ "content-type": "application/json", accept: "text/event-stream" },
				options?.apiKey ? { authorization: `Bearer ${options.apiKey}` } : undefined,
				model.headers,
				options?.headers,
			);
			const timeout = options?.timeoutMs === undefined ? undefined : AbortSignal.timeout(options.timeoutMs);
			const signal =
				options?.signal && timeout ? AbortSignal.any([options.signal, timeout]) : (options?.signal ?? timeout);
			const response = await retryProviderRequest(
				async () => {
					const response = await (options?.fetch ?? globalThis.fetch)(
						`${model.baseUrl.replace(/\/+$/u, "")}/chat/completions`,
						{
							method: "POST",
							headers,
							body: JSON.stringify(payload),
							signal,
							redirect: "error",
						},
					);
					if (!response.ok) {
						const error = Object.assign(
							new Error(`Local inference returned HTTP ${response.status}: ${await response.text()}`),
							{
								status: response.status,
								headers: response.headers,
							},
						);
						throw error;
					}
					return response;
				},
				{ maxRetries: options?.maxRetries, maxRetryDelayMs: options?.maxRetryDelayMs, signal },
			);
			await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
			if (!response.body) throw new Error("Local inference returned an empty response body");
			events.push({ type: "start", partial: output });
			let finishReason = false;
			let textIndex: number | undefined;
			let thinkingIndex: number | undefined;
			const calls = new Map<number, { call: ToolCall; contentIndex: number; arguments: string }>();
			for await (const data of serverEvents(response.body)) {
				if (data.trim() === "[DONE]") {
					break;
				}
				const chunk: unknown = JSON.parse(data);
				await options?.onProviderStreamEvent?.(chunk, model);
				if (!isRecord(chunk)) throw new Error("Invalid local inference stream event");
				if (chunk.error) throw new Error(`Local inference error: ${JSON.stringify(chunk.error)}`);
				if (typeof chunk.id === "string") output.responseId = chunk.id;
				if (typeof chunk.model === "string" && chunk.model !== model.id) output.responseModel = chunk.model;
				if (isRecord(chunk.usage)) {
					const usage = chunk.usage;
					const cached = isRecord(usage.prompt_tokens_details) ? usage.prompt_tokens_details.cached_tokens : 0;
					output.usage.cacheRead = typeof cached === "number" ? cached : 0;
					output.usage.input =
						typeof usage.prompt_tokens === "number"
							? Math.max(0, usage.prompt_tokens - output.usage.cacheRead)
							: 0;
					output.usage.output = typeof usage.completion_tokens === "number" ? usage.completion_tokens : 0;
					output.usage.totalTokens =
						typeof usage.total_tokens === "number"
							? usage.total_tokens
							: output.usage.input + output.usage.cacheRead + output.usage.output;
				}
				const choices = Array.isArray(chunk.choices) ? chunk.choices : [];
				for (const choice of choices) {
					if (!isRecord(choice) || (choice.index !== undefined && choice.index !== 0)) continue;
					if (typeof choice.finish_reason === "string") {
						finishReason = true;
						output.rawStopReason = choice.finish_reason;
						if (!["stop", "length", "tool_calls", "function_call"].includes(choice.finish_reason)) {
							throw new Error(`Local inference stopped with ${choice.finish_reason}`);
						}
						output.stopReason =
							choice.finish_reason === "length"
								? "length"
								: choice.finish_reason === "tool_calls"
									? "toolUse"
									: "stop";
					}
					if (!isRecord(choice.delta)) continue;
					const delta = choice.delta;
					const thinking = delta.reasoning_content ?? delta.reasoning ?? delta.reasoning_text;
					if (typeof thinking === "string" && thinking) {
						if (thinkingIndex === undefined) {
							thinkingIndex = output.content.length;
							output.content.push({ type: "thinking", thinking: "" });
							events.push({ type: "thinking_start", contentIndex: thinkingIndex, partial: output });
						}
						const block = output.content[thinkingIndex];
						if (block.type === "thinking") block.thinking += thinking;
						events.push({
							type: "thinking_delta",
							contentIndex: thinkingIndex,
							delta: thinking,
							partial: output,
						});
					}
					if (typeof delta.content === "string" && delta.content) {
						if (textIndex === undefined) {
							textIndex = output.content.length;
							output.content.push({ type: "text", text: "" });
							events.push({ type: "text_start", contentIndex: textIndex, partial: output });
						}
						const block = output.content[textIndex];
						if (block.type === "text") block.text += delta.content;
						events.push({ type: "text_delta", contentIndex: textIndex, delta: delta.content, partial: output });
					}
					for (const item of Array.isArray(delta.tool_calls) ? delta.tool_calls : []) {
						if (!isRecord(item)) continue;
						const index = typeof item.index === "number" ? item.index : 0;
						let entry = calls.get(index);
						if (!entry) {
							const call: ToolCall = { type: "toolCall", id: "", name: "", arguments: {} };
							entry = { call, contentIndex: output.content.length, arguments: "" };
							calls.set(index, entry);
							output.content.push(call);
							events.push({ type: "toolcall_start", contentIndex: entry.contentIndex, partial: output });
						}
						if (typeof item.id === "string") entry.call.id = item.id;
						if (isRecord(item.function)) {
							if (typeof item.function.name === "string") entry.call.name += item.function.name;
							if (typeof item.function.arguments === "string") {
								entry.arguments += item.function.arguments;
								entry.call.arguments = parseStreamingJson<JsonObject>(entry.arguments);
								events.push({
									type: "toolcall_delta",
									contentIndex: entry.contentIndex,
									delta: item.function.arguments,
									partial: output,
								});
							}
						}
					}
				}
			}
			if (!finishReason && model.compat?.supportsFinishReason !== false) {
				throw new Error("Local inference stream ended before a finish reason");
			}
			signal?.throwIfAborted();
			for (const [contentIndex, block] of output.content.entries()) {
				if (block.type === "text")
					events.push({ type: "text_end", contentIndex, content: block.text, partial: output });
				if (block.type === "thinking")
					events.push({ type: "thinking_end", contentIndex, content: block.thinking, partial: output });
			}
			for (const entry of calls.values()) {
				if (!entry.call.name) throw new Error("Local inference returned a tool call without a name");
				entry.call.id ||= `call_${entry.contentIndex}`;
				Object.assign(entry.call, parseToolCallArguments(entry.arguments));
				events.push({
					type: "toolcall_end",
					contentIndex: entry.contentIndex,
					toolCall: entry.call,
					partial: output,
				});
			}
			if (output.stopReason === "pending" || (output.stopReason === "stop" && calls.size)) {
				output.stopReason = calls.size ? "toolUse" : "stop";
			}
			calculateCost(model, output.usage);
			if (output.stopReason !== "stop" && output.stopReason !== "length" && output.stopReason !== "toolUse")
				throw new Error("Invalid local inference stop reason");
			events.push({ type: "done", reason: output.stopReason, message: output });
		} catch (error) {
			output.stopReason = options?.signal?.aborted ? "aborted" : "error";
			output.errorMessage = error instanceof Error ? error.message : String(error);
			events.push({ type: "error", reason: output.stopReason, error: output });
		} finally {
			events.end(output);
		}
	})();
	return events;
};

export const streamSimple: StreamFunction<"openai-completions", SimpleStreamOptions> = (model, context, options) => {
	if (options?.deferred) {
		return lazyStream(model, async () => {
			throw new Error("Local inference does not support deferred responses");
		});
	}
	const level = clampThinkingLevel(model, options?.reasoning ?? "off");
	const effort = model.thinkingLevelMap?.[level] ?? (level === "off" ? undefined : level);
	return stream(model, context, {
		...buildBaseOptions(model, context, options),
		toolChoice: options?.toolChoice,
		reasoningEffort: effort,
	});
};
