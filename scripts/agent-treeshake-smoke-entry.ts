import { Agent } from "@garmin-code-mini/agent-core";
import { createModels } from "@garmin-code-mini/ai";
import { localProvider } from "@garmin-code-mini/ai/providers/local";

const models = createModels();
models.setProvider(localProvider());
const model = models.getModel("local", "local-model");
if (!model) throw new Error("Local smoke-test model not found");

export const agent = new Agent({
	initialState: { model },
	streamFn: models.streamSimple.bind(models),
});
