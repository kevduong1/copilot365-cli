import * as bundledPiAgentCore from "@gcode/agent-core";
import * as bundledPiAiCompat from "@gcode/ai/compat";
import * as bundledPiAiModels from "@gcode/ai/models";
import * as bundledPiAiOauth from "@gcode/ai/oauth";
import * as bundledPiAiProviders from "@gcode/ai/providers/all";
import * as bundledPiTui from "@gcode/tui";
import * as bundledTypebox from "typebox";
import * as bundledTypeboxCompile from "typebox/compile";
import * as bundledTypeboxValue from "typebox/value";
// This import is safe because loader.ts exports are not re-exported from index.ts.
// Extensions can therefore import from gcode.
import * as bundledPiCodingAgent from "../../index.ts";

/** Modules available to extensions in source and compiled binary runtimes. */
export const VIRTUAL_MODULES: Record<string, unknown> = {
	typebox: bundledTypebox,
	"typebox/compile": bundledTypeboxCompile,
	"typebox/value": bundledTypeboxValue,
	"@sinclair/typebox": bundledTypebox,
	"@sinclair/typebox/compile": bundledTypeboxCompile,
	"@sinclair/typebox/value": bundledTypeboxValue,
	"@gcode/agent-core": bundledPiAgentCore,
	"@gcode/tui": bundledPiTui,
	// Extensions resolve the gcode-ai root to the compat entrypoint (a strict
	// superset of the core entrypoint): existing extensions using the old
	// global API keep working at runtime until compat is removed.
	"@gcode/ai": bundledPiAiCompat,
	"@gcode/ai/compat": bundledPiAiCompat,
	"@gcode/ai/models": bundledPiAiModels,
	"@gcode/ai/oauth": bundledPiAiOauth,
	"@gcode/ai/providers/all": bundledPiAiProviders,
	gcode: bundledPiCodingAgent,
};
