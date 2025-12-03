import { getFilePath } from "../filePath.ts";
import { Memory, StoredMemory } from "../Semantic/types.ts"; 

const FILE_PATH = getFilePath();
const MEMORY_FILE = `${FILE_PATH}/memories.json`;

export async function loadMemories(): Promise<Memory[]> {
  try {
    const raw = await Deno.readTextFile(MEMORY_FILE);
    const stored: StoredMemory[] = JSON.parse(raw);
    
    return stored.map(m => ({
      ...m,
      embedding: new Float32Array(m.embedding)
    }));
  } catch {
    return [];
  }
}
