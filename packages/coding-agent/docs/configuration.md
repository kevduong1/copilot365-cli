# Configuration

garmin-code-mini supports user-level and project configuration. User-level configuration lives in the agent directory, which defaults to `~/.garmin-code-mini/agent`. Project configuration lives in `.garmin-code-mini` under the working directory and loads after [project trust](security.md#understand-project-trust) is granted. The only exception is `sessionDir`, which garmin-code-mini reads before resolving trust so it can locate sessions.

In interactive mode, use `/settings` to change common preferences. For other options, ask garmin-code-mini to update the configuration or edit the relevant files directly. Run `/reload` after manually changing settings, keybindings, instructions, or resources.

## Agent directory

The agent directory is shown as `<agent-dir>` below. Set its location with the `GARMIN_CODE_MINI_AGENT_DIR` environment variable or the SDK's [`agentDir`](sdk.md) option.

| Path | Responsibility |
|---|---|
| `<agent-dir>/settings.json` | User-level [settings](settings.md), including preferences, defaults, resource paths, and garmin-code-mini package declarations. |
| `<agent-dir>/keybindings.json` | Custom terminal UI and application [keybindings](keybindings.md). |
| `<agent-dir>/models.json` | [Compatible endpoints, models, and model overrides](models.md). |
| `<agent-dir>/AGENTS.override.md`, `AGENTS.md`, `AGENTS.MD`, `CLAUDE.md`, or `CLAUDE.MD` | User instructions applied across working directories. |
| `<agent-dir>/SYSTEM.md` | Replaces garmin-code-mini’s default system prompt. |
| `<agent-dir>/APPEND_SYSTEM.md` | Adds instructions to garmin-code-mini’s system prompt. |
| `<agent-dir>/extensions/` | User [extensions](extensions.md). |
| `<agent-dir>/skills/` | User [skills](skills.md) and supporting files. |
| `<agent-dir>/prompts/` | User [prompt templates](prompt-templates.md) exposed as slash commands. |
| `<agent-dir>/themes/` | User [theme](themes.md) files. |

## Project `.garmin-code-mini` directory

| Path | Responsibility |
|---|---|
| `.garmin-code-mini/settings.json` | Project-level [settings](settings.md), resource paths, and garmin-code-mini package declarations. |
| `.garmin-code-mini/SYSTEM.md` | Replaces the system prompt for the project. |
| `.garmin-code-mini/APPEND_SYSTEM.md` | Adds project-specific instructions to the system prompt. |
| `.garmin-code-mini/extensions/` | Project extensions. |
| `.garmin-code-mini/skills/` | Project skills and supporting files. |
| `.garmin-code-mini/prompts/` | Project prompt templates exposed as slash commands. |
| `.garmin-code-mini/themes/` | Project theme files. |

For `SYSTEM.md` and `APPEND_SYSTEM.md`, the trusted project file takes precedence over the corresponding agent-directory file. Files with the same name are not combined.

## Context files

Context files are separate from project `.garmin-code-mini` configuration. garmin-code-mini loads them from the agent directory, the working directory, and its parent directories. A context file applies whenever garmin-code-mini runs in its directory or anywhere below it.

An `AGENTS.override.md` replaces `AGENTS.md` or `CLAUDE.md` only in the same directory. It does not suppress context files from the agent directory or other directories.

Context-file discovery does not require project trust.
