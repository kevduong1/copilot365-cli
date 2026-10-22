import * as bundledPiAgentCore from "@garmin-code-mini/agent-core";
import * as bundledPiAiCompat from "@garmin-code-mini/ai/compat";
import * as bundledPiAiModels from "@garmin-code-mini/ai/models";
import * as bundledPiAiOauth from "@garmin-code-mini/ai/oauth";
import * as bundledPiAiProviders from "@garmin-code-mini/ai/providers/all";
import * as bundledPiTui from "@garmin-code-mini/tui";
import * as bundledTypebox from "typebox";
import * as bundledTypeboxCompile from "typebox/compile";
import * as bundledTypeboxValue from "typebox/value";
// This import is safe because loader.ts exports are not re-exported from index.ts.
// Extensions can therefore import from garmin-code-mini.
import * as bundledPiCodingAgent from "../../index.ts";

/** Modules available to extensions in source and compiled binary runtimes. */
export const VIRTUAL_MODULES: Record<string, unknown> = {
	typebox: bundledTypebox,
	"typebox/compile": bundledTypeboxCompile,
	"typebox/value": bundledTypeboxValue,
	"@sinclair/typebox": bundledTypebox,
	"@sinclair/typebox/compile": bundledTypeboxCompile,
	"@sinclair/typebox/value": bundledTypeboxValue,
	"@garmin-code-mini/agent-core": bundledPiAgentCore,
	"@garmin-code-mini/tui": bundledPiTui,
	// Extensions resolve the garmin-code-mini-ai root to the compat entrypoint (a strict
	// superset of the core entrypoint): existing extensions using the old
	// global API keep working at runtime until compat is removed.
	"@garmin-code-mini/ai": bundledPiAiCompat,
	"@garmin-code-mini/ai/compat": bundledPiAiCompat,
	"@garmin-code-mini/ai/models": bundledPiAiModels,
	"@garmin-code-mini/ai/oauth": bundledPiAiOauth,
	"@garmin-code-mini/ai/providers/all": bundledPiAiProviders,
	"garmin-code-mini": bundledPiCodingAgent,
};
