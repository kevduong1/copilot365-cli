# Local models

Gcode sends Chat Completions requests to the OpenAI-compatible endpoint configured by `GCODE_BASE_URL`. Start and manage that server separately.

```bash
export GCODE_BASE_URL=http://127.0.0.1:8080/v1
export GCODE_MODEL=local-model
gcode
```

The defaults are `http://127.0.0.1:8080/v1` and `local-model`. Set `GCODE_API_KEY` if your endpoint requires a key.

Use `--model <id>` to choose another model ID accepted by the server:

```bash
gcode --model my-local-model
```

`/model` lists configured models. It does not contact a hosted catalog. `/thinking` selects a supported reasoning level, and `Ctrl+P` cycles scoped models.

The server must support streaming Chat Completions and function tools for coding tasks. An endpoint on your internal network can be configured explicitly. Built-in hosted providers, cloud credential discovery, OAuth sign-in, online catalogs, automatic model downloads, classifier services, and image-generation services have been removed.

Additional local model metadata can be declared in [`models.json`](models-configuration.md). Use [provider extensions](custom-provider.md) for custom local integrations.

If a request fails, verify the endpoint address, model ID, and the server's support for tool calls. Credentials must be present in the environment of the process that starts Gcode.
