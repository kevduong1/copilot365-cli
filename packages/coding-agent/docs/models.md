# Local models

Garmin Code Mini sends Chat Completions requests to the OpenAI-compatible endpoint configured by `GARMIN_CODE_MINI_BASE_URL`. Start and manage that server separately.

```bash
export GARMIN_CODE_MINI_BASE_URL=http://127.0.0.1:8080/v1
export GARMIN_CODE_MINI_MODEL=local-model
garmin-code-mini
```

The defaults are `http://127.0.0.1:8080/v1` and `local-model`. Set `GARMIN_CODE_MINI_API_KEY` if your endpoint requires a key.

Use `--model <id>` to choose another model ID accepted by the server:

```bash
garmin-code-mini --model my-local-model
```

`/model` lists configured models. It does not contact a hosted catalog. `/thinking` selects a supported reasoning level, and `Ctrl+P` cycles scoped models.

The server must support streaming Chat Completions and function tools for coding tasks. An endpoint on your internal network can be configured explicitly. Built-in hosted providers, cloud credential discovery, OAuth sign-in, online catalogs, automatic model downloads, classifier services, and image-generation services have been removed.

Additional local model metadata can be declared in [`models.json`](models-configuration.md). Use [provider extensions](custom-provider.md) for custom local integrations.

If a request fails, verify the endpoint address, model ID, and the server's support for tool calls. Credentials must be present in the environment of the process that starts Garmin Code Mini.
