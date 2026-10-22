# Quickstart

Gcode runs in your terminal and uses your local OpenAI-compatible model server.

## Install and start

Use Node.js 22.19 or newer. From the checkout:

```bash
npm install --ignore-scripts
export GCODE_BASE_URL=http://127.0.0.1:8080/v1
export GCODE_MODEL=local-model
./gcode
```

Start the model server separately. Use the model ID your server accepts. Set `GCODE_API_KEY` only if your server requires authentication.

Add this checkout to your `PATH` to use `gcode` from another directory. The command preserves your working directory.

## Give the agent a task

```text
Explain how this repository is structured and how to run its checks.
```

Type `@` to attach a file. Review the response and changed files when the task finishes. Tools run with the permissions of the process that launches the agent.

## Continue later

Sessions are saved under `~/.gcode/agent/sessions`, grouped by working directory.

```bash
gcode --continue
```

Use `/resume` to choose another session, `/model` to select a configured model, `/settings` to adjust the interface, and `/hotkeys` for keyboard shortcuts.

## Customize

Local [extensions](extensions.md), [skills](skills.md), [prompt templates](prompt-templates.md), and [themes](themes.md) remain available. Install extension packages from local paths. See [Configuration](configuration.md) for project instructions and resource locations.

Cloud providers, browser sign-in, remote package installation, model downloads, uploads, telemetry, and automatic updates have been removed. See [Local models](models.md) and [Environment variables](environment-variables.md).
