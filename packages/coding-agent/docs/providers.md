# Local model provider

garmin-code-mini uses an OpenAI-compatible Chat Completions server that you operate. There are no built-in hosted providers, cloud credential discovery, browser login flows, or online model catalogs.

```sh
export GARMIN_CODE_MINI_BASE_URL=http://127.0.0.1:8080/v1
export GARMIN_CODE_MINI_MODEL=your-model-name
garmin-code-mini
```

The defaults are `http://127.0.0.1:8080/v1` and `local-model`. Set the model name to the identifier your server accepts. The server must support streaming Chat Completions and function tools for coding-agent tool use. An explicitly configured server can also run on your internal network.

Install dependencies and provision your model server before disconnecting from the Internet. The application does not download models or tools at startup. Shell commands and user-installed extensions execute with your permissions; use operating-system network restrictions if those also need enforced isolation.
