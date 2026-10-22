# gcode

gcode is an extensible AI agent that works from your terminal. Give it a goal and a working folder, and it can inspect files, run commands, edit content, and work through multi-step tasks.

Use gcode for software development, research notes, writing projects, data files, or hobby work. You can use gcode as is, prompt it to adapt itself to your workflow, or build other applications powered by gcode using the SDK.

## Start using gcode

New to gcode? Follow the [Quickstart](quickstart.md) to install gcode, connect a model, and complete your first task.

If gcode is already installed, choose what you want to do:

- [Use gcode interactively](usage.md) to add files, run commands, direct ongoing work, and export results.
- [Choose a model](models.md) on your configured local OpenAI-compatible endpoint.
- [Continue or branch a session](sessions.md) to resume work or explore another approach without losing history.
- [Configure gcode](configuration.md) for your preferences, working folders, instructions, and reusable resources.
- [Understand how gcode works](how-gcode-works.md), including tools, context, sessions, and the agent loop.

## Customize gcode

gcode can reuse prompts, load specialized instructions, add executable integrations, change its terminal interface, configure local models, and distribute these resources as packages.
Use the [Quickstart customization chooser](quickstart.md#choose-how-to-customize-gcode) to select the smallest mechanism that meets your need.

## Automate or embed gcode

- Use [print mode](cli.md#invocation-and-output) for one-off and scripted tasks.
- Use [JSON event stream mode](json.md) to consume structured events from one run.
- Use [RPC mode](rpc.md) to control a separate gcode process.
- Use the [TypeScript SDK](sdk.md) to run gcode inside an application.

## Find reference and setup information

Use the reference pages to look up [CLI options](cli.md), [settings](settings.md), [providers](providers.md), [keybindings](keybindings.md), and [environment variables](environment-variables.md).

For platform-specific help, see [Terminal Setup](terminal-setup.md), [Windows](windows.md), [tmux](tmux.md), [Termux on Android](termux.md), or [Containerization](containerization.md).

## Work safely

gcode's tools and extensions run with the permissions of the gcode process. Project trust controls which project resources gcode loads, but it does not sandbox tool calls. Review [Security](security.md) before using untrusted files, repositories, extensions, or unattended automation.
