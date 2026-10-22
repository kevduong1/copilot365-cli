# Environment Variables

gcode uses environment variables in three ways:

- Variables such as `GCODE_BASE_URL` configure the local inference connection.
- gcode sets process markers so child processes can identify gcode as the launching agent.
- Commands run by the LLM-callable shell tools receive `GCODE_*` variables describing the current session.

Local inference configuration is documented in [Local models](models.md).

## Process Marker

The CLI and RPC entry points set two process markers:

- `AI_AGENT=gcode` is a generic marker that lets tooling identify gcode as the agent that launched the process.
- `GCODE_CODING_AGENT=true` is gcode-specific and lets child processes detect that they run inside gcode.

Child processes inherit both markers. They are not session-specific and are not set automatically when gcode is embedded through the SDK.

## Shell Tool Session Environment

Commands run by the `bash` and `powershell` tools receive the current gcode session state:

| Variable | Description |
|----------|-------------|
| `GCODE_SESSION_ID` | Current session ID |
| `GCODE_SESSION_FILE` | Absolute path to the current session JSONL file; unset for ephemeral sessions |
| `GCODE_PROVIDER` | Currently selected model provider |
| `GCODE_MODEL` | Currently selected model ID |
| `GCODE_REASONING_LEVEL` | Current effective reasoning level: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max` |

The values are resolved when each command starts. Switching models or changing the reasoning level therefore affects the next shell command without restarting gcode. `GCODE_PROVIDER` and `GCODE_MODEL` identify the selected gcode model, not a different upstream model that a router may choose internally.

When asked which model or provider is running, inspect these variables instead of inferring the answer from the system prompt:

```bash
printf '%s/%s\n' "$GCODE_PROVIDER" "$GCODE_MODEL"
printf 'reasoning=%s session=%s\n' "$GCODE_REASONING_LEVEL" "$GCODE_SESSION_ID"
```

The session file can be inspected directly when the session is persistent:

```bash
if [ -n "$GCODE_SESSION_FILE" ]; then
  tail -n 1 "$GCODE_SESSION_FILE"
fi
```

These variables are injected into the LLM-callable `bash` and `powershell` tools. They are not injected into user-entered `!` or `!!` commands.

### Custom Shell Tools

Tools created with `createBashTool()` or `createPowerShellTool()` expose the session environment by default when registered with gcode. Injection happens before `spawnHook`, so a hook receives the variables in `ctx.env`:

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

Disable session metadata independently of the spawn hook:

```typescript
const powershellTool = createPowerShellTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

When disabled, gcode removes inherited values for these variables so nested gcode processes do not expose stale parent-session metadata.

## gcode Process Configuration

These variables are read by gcode itself:

| Variable | Description |
|----------|-------------|
| `GCODE_BASE_URL` | Local OpenAI-compatible endpoint; default `http://127.0.0.1:8080/v1` |
| `GCODE_MODEL` | Default model ID; default `local-model` |
| `GCODE_API_KEY` | Optional key for your configured local endpoint |
| `GCODE_AGENT_DIR` | Override the config directory; default is `~/.gcode/agent` |
| `GCODE_SESSION_DIR` | Override session storage; overridden by `--session-dir` |
| `GCODE_PACKAGE_DIR` | Override the package directory, useful for Nix/Guix store paths |
| `GCODE_CODEMODE_MAX_WORKERS` | Maximum codemode workers alive at once across all sessions in the process; default `2`. Each worker's script may use up to 256 MB. Raise it when one process runs several sessions, such as in-process subagents. Further scripts wait for a free worker. See [Codemode](codemode.md) |
| `GCODE_CACHE_RETENTION` | Set to `long` for extended provider prompt caching where supported |
| `GCODE_HARDWARE_CURSOR` | Set to `1` to show the hardware cursor; see [Terminal setup](terminal-setup.md) |
| `GCODE_CLIPBOARD_OSC52` | Set to `1` to also send copied text to the terminal with OSC 52 after the local clipboard write, as gcode does over SSH. Use it when a remote client reaches gcode without SSH variables, such as a multiplexer attached from another machine or a remote IDE daemon |
| `GCODE_HYPERLINKS` | Override OSC 8 hyperlink detection with `1`, `0`, or `auto` |
| `GCODE_PROGRAM_STATUS` | Override OSC 7501 program status detection: `1` always reports, `0` never reports; otherwise gcode reports only after the terminal confirms support. See [Terminal setup](terminal-setup.md#program-status) |
| `GCODE_IMAGE_PROTOCOL` | Override inline image detection with `kitty`, `iterm2`, `none`, or `auto` |
| `GCODE_TRUE_COLOR` | Override truecolor detection with `1`, `0`, or `auto` |
| `GCODE_TUI_ESC_TIMEOUT` | How long to wait after a lone ESC before treating it as Escape, in milliseconds; defaults to `100` over SSH and `10` otherwise. Increase if Alt-key input is misread as Escape |
| `VISUAL`, `EDITOR` | External editor fallback when `externalEditor` is unset |
| `HTTP_PROXY`, `HTTPS_PROXY` | Proxy outbound HTTP requests |

