import { getFilePath } from "../filePath.ts";
import { getEmbedder } from "../Semantic/embedder.ts";
import { StoredMemory } from "../Semantic/types.ts";

const FILE_PATH = getFilePath();
const MEMORY_FILE = `${FILE_PATH}/memories.json`;

export async function addMemory(content: string) {
  const embedder = await getEmbedder();
  
  const vector = new Float32Array(await embedder.embed(content));
  
  const newMemory: StoredMemory = {
    id: crypto.randomUUID(),
    content,
    embedding: Array.from(vector), 
    timestamp: new Date().toISOString(),
  };

  let current: StoredMemory[] = [];
  try {
    const raw = await Deno.readTextFile(MEMORY_FILE);
    current = JSON.parse(raw);
  } catch { /* file might not exist yet */ }
  
  current.push(newMemory);
  
  await Deno.writeTextFile(MEMORY_FILE, JSON.stringify(current, null, 2));
  return "Memory saved successfully.";
}