import { Agent } from "@gcode/agent-core";
import { createModels } from "@gcode/ai";
import { localProvider } from "@gcode/ai/providers/local";

const models = createModels();
models.setProvider(localProvider());
const model = models.getModel("local", "local-model");
if (!model) throw new Error("Local smoke-test model not found");

export const agent = new Agent({
	initialState: { model },
	streamFn: models.streamSimple.bind(models),
});
