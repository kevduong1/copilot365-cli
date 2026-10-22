# Gcode

A local coding assistant with a terminal interface, file tools, shell execution, and saved sessions.

From the repository root, install dependencies and run:

```bash
npm install --ignore-scripts
GCODE_BASE_URL=http://127.0.0.1:8080/v1 ./gcode
```

Start your OpenAI-compatible model server separately. The default model ID is `local-model`; use `--model <id>` to change it. `GCODE_MODEL` sets the default model ID. `GCODE_API_KEY` supplies an optional key when required by your endpoint. Run `./gcode --help` for command-line options.

```bash
./gcode -p "Explain this project"
./gcode @task.md "Implement this task"
./gcode --continue
```

Configuration and saved sessions use `~/.gcode/agent`. Project resources use `.gcode/`. The `GCODE_AGENT_DIR` and `GCODE_SESSION_DIR` variables override those user directories.

Use `/settings`, `/model`, `/hotkeys`, `/resume`, and `/export` inside the terminal interface. Local [extensions](docs/extensions.md), [skills](docs/skills.md), [prompt templates](docs/prompt-templates.md), and [themes](docs/themes.md) remain supported.

Inference uses the configured local endpoint. Cloud providers, hosted authentication, uploads, remote catalogs, and automatic updates have been removed.

The agent runs file and shell tools with the permissions of the process that launches it.

## License

MIT. Original copyright and license notices are preserved.
