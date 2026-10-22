import { createHost, memoryLinkPair, replicatedState } from "@gcode/chord";
import { createAssistantMessageEventStream, Type } from "@gcode/ai";
import { complete, getModel, getProviders, streamSimple } from "@gcode/ai/compat";
import { Agent } from "@gcode/agent-core";

// Keep this entry browser-safe. It is bundled by scripts/check-browser-smoke.mjs
// to catch accidental Node-only runtime imports in browser-facing package exports.
const model = getModel("local", "local-model");
const schema = Type.Object({ prompt: Type.String() });
const stream = createAssistantMessageEventStream();

const agent = new Agent({ initialState: { model }, streamFn: streamSimple });
agent.steer({ role: "user", content: [{ type: "text", text: "queued" }], timestamp: 0 });

console.log(
	model.id,
	getProviders().length,
	typeof complete,
	schema.type,
	typeof stream.push,
	agent.hasQueuedMessages(),
	typeof createHost,
	typeof memoryLinkPair,
	replicatedState({ browser: true }).value.browser,
);
