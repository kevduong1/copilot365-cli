# Models Configuration

<!-- This file is generated from TypeScript source. Do not edit it manually; run npm run generate:references. -->

This reference lists the fields of `models.json`. See [Local models](models.md) for examples and [Configuration](configuration.md#agent-directory) for the file location.

Use the locally shipped [models schema](../schemas/models.schema.json) for editor validation and completion.

## Providers

Each key under `providers` is a provider ID. A built-in provider ID changes that provider. Any other ID adds a provider, which needs `baseUrl` and an `api` at provider or model level.

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | string |  | Display name. |
| `baseUrl` | string |  | API base URL. Also applies to the provider's built-in models. |
| `apiKey` | string |  | Literal key, "$NAME" environment interpolation, or "!command" output. |
| `api` | string |  | Local API protocol: "openai-completions". Custom extension protocols require an explicit implementation. |
| `headers` | object |  | Request headers. Values resolve like apiKey. |
| `compat` | [object](#compatibility) |  | Local chat-completions compatibility settings. |
| `authHeader` | boolean | `false` | Whether to send the resolved API key as Authorization: Bearer. |
| `models` | [`object[]`](#models) |  |  |
| `modelOverrides` | [object](#model-overrides) |  |  |

## Models

Each `models` entry adds a model to the provider. An entry whose `id` matches an existing model replaces it.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | string |  | Required. Model ID sent to the API. |
| `name` | string |  | Display name, also matched by --model patterns. |
| `api` | string |  | Overrides the provider api. |
| `baseUrl` | string |  | Overrides the provider baseUrl. |
| `reasoning` | boolean | `false` | Whether the model supports thinking. |
| `thinkingLevelMap` | object |  | Provider value sent for each thinking level. null marks a level unsupported. Levels the model does not map use the provider's default value through high; xhigh and max are unsupported. |
| `input` | `("text" \| "image")[]` | `["text"]` |  |
| `inputLimits` | [object](#input-limits) |  |  |
| `cost` | object |  |  |
| `cost.input` | number |  | Required. Input cost in USD per million tokens. |
| `cost.output` | number |  | Required. Output cost in USD per million tokens. |
| `cost.cacheRead` | number |  | Required. Cache-read cost in USD per million tokens. |
| `cost.cacheWrite` | number |  | Required. Cache-write cost in USD per million tokens. |
| `cost.tiers` | `object[]` |  | Request-wide pricing tiers. The highest matching input threshold applies to the full request. |
| `cost.tiers[].inputTokensAbove` | number |  | Required. Use this tier when total request input exceeds this token count. |
| `cost.tiers[].input` | number |  | Required. Input cost in USD per million tokens. |
| `cost.tiers[].output` | number |  | Required. Output cost in USD per million tokens. |
| `cost.tiers[].cacheRead` | number |  | Required. Cache-read cost in USD per million tokens. |
| `cost.tiers[].cacheWrite` | number |  | Required. Cache-write cost in USD per million tokens. |
| `promptCache` | object |  | Best-effort prompt cache lifetime in seconds for the short and long retention tiers. gcode warms only tiers with a known lifetime. |
| `contextWindow` | number | `128000` | Context window in tokens. |
| `maxTokens` | number | `16384` | Maximum output tokens. |
| `samplingParams` | object |  | Fields merged into every request body. Applies only to OpenAI-compatible APIs. |
| `samplingParamsByThinkingLevel` | object |  | samplingParams per thinking level, merged over samplingParams. |
| `headers` | object |  | Request headers. Values resolve like apiKey. |
| `compat` | [object](#compatibility) |  | Local chat-completions compatibility settings. |

## Model overrides

Each `modelOverrides` key is the ID of a built-in or extension model. Unknown IDs are ignored. Object fields, such as `cost`, merge with the model's value field by field; other fields replace it.

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | string |  | Display name, also matched by --model patterns. |
| `reasoning` | boolean |  | Whether the model supports thinking. |
| `thinkingLevelMap` | object |  | Provider value sent for each thinking level. null marks a level unsupported. Levels the model does not map use the provider's default value through high; xhigh and max are unsupported. |
| `input` | `("text" \| "image")[]` |  |  |
| `inputLimits` | [object](#input-limits) |  |  |
| `cost` | object |  |  |
| `cost.input` | number |  | Input cost in USD per million tokens. |
| `cost.output` | number |  | Output cost in USD per million tokens. |
| `cost.cacheRead` | number |  | Cache-read cost in USD per million tokens. |
| `cost.cacheWrite` | number |  | Cache-write cost in USD per million tokens. |
| `cost.tiers` | `object[]` |  | Request-wide pricing tiers. The highest matching input threshold applies to the full request. |
| `cost.tiers[].inputTokensAbove` | number |  | Required. Use this tier when total request input exceeds this token count. |
| `cost.tiers[].input` | number |  | Required. Input cost in USD per million tokens. |
| `cost.tiers[].output` | number |  | Required. Output cost in USD per million tokens. |
| `cost.tiers[].cacheRead` | number |  | Required. Cache-read cost in USD per million tokens. |
| `cost.tiers[].cacheWrite` | number |  | Required. Cache-write cost in USD per million tokens. |
| `promptCache` | object |  | Best-effort prompt cache lifetime in seconds for the short and long retention tiers. gcode warms only tiers with a known lifetime. |
| `contextWindow` | number |  | Context window in tokens. |
| `maxTokens` | number |  | Maximum output tokens. |
| `samplingParams` | object |  | Fields merged into every request body. Applies only to OpenAI-compatible APIs. |
| `samplingParamsByThinkingLevel` | object |  | samplingParams per thinking level, merged over samplingParams. |
| `headers` | object |  | Request headers. Values resolve like apiKey. |
| `compat` | [object](#compatibility) |  | Local chat-completions compatibility settings. |

## Input limits

See [Local models](models.md).

| Field | Type | Default | Description |
|---|---|---|---|
| `maxRequestBytes` | integer |  | Maximum serialized provider request size in bytes. |
| `images` | object |  |  |
| `images.resize` | object |  | Cache-safe resize profile applied before a new image enters conversation history. |
| `images.resize.maxWidth` | integer |  |  |
| `images.resize.maxHeight` | integer |  |  |
| `images.resize.maxBytes` | integer |  | Maximum base64-encoded payload size in bytes. |
| `images.resize.jpegQuality` | integer |  |  |
| `images.maxPerMessage` | integer |  | Maximum images accepted in one provider message. |
| `images.maxPerRequest` | integer |  | Maximum images accepted across one provider request. |

## Compatibility

`compat` describes verified differences from an API's standard request and response behavior. Model values override provider values per field. The fields that apply depend on the model's `api`.

### `openai-completions`

| Field | Type | Default | Description |
|---|---|---|---|
| `supportsReasoningEffort` | boolean | `true` | Whether the local server accepts reasoning_effort. |
| `supportsUsageInStreaming` | boolean | `true` | Whether the local server accepts stream_options.include_usage. |
| `supportsFinishReason` | boolean | `true` | Whether the local server sends finish_reason. Set false only for a server that omits it. |
| `maxTokensField` | `"max_tokens" \| "max_completion_tokens"` | `"max_tokens"` | Local server field used to limit generated tokens. |
| `supportsStrictMode` | boolean | `false` | Whether the local server supports strict JSON-schema function tools. |
