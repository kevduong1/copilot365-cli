// A real model: stream an answer from the local endpoint.
// Run from packages/durable (needs GARMIN_CODE_MINI_MODEL):
//   node --conditions=source --experimental-strip-types test/examples/16-real-model.ts

import { createModels } from "@garmin-code-mini/ai/models";
import { localProvider } from "@garmin-code-mini/ai/providers/local";
import { BACKGROUND_CONTEXT } from "@garmin-code-mini/chord/context";
import {
	AssistantEntry,
	createRegistry,
	defineExtension,
	Harness,
	LiveDoc,
	MemoryStorage,
	section,
} from "../../src/index.ts";

const context = BACKGROUND_CONTEXT;

// Production code passes a Models collection with real providers; the Harness
// never talks to a provider any other way. localProvider() reads
// GARMIN_CODE_MINI_MODEL from the environment. While the answer streams, generation
// commits throttled partials to the conversation's garmin-code-mini.live document. Watching
// that document streams the answer; the watch sees only committed values.
if (process.env.GARMIN_CODE_MINI_MODEL === undefined) {
	console.log("skipped: GARMIN_CODE_MINI_MODEL is not set");
} else {
	const models = createModels();
	models.setProvider(localProvider());
	const registry = createRegistry();
	registry.install(
		defineExtension({
			name: "concise",
			sections: [section("preamble", () => "You are a concise assistant.", { tag: false })],
		}),
	);
	const harness = await Harness.open(new MemoryStorage(), { models, registry }, context);
	const root = await harness.root(context, {
		agent: {
			model: { provider: "local", modelId: process.env.GARMIN_CODE_MINI_MODEL || "local-model" },
			thinkingLevel: "high",
		},
	});
	const liveWatch = (await harness.watchDoc(LiveDoc, root.id, context))!;
	// Print only what each committed partial adds to the text printed so far.
	let printed = "";
	const printText = (text: string): void => {
		if (text.length <= printed.length || !text.startsWith(printed)) return;
		process.stdout.write(text.slice(printed.length));
		printed = text;
	};
	liveWatch.start(async (value) => {
		const block = value?.generation?.message?.content.find((content) => content.type === "text");
		if (block?.type === "text") printText(block.text);
	});
	harness.resume();
	process.stdout.write("answer: ");
	const poem = await root.submit({ type: "input", content: "Write a long poem" }, context);
	const settledPoem = await poem.wait(context);
	await liveWatch.stop();
	if (settledPoem.status === "done" && settledPoem.type === "input") {
		// The last throttle window may not have been committed as a partial; the answer entry has the rest.
		const entry = await root.commit((tx) => tx.entry(AssistantEntry, settledPoem.answer), context);
		const message = entry?.model?.[0];
		const block =
			message?.role === "assistant" ? message.content.find((content) => content.type === "text") : undefined;
		if (block?.type === "text") printText(block.text);
		process.stdout.write("\n");
	} else {
		console.log("unanswered:", settledPoem.reason, settledPoem.detail);
	}
	await harness.close(context);
}
