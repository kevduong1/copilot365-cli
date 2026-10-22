# Garmin Code Mini

Garmin Code Mini is a local coding assistant with a terminal interface. It reads files, searches code, runs shell commands, edits files, and saves sessions on your machine.

The only inference connection is your configured OpenAI-compatible local endpoint. Cloud providers, sign-in flows, telemetry uploads, remote model catalogs, session uploads, and automatic updates have been removed.

## Run from source

Use Node.js 22.19 or newer:

```bash
npm install --ignore-scripts
export GARMIN_CODE_MINI_BASE_URL=http://127.0.0.1:8080/v1
./garmin-code-mini
```

Start your model server separately. The default model ID is `local-model`; choose another ID with `--model`:

```bash
./garmin-code-mini --model my-local-model
./garmin-code-mini -p "Explain this project's entry point"
./garmin-code-mini @task.md "Implement this task"
./garmin-code-mini --continue
```

The executable preserves your current directory. Add this checkout to your `PATH` to invoke `garmin-code-mini` from another project.

## Configuration

User settings, local resources, and sessions are stored under `~/.garmin-code-mini/agent`. Project resources use `.garmin-code-mini/`.

| Variable | Purpose |
| --- | --- |
| `GARMIN_CODE_MINI_BASE_URL` | Local inference endpoint; defaults to `http://127.0.0.1:8080/v1` |
| `GARMIN_CODE_MINI_MODEL` | Default model ID (default: `local-model`) |
| `GARMIN_CODE_MINI_API_KEY` | Optional API key required by your local endpoint |
| `GARMIN_CODE_MINI_AGENT_DIR` | Override the user configuration directory |
| `GARMIN_CODE_MINI_SESSION_DIR` | Override the session storage directory |

Use `/model` to select a configured model, `/settings` to adjust the interface, and `/hotkeys` to inspect keyboard shortcuts. Sessions can be exported to local HTML or JSONL with `/export`.

Local [extensions](packages/coding-agent/docs/extensions.md), [skills](packages/coding-agent/docs/skills.md), [prompt templates](packages/coding-agent/docs/prompt-templates.md), and [themes](packages/coding-agent/docs/themes.md) remain available. Install extension packages from local paths.

The agent runs file and shell tools with the permissions of the process that launches it.

## Development

```bash
npm run check
./test.sh
```

See [AGENTS.md](AGENTS.md) for development rules. Supporting packages live in `packages/`, including the agent runtime, local inference client, and terminal UI.

## License

MIT. Original copyright and license notices are preserved in [LICENSE](LICENSE).
