// Print mode: submit one prompt and print its answer, like `garmin-code-mini -p`. The host awaits its own Submission, not global
// idle. Uses the local endpoint when GARMIN_CODE_MINI_MODEL is set, and a scripted faux model otherwise.
// Run from packages/durable:
//   node --conditions=source --experimental-strip-types test/examples/18-print.ts "What is in this directory?"

import type { AssistantMessage } from "@garmin-code-mini/ai";
import { createModels } from "@garmin-code-mini/ai/models";
import { fauxAssistantMessage, fauxProvider, fauxText, fauxToolCall } from "@garmin-code-mini/ai/providers/faux";
import { localProvider } from "@garmin-code-mini/ai/providers/local";
import { BACKGROUND_CONTEXT } from "@garmin-code-mini/chord/context";
import { NodeExecutionEnv } from "../../src/env/node.ts";
import { AssistantEntry, createRegistry, defineExtension, Harness, MemoryStorage, section } from "../../src/index.ts";
import { createBashTool, createReadTool } from "../../src/tools/index.ts";

const context = BACKGROUND_CONTEXT;
const prompt = process.argv[2] ?? "What is in this directory?";

const models = createModels();
let model = { provider: "local", modelId: process.env.GARMIN_CODE_MINI_MODEL || "local-model" };
if (process.env.GARMIN_CODE_MINI_MODEL !== undefined) {
	models.setProvider(localProvider());
} else {
	const faux = fauxProvider();
	models.setProvider(faux.provider);
	model = { provider: "faux", modelId: "faux-1" };
	faux.setResponses([
		fauxAssistantMessage([fauxToolCall("bash", { command: "ls" }, { id: "call-1" })], { stopReason: "toolUse" }),
		fauxAssistantMessage([fauxText("This directory holds the durable package sources, tests, and docs.")]),
	]);
}

const registry = createRegistry();
registry.install(
	defineExtension({
		name: "coding",
		tools: [createReadTool(), createBashTool()],
		sections: [section("preamble", () => "You are a concise coding assistant.", { tag: false })],
	}),
);
const env = new NodeExecutionEnv({ cwd: process.cwd() });
const harness = await Harness.open(new MemoryStorage(), { models, registry, env: () => env }, context);
const root = await harness.root(context, { agent: { model } });

const submission = await root.submit({ type: "input", content: prompt }, context);
const settled = await submission.wait(context);
if (settled.status === "done" && settled.type === "input") {
	const entry = await root.commit((tx) => tx.entry(AssistantEntry, settled.answer), context);
	const answer = entry?.model?.[0] as AssistantMessage;
	console.log(answer.content.flatMap((content) => (content.type === "text" ? [content.text] : [])).join(""));
} else {
	console.error(`unanswered: ${settled.status === "unanswered" ? settled.reason : settled.status}`);
	process.exitCode = 1;
}
await harness.close(context);
