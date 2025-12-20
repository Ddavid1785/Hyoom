import { Model, InferenceProviderType } from "../shared/sharedTypes.ts";
import { getFilePath } from "../filePath.ts";
import { models } from "./LLMStatic.ts";

const confDirPath = getFilePath();
const customModelsPath = `${confDirPath}/customModels.json`;

async function getCustomModels(): Promise<Model[]> {
  try {
    const raw = await Deno.readTextFile(customModelsPath);
    return JSON.parse(raw);
  } catch (_e) {
    return [];
  }
}

export async function findModel(modelId: string): Promise<Model | undefined> {
  let model = models.find((m) => m.id === modelId);

  if (!model) {
    const customModels = await getCustomModels();
    model = customModels.find((m) => m.id === modelId);
  }

  return model;
}

export async function getModelIdForProvider(
  modelId: string,
  providerId: InferenceProviderType
): Promise<string | null> {
  const model = await findModel(modelId);
  if (!model) return null;

  return model.providerModelIds[providerId] ?? null;
}

export async function getModelsForProvider(
  providerId: InferenceProviderType
): Promise<Model[]> {
  const customModels = await getCustomModels();
  const allModels = [...models, ...customModels];

  return allModels.filter((m) => m.providerModelIds[providerId] !== null);
}

export async function getProvidersForModel(
  modelId: string
): Promise<InferenceProviderType[]> {
  const model = await findModel(modelId);
  if (!model) return [];

  return Object.entries(model.providerModelIds)
    .filter(([_, id]) => id !== null)
    .map(([providerId]) => providerId as InferenceProviderType);
}
