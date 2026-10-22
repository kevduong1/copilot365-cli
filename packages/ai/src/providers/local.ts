import * as completions from "../api/openai-completions.ts";
import { createProvider, type Provider } from "../models.ts";
import type { Model, ProviderHeaders } from "../types.ts";
import { getProviderEnvValue } from "../utils/provider-env.ts";

export const DEFAULT_LOCAL_BASE_URL = "http://127.0.0.1:8080/v1";
export const DEFAULT_LOCAL_MODEL = "local-model";

export interface LocalProviderOptions {
	id?: string;
	name?: string;
	baseUrl?: string;
	modelId?: string;
	models?: readonly Model<"openai-completions">[];
	headers?: ProviderHeaders;
	contextWindow?: number;
	maxTokens?: number;
}

export function validateLocalBaseUrl(baseUrl: string): string {
	const url = new URL(baseUrl);
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error("Local inference endpoint must use HTTP or HTTPS");
	}
	if (url.username || url.password || url.search || url.hash) {
		throw new Error("Local inference endpoint must not contain credentials, a query, or a fragment");
	}
	return baseUrl.replace(/\/+$/u, "");
}

/** A static declaration: startup never requests a model catalog. */
export function localModel(options: LocalProviderOptions = {}): Model<"openai-completions"> {
	const id = options.modelId ?? getProviderEnvValue("GCODE_MODEL") ?? DEFAULT_LOCAL_MODEL;
	const baseUrl = validateLocalBaseUrl(
		options.baseUrl ?? getProviderEnvValue("GCODE_BASE_URL") ?? DEFAULT_LOCAL_BASE_URL,
	);
	return {
		id,
		name: id,
		api: "openai-completions",
		provider: options.id ?? "local",
		baseUrl,
		reasoning: false,
		input: ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: options.contextWindow ?? 32768,
		maxTokens: options.maxTokens ?? 4096,
	};
}

/** Inference against the configured server, including a server on the local network. */
export function localProvider(options: LocalProviderOptions = {}): Provider<"openai-completions"> {
	const model = localModel(options);
	return createProvider({
		id: model.provider,
		name: options.name ?? "Local",
		baseUrl: model.baseUrl,
		headers: options.headers,
		models: options.models ?? [model],
		auth: {
			apiKey: {
				name: "Local server",
				resolve: async ({ ctx, credential, signal }) => {
					signal.throwIfAborted();
					const apiKey = credential?.key ?? (await ctx.env("GCODE_API_KEY"));
					return { auth: { ...(apiKey ? { apiKey } : {}) }, source: "local endpoint" };
				},
			},
		},
		api: completions,
	});
}
