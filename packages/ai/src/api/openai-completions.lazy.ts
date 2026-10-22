import type { ProviderStreams } from "../types.ts";
import * as completions from "./openai-completions.ts";

export const openAICompletionsApi = (): ProviderStreams => completions;
