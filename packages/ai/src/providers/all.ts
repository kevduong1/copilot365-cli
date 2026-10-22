import { type CreateModelsOptions, createModels, type MutableModels, type Provider } from "../models.ts";
import type { AnyModel, Api, ClassifierApi, ClassifierModel, ImageApi, ImageModel, Model } from "../types.ts";
import { localProvider } from "./local.ts";

export { localModel, localProvider } from "./local.ts";
export type BuiltinProvider = "local";

export function getBuiltinProviders(): BuiltinProvider[] {
	return ["local"];
}
export function getBuiltinModel(provider: string, modelId: string): Model<"openai-completions"> | undefined {
	return getBuiltinModels(provider).find((model) => model.id === modelId);
}
export function getBuiltinModels(provider: string): Model<"openai-completions">[] {
	return provider === "local" ? [...localProvider().getModels()] : [];
}
export function getBuiltinModelDataGeneratedAt(): number | undefined {
	return undefined;
}
export function getBuiltinImageModel(_provider: string, _modelId: string): ImageModel<ImageApi> | undefined {
	return undefined;
}
export function getBuiltinClassifierModel(
	_provider: string,
	_modelId: string,
): ClassifierModel<ClassifierApi> | undefined {
	return undefined;
}
export function getBuiltinImageModels(_provider: string): ImageModel<ImageApi>[] {
	return [];
}
export function getBuiltinClassifierModels(_provider: string): ClassifierModel<ClassifierApi>[] {
	return [];
}
export function getAllBuiltinModels(provider: string): AnyModel[] {
	return getBuiltinModels(provider);
}
export function builtinProviders(): Provider<Api>[] {
	return [localProvider()];
}
export function builtinModels(options?: CreateModelsOptions): MutableModels {
	const models = createModels(options);
	models.setProvider(localProvider());
	return models;
}
