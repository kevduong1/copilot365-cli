import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	type Api,
	type AssistantMessage,
	createAssistantMessageEventStream,
	getAttributionHeaders,
	type Model,
	normalizeContext,
	type SimpleStreamOptions,
} from "@garmin-code-mini/ai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { createAgentSession } from "../src/core/sdk.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";

describe("createAgentSession client identity", () => {
	let tempDir: string;
	let cwd: string;
	let agentDir: string;
	let originalTelemetryEnv: string | undefined;

	beforeEach(() => {
		tempDir = join(
			tmpdir(),
			`garmin-code-mini-sdk-identity-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		cwd = join(tempDir, "project");
		agentDir = join(tempDir, "agent");
		mkdirSync(cwd, { recursive: true });
		mkdirSync(agentDir, { recursive: true });
		originalTelemetryEnv = process.env.GARMIN_CODE_MINI_TELEMETRY;
		delete process.env.GARMIN_CODE_MINI_TELEMETRY;
	});

	afterEach(() => {
		if (originalTelemetryEnv === undefined) {
			delete process.env.GARMIN_CODE_MINI_TELEMETRY;
		} else {
			process.env.GARMIN_CODE_MINI_TELEMETRY = originalTelemetryEnv;
		}
		if (tempDir && existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	function createModel(provider: string, baseUrl: string, id = `${provider}-test-model`): Model<Api> {
		return {
			id,
			name: `${provider} Test Model`,
			api: "openai-completions",
			provider,
			baseUrl,
			reasoning: false,
			input: ["text"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			contextWindow: 128000,
			maxTokens: 4096,
		};
	}

	function createDoneStream() {
		const stream = createAssistantMessageEventStream();
		const message: AssistantMessage = {
			role: "assistant",
			content: [{ type: "text", text: "ok" }],
			api: "openai-completions",
			provider: "capture-provider",
			model: "capture-model",
			usage: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 0,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
			},
			stopReason: "stop",
			timestamp: Date.now(),
		};
		stream.end(message);
		return stream;
	}

	async function captureOptions(
		model: Model<Api>,
		options: {
			telemetryEnabled?: boolean;
			providerHeaders?: Record<string, string>;
			sessionId?: string;
		} = {},
	): Promise<SimpleStreamOptions | undefined> {
		const settingsManager = SettingsManager.create(cwd, agentDir);
		if (options.telemetryEnabled === false) {
			settingsManager.setEnableInstallTelemetry(false);
		}

		const authStorage = AuthStorage.inMemory({
			[model.provider]: { type: "api_key", key: "test-api-key" },
		});
		const modelRegistry = await createInMemoryModelRegistry(authStorage);
		let capturedOptions: SimpleStreamOptions | undefined;

		modelRegistry.registerProvider(model.provider, {
			api: model.api,
			headers: options.providerHeaders,
			streamSimple: (_model, _context, providerOptions) => {
				capturedOptions = providerOptions;
				return createDoneStream();
			},
		});

		const modelRuntime = getModelRuntime(modelRegistry);
		const sessionManager = SessionManager.inMemory(cwd);
		if (options.sessionId) {
			sessionManager.newSession({ id: options.sessionId });
		}

		const { session } = await createAgentSession({
			cwd,
			agentDir,
			model,
			modelRuntime,
			settingsManager,
			sessionManager,
		});

		try {
			const stream = await session.agent.streamFunction(model, normalizeContext({ messages: [] }), {
				sessionId: session.sessionId,
			});
			await stream.result();
			return capturedOptions;
		} finally {
			session.dispose();
			modelRegistry.unregisterProvider(model.provider);
		}
	}

	it("uses the local CLI identity without provider attribution", async () => {
		const model = createModel("local-identity", "http://localhost:8080/v1");
		const options = await captureOptions(model);

		expect(options?.identity).toEqual({
			userAgent: { custom: "garmin-code-mini" },
			attribution: null,
		});
		expect(getAttributionHeaders(model, options?.identity)).toEqual({});
	});

	it("turns attribution off when telemetry is disabled", async () => {
		const model = createModel("local-identity", "http://localhost:8080/v1");
		const options = await captureOptions(model, { telemetryEnabled: false });

		expect(options?.identity).toEqual({ userAgent: { custom: "garmin-code-mini" }, attribution: null });
		expect(getAttributionHeaders(model, options?.identity)).toEqual({});
	});

	it("turns attribution off with GARMIN_CODE_MINI_TELEMETRY=0", async () => {
		process.env.GARMIN_CODE_MINI_TELEMETRY = "0";
		const options = await captureOptions(createModel("local-identity", "http://localhost:8080/v1"));

		expect(options?.identity?.attribution).toBeNull();
	});

	it("does not add provider session headers to local requests", async () => {
		const options = await captureOptions(createModel("local-identity", "http://localhost:8080/v1"), {
			sessionId: "local-session",
		});

		expect(options?.headers ?? {}).toEqual({});
	});

	it("preserves explicit custom local headers", async () => {
		const options = await captureOptions(createModel("local-identity", "http://localhost:8080/v1"), {
			sessionId: "local-session",
			providerHeaders: {
				"x-local-session": "configured-session",
			},
		});

		expect(options?.headers?.["x-local-session"]).toBe("configured-session");
	});
});
