import type { Models, MutableModels } from "../models.ts";
import { GCODE_AI_VERSION } from "./version.ts";

/**
 * The `User-Agent` sent to providers:
 * - `"detailed"`: `gcode/<version> (<platform>; <runtime>/<runtime version>; <arch>)`, or `gcode/<version> (browser)`
 *   outside Node.js and Bun.
 * - `"short"`: `gcode`.
 * - `{ custom }`: the given value.
 */
export type UserAgentMode = "short" | "detailed" | { custom: string };

/** Optional app metadata retained in local request configuration. */
export interface ClientAttribution {
	/** App name. */
	name: string;
	/** App URL. */
	url: string;
	/** App categories, for example `["cli-agent"]`. */
	categories?: string[];
}

/** gcode's attribution, used by gcode-agent-core, gcode-durable, and the coding agent. */
export const GCODE_ATTRIBUTION: ClientAttribution = {
	name: "gcode",
	url: "http://localhost",
	categories: ["cli-agent"],
};

/**
 * How gcode-ai identifies the calling app to providers. Every field is optional; absent fields use gcode-ai's defaults:
 * a detailed `User-Agent` with gcode-ai's version and no attribution headers. Plain JSON, so it can be persisted.
 */
export interface ClientIdentity {
	/** Default: `"detailed"`. */
	userAgent?: UserAgentMode;
	/** Provider attribution headers. Absent or `null`: none; `null` also turns off attribution set by a merged identity. */
	attribution?: ClientAttribution | null;
	/** Version in the detailed `User-Agent`. Default: the gcode-ai version. */
	version?: string;
}

/** The provider and endpoint a request goes to. */
export interface ClientIdentityTarget {
	readonly provider: string;
	readonly baseUrl: string;
}

/** Merge identities field by field; later sources win and undefined fields are skipped. */
export function mergeClientIdentity(...sources: (ClientIdentity | undefined)[]): ClientIdentity | undefined {
	let merged: ClientIdentity | undefined;
	for (const source of sources) {
		if (!source) continue;
		merged = { ...merged };
		if (source.userAgent !== undefined) merged.userAgent = source.userAgent;
		if (source.attribution !== undefined) merged.attribution = source.attribution;
		if (source.version !== undefined) merged.version = source.version;
	}
	return merged;
}

/** The version in the detailed `User-Agent`. */
export function getClientVersion(identity?: ClientIdentity): string {
	return identity?.version ?? GCODE_AI_VERSION;
}

function runtimeDescription(): string | undefined {
	if (typeof process === "undefined") return undefined;
	const versions = process.versions;
	if (versions?.bun) return `bun/${versions.bun}`;
	if (versions?.node) return `node/${process.version}`;
	return undefined;
}

/** The `User-Agent` value of an identity. */
export function formatUserAgent(identity?: ClientIdentity): string {
	const mode = identity?.userAgent ?? "detailed";
	if (typeof mode === "object") return mode.custom;
	if (mode === "short") return "gcode";
	const product = `gcode/${getClientVersion(identity)}`;
	const runtime = runtimeDescription();
	return runtime ? `${product} (${process.platform}; ${runtime}; ${process.arch})` : `${product} (browser)`;
}

/** Local inference does not attach billing or client attribution headers. */
export function getAttributionHeaders(
	_target: ClientIdentityTarget,
	_identity?: ClientIdentity,
): Record<string, string> {
	return {};
}
export function getOpenCodeSessionHeaders(
	_target: ClientIdentityTarget,
	_sessionId: string | undefined,
): Record<string, string> | undefined {
	return undefined;
}
export function getIdentityHeaders(_target: ClientIdentityTarget, _identity?: ClientIdentity): Record<string, string> {
	return {};
}

function isMutableModels(models: Models): models is MutableModels {
	return "setProvider" in models && "deleteProvider" in models && "clearProviders" in models;
}

/**
 * `models` with `identity` as the default identity of its requests: a request's `identity` overrides it field by
 * field, and it overrides the identity `models` was created with. Everything else is delegated unchanged; a
 * `MutableModels` stays mutable.
 */
export function withClientIdentity(models: MutableModels, identity: ClientIdentity): MutableModels;
export function withClientIdentity(models: Models, identity: ClientIdentity): Models;
export function withClientIdentity(models: Models, identity: ClientIdentity): Models {
	const withIdentity = <T extends { identity?: ClientIdentity }>(options: T | undefined): T =>
		({ ...options, identity: mergeClientIdentity(identity, options?.identity) }) as T;
	const wrapped: Models = {
		getProviders: () => models.getProviders(),
		getProvider: (id) => models.getProvider(id),
		getModels: (provider) => models.getModels(provider),
		getModel: (provider, id) => models.getModel(provider, id),
		getModelsOfType: (type, provider) => models.getModelsOfType(type, provider),
		getModelOfType: (type, provider, id) => models.getModelOfType(type, provider, id),
		getAllModels: (provider) => models.getAllModels(provider),
		refresh: (options) => models.refresh(options),
		checkAuth: (providerId, options) => models.checkAuth(providerId, options),
		getAvailable: (providerId, options) => models.getAvailable(providerId, options),
		getAvailableOfType: (type, providerId, options) => models.getAvailableOfType(type, providerId, options),
		getAllAvailable: (providerId, options) => models.getAllAvailable(providerId, options),
		getAuth: models.getAuth.bind(models),
		login: (providerId, type, interaction, options) => models.login(providerId, type, interaction, options),
		logout: (providerId, options) => models.logout(providerId, options),
		stream: (model, context, options) => models.stream(model, context, withIdentity(options)),
		complete: (model, context, options) => models.complete(model, context, withIdentity(options)),
		streamSimple: (model, context, options) => models.streamSimple(model, context, withIdentity(options)),
		completeSimple: (model, context, options) => models.completeSimple(model, context, withIdentity(options)),
		streamDeferred: (model, handle, options) => models.streamDeferred(model, handle, withIdentity(options)),
		fetchDeferred: (model, handle, options) => models.fetchDeferred(model, handle, withIdentity(options)),
		cancelDeferred: (model, handle, options) => models.cancelDeferred(model, handle, withIdentity(options)),
		generateImages: (model, context, options) => models.generateImages(model, context, withIdentity(options)),
		classify: (model, context, options) => models.classify(model, context, withIdentity(options)),
	};
	if (!isMutableModels(models)) return wrapped;
	const mutable: MutableModels = {
		...wrapped,
		setProvider: (provider) => models.setProvider(provider),
		deleteProvider: (id) => models.deleteProvider(id),
		clearProviders: () => models.clearProviders(),
	};
	return mutable;
}
