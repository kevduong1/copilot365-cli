import { type Static, Type } from "typebox";

/** Overrides implemented by the local OpenAI-compatible chat transport. */
export const OpenAICompletionsCompatSchema = Type.Object(
	{
		supportsReasoningEffort: Type.Optional(
			Type.Boolean({
				description: "Whether the local server accepts reasoning_effort.",
				default: true,
			}),
		),
		supportsUsageInStreaming: Type.Optional(
			Type.Boolean({
				description: "Whether the local server accepts stream_options.include_usage.",
				default: true,
			}),
		),
		supportsFinishReason: Type.Optional(
			Type.Boolean({
				description: "Whether the local server sends finish_reason. Set false only for a server that omits it.",
				default: true,
			}),
		),
		maxTokensField: Type.Optional(
			Type.Union([Type.Literal("max_tokens"), Type.Literal("max_completion_tokens")], {
				description: "Local server field used to limit generated tokens.",
				default: "max_tokens",
			}),
		),
		supportsStrictMode: Type.Optional(
			Type.Boolean({
				description: "Whether the local server supports strict JSON-schema function tools.",
				default: false,
			}),
		),
	},
	{ description: "Local chat-completions compatibility settings.", additionalProperties: true },
);

export const CompatSchemasByApi = { "openai-completions": OpenAICompletionsCompatSchema } as const;
export const ProviderCompatSchema = OpenAICompletionsCompatSchema;
export interface OpenAICompletionsCompat extends Static<typeof OpenAICompletionsCompatSchema> {}
