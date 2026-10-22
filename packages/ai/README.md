# Garmin Code Mini local inference

This package connects the coding agent to your own OpenAI-compatible chat-completions server. It uses native `fetch`, streams text and tool calls, validates tool arguments, and tracks token usage reported by the server.

The only built-in provider is `local`. Startup uses a static model declaration and makes no catalog or authentication requests. Hosted provider implementations, SDKs, and built-in OAuth flows have been removed.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GARMIN_CODE_MINI_BASE_URL` | `http://127.0.0.1:8080/v1` | Your server's API base URL |
| `GARMIN_CODE_MINI_MODEL` | `local-model` | Model identifier expected by your server |
| `GARMIN_CODE_MINI_API_KEY` | unset | Optional bearer token for your server |

Run your inference server separately with a model that supports tool calling. Set the base URL to a loopback address, LAN address, or internal hostname. The configured server is the inference request destination. HTTP redirects fail instead of forwarding requests to another destination.

## Usage

```typescript
import { createModels, localProvider } from "@garmin-code-mini/ai";

const models = createModels();
models.setProvider(localProvider());
const model = models.getModels("local")[0];
const response = models.streamSimple(model, {
  systemPrompt: "You are a coding assistant.",
  messages: [{ role: "user", content: "Explain this function", timestamp: Date.now() }],
});

for await (const event of response) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}

const message = await response.result();
```

Pass `baseUrl`, `modelId`, `contextWindow`, and `maxTokens` to `localProvider()` to override environment defaults. Use `models` to supply explicit model declarations, including capabilities such as image input and reasoning supported by your server.

`stream()` and `streamSimple()` emit start, delta, end, and terminal events. `complete()` and `completeSimple()` return the final assistant message. Request options include `signal`, `timeoutMs`, optional `apiKey` and `headers`, `temperature`, `maxTokens`, and arbitrary local sampling parameters through `samplingParams`. A broken stream produces an error result; incomplete tool arguments retain an `argumentsError` for validation.

Tools use TypeBox parameter schemas, re-exported as `Type`. Tool calls contain an ID, name, and parsed arguments. Append the assistant message and a matching `toolResult` message before continuing the conversation. `fauxProvider()` provides deterministic responses for tests without an inference server.

## Development

`npm run generate-models` writes the local model declarations without network access. Run repository checks with `npm run check` from the repository root. Local inference regression tests use mocked responses and do not require a model, credentials, or a remote API.
