# garmin-code-mini

garmin-code-mini is an extensible AI agent that works from your terminal. Give it a goal and a working folder, and it can inspect files, run commands, edit content, and work through multi-step tasks.

Use garmin-code-mini for software development, research notes, writing projects, data files, or hobby work. You can use garmin-code-mini as is, prompt it to adapt itself to your workflow, or build other applications powered by garmin-code-mini using the SDK.

## Start using garmin-code-mini

New to garmin-code-mini? Follow the [Quickstart](quickstart.md) to install garmin-code-mini, connect a model, and complete your first task.

If garmin-code-mini is already installed, choose what you want to do:

- [Use garmin-code-mini interactively](usage.md) to add files, run commands, direct ongoing work, and export results.
- [Choose a model](models.md) on your configured local OpenAI-compatible endpoint.
- [Continue or branch a session](sessions.md) to resume work or explore another approach without losing history.
- [Configure garmin-code-mini](configuration.md) for your preferences, working folders, instructions, and reusable resources.
- [Understand how garmin-code-mini works](how-garmin-code-mini-works.md), including tools, context, sessions, and the agent loop.

## Customize garmin-code-mini

garmin-code-mini can reuse prompts, load specialized instructions, add executable integrations, change its terminal interface, configure local models, and distribute these resources as packages.
Use the [Quickstart customization chooser](quickstart.md#choose-how-to-customize-garmin-code-mini) to select the smallest mechanism that meets your need.

## Automate or embed garmin-code-mini

- Use [print mode](cli.md#invocation-and-output) for one-off and scripted tasks.
- Use [JSON event stream mode](json.md) to consume structured events from one run.
- Use [RPC mode](rpc.md) to control a separate garmin-code-mini process.
- Use the [TypeScript SDK](sdk.md) to run garmin-code-mini inside an application.

## Find reference and setup information

Use the reference pages to look up [CLI options](cli.md), [settings](settings.md), [providers](providers.md), [keybindings](keybindings.md), and [environment variables](environment-variables.md).

For platform-specific help, see [Terminal Setup](terminal-setup.md), [Windows](windows.md), [tmux](tmux.md), [Termux on Android](termux.md), or [Containerization](containerization.md).

## Work safely

garmin-code-mini's tools and extensions run with the permissions of the garmin-code-mini process. Project trust controls which project resources garmin-code-mini loads, but it does not sandbox tool calls. Review [Security](security.md) before using untrusted files, repositories, extensions, or unattended automation.
