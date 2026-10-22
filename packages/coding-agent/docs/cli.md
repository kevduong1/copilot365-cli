# Command line

Run `gcode --help` for available options, including flags registered by local extensions. From a source checkout, use `./gcode`.

## Invocation and output

```bash
gcode
gcode --print "Explain this repository"
git diff | gcode --print "Review this change"
gcode --mode json "Inspect this repository" > events.jsonl
```

Interactive mode uses the terminal UI. `--print` processes prompts and exits. `--mode json` writes JSONL events; `--mode rpc` reads commands from stdin and writes protocol responses to stdout. See [CLI integration](cli-integration.md), [JSON mode](json.md), and [RPC](rpc.md).

Messages can include `@path` attachments. Use `--` to end option parsing.

## Models

Set `GCODE_BASE_URL` to your local OpenAI-compatible endpoint. It defaults to `http://127.0.0.1:8080/v1`. Set `GCODE_MODEL` to the model ID accepted by your server; the default is `local-model`. `GCODE_API_KEY` supplies an optional key.

| Option | Behavior |
| --- | --- |
| `--model <id>` | Select a local model ID |
| `--provider <name>` | Select the local provider; defaults to `local` |
| `--thinking <level>` | Set `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max` |
| `--models <patterns>` | Set the model cycling scope |
| `--list-models [search]` | List configured models |

See [Local models](models.md).

## Sessions

| Option | Behavior |
| --- | --- |
| `--continue`, `-c` | Continue the most recent session for this directory |
| `--resume`, `-r` | Choose a saved session |
| `--session <path or id>` | Open a specific session |
| `--session-id <id>` | Open or create the exact project session ID |
| `--fork <path or id>` | Fork an existing session |
| `--session-dir <dir>` | Override storage and lookup, taking precedence over `GCODE_SESSION_DIR` |
| `--no-session` | Use an in-memory session |
| `--name <name>`, `-n` | Name the session |
| `--export <input> [output]` | Export a saved session to local HTML |

See [Sessions](sessions.md).

## Tools

The default tools are `read`, `bash`, `edit`, and `write`. Additional built-in tools are `powershell`, `grep`, `find`, and `ls`.

`--tools <names>` sets an allowlist; a list containing only `+name` and `-name` entries modifies the defaults. `--exclude-tools <patterns>` disables matching tools. `--no-tools` disables all tools; `--no-builtin-tools` retains extension tools.

```bash
gcode --tools read,grep,find,ls -p "Review this project"
gcode --tools +codemode
```

### Enable codemode

Use `--tools +codemode` for a run, or add `"defaultTools": ["+codemode"]` to settings. Scripts call local tools through `tools.<name>(args)`. See [Codemode](codemode.md).

## Local resources

`--extension <path>`, `--skill <path>`, `--prompt-template <path>`, and `--theme <path>` load local resources. These options can be repeated. Their corresponding `--no-extensions`, `--no-skills`, `--no-prompt-templates`, and `--no-themes` flags disable discovery. `--no-context-files` disables instruction-file discovery.

```bash
gcode install ./my-extension
gcode remove ./my-extension
gcode list
gcode config
```

Add `-l` for project package settings. Remote package installation has been removed. See [Packages](packages.md).

## Prompts and interface

`--system-prompt <text or path>` replaces the system prompt. `--append-system-prompt <text or path>` appends instructions and can be repeated.

`--tui-mode fullscreen` or `--tui-mode regular` selects the terminal layout. `--use-theme <name>` chooses a theme. `--verbose` shows startup details. `--approve` trusts project resources for the run; `--no-approve` ignores them. `--version` prints the version.

Cloud provider commands, browser sign-in, MCP connections, hosted uploads, telemetry, and automatic updates have been removed.
