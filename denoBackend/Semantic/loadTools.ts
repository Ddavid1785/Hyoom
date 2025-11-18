import { getFilePath } from "../filePath.ts";
import { Tool } from "./types.ts";

const FILE_PATH = getFilePath();
const embeddingsFilePath = `${FILE_PATH}/toolEmbeddings.json`;
let cachedTools: Tool[] | null = null;

export async function loadTools() {
  if (cachedTools) return cachedTools;

try {
  const text = await Deno.readTextFile(embeddingsFilePath);
  cachedTools = JSON.parse(text);
} catch (err) {
            console.error(`Failed to search for tools`, err);
        return null
}
  return cachedTools;
}
