const UNKNOWN_PROVIDER = "unknown";

export function getProviderLoginHelp(): string {
	return "Start a local OpenAI-compatible server. Set GARMIN_CODE_MINI_BASE_URL and GARMIN_CODE_MINI_MODEL to select its endpoint and model.";
}

export function formatNoModelsAvailableMessage(): string {
	return `No models available. ${getProviderLoginHelp()}`;
}

export function formatNoModelSelectedMessage(): string {
	return `No model selected.\n\n${getProviderLoginHelp()}\n\nThen use /model to select a model.`;
}

export function formatNoApiKeyFoundMessage(provider: string): string {
	const providerDisplay = provider === UNKNOWN_PROVIDER ? "the selected model" : provider;
	return `Could not configure ${providerDisplay}.\n\n${getProviderLoginHelp()} If your local server requires a key, set GARMIN_CODE_MINI_API_KEY.`;
}
