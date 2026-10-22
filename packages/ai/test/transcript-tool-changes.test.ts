import { Type } from "typebox";
import { describe, expect, test } from "vitest";
import { streamSimple } from "../src/compat.ts";
import type { Api, Context, Model, SystemMessage, Tool } from "../src/types.ts";
import { resolveTranscriptTools } from "../src/utils/transcript.ts";

class PayloadCaptured extends Error {}
function tool(name: string): Tool {
	return { name, description: name, parameters: Type.Object({}) };
}
async function capturePayload<T>(model: Model<Api>, context: Context): Promise<T> {
	let captured: T | undefined;
	await streamSimple(model, context, {
		onPayload: (payload) => {
			captured = payload as T;
			throw new PayloadCaptured();
		},
	}).result();
	if (!captured) throw new Error("Expected payload capture");
	return captured;
}
const modelBase = {
	baseUrl: "http://127.0.0.1:9/v1",
	reasoning: false,
	input: ["text"] as ("text" | "image")[],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 100000,
	maxTokens: 1000,
};
const baseTool = tool("base_tool");
const dropTool = tool("drop_tool");
const lateTool = tool("late_tool");
const context: Context = {
	messages: [
		{
			role: "system",
			content: "base prompt",
			sections: { rules: "<rules>\nold rules\n</rules>", docs: "old docs" },
			toolsAdded: [baseTool],
			timestamp: 0,
		},
		{ role: "user", content: "before", timestamp: 1 },
		{
			role: "system",
			content: "updated guidance",
			sections: { rules: "<rules>\nnew rules\n</rules>", docs: null },
			toolsRemoved: [{ name: "base_tool" }],
			toolsAdded: [lateTool],
			timestamp: 2,
		},
	],
};
describe("local transcript tool changes", () => {
	// #10940: removals and redeclarations move the top-level boundary once; plain additions stay anchored.
	test("resolves the top-level tool boundary per transport", () => {
		const messages = [
			{ role: "system", content: "base prompt", toolsAdded: [baseTool, dropTool], timestamp: 0 },
			{ role: "system", content: "", toolsRemoved: [{ name: "drop_tool" }], timestamp: 1 },
			{ role: "system", content: "", toolsAdded: [dropTool], timestamp: 2 },
			{ role: "system", content: "", toolsAdded: [{ ...lateTool, description: "x" }], timestamp: 3 },
			{ role: "system", content: "", toolsAdded: [{ ...lateTool, description: "y" }], timestamp: 4 },
		] satisfies SystemMessage[];

		expect(resolveTranscriptTools(messages.slice(0, 2), "additions")).toEqual({
			requestTools: [baseTool],
			foldedSystemMessages: 2,
		});
		// Kimi K3 ignores a removed tool that a later tool message declares again, so the re-added
		// drop_tool moves the boundary; the new late_tool after it stays anchored.
		expect(resolveTranscriptTools(messages.slice(0, 4), "additions")).toEqual({
			requestTools: [baseTool, dropTool],
			foldedSystemMessages: 3,
		});
		// The redefinition of late_tool moves the boundary to its message.
		expect(resolveTranscriptTools(messages, "additions")).toEqual({
			requestTools: [baseTool, dropTool, { ...lateTool, description: "y" }],
			foldedSystemMessages: 5,
		});
		expect(resolveTranscriptTools(messages, "changes")).toEqual({ requestTools: [], foldedSystemMessages: 0 });
		expect(resolveTranscriptTools(messages, "none")).toEqual({
			requestTools: [baseTool, dropTool, { ...lateTool, description: "y" }],
			foldedSystemMessages: 5,
		});
	});
	test("folds OpenAI-compatible updates into the system prompt without native support", async () => {
		const model: Model<"openai-completions"> = {
			...modelBase,
			id: "custom-model",
			name: "Custom model",
			api: "openai-completions",
			provider: "custom-provider",
			reasoning: false,
		};
		const payload = await capturePayload<{
			tools?: Array<{ function?: { name: string } }>;
			messages: Array<{ role: string; content?: string }>;
		}>(model, context);

		expect(payload.tools?.map((value) => value.function?.name)).toEqual(["late_tool"]);
		expect(payload.messages.map((message) => message.role)).toEqual(["system", "user"]);
		expect(payload.messages[0]?.content).toBe("base prompt\n\nupdated guidance\n\n<rules>\nnew rules\n</rules>");
	});
});
