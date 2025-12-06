import { semanticSearch } from "../Semantic/semanticSearch.ts";
import { TokenEmbedding, Memory } from "../Semantic/types.ts";
import { loadMemories } from "./loadMemories.ts";

export async function searchMemories(queryEmbedding: TokenEmbedding, topN = 3): Promise<string[]> {
  const memories = await loadMemories();
  
  if (memories.length === 0) {
      return [];
  }

  const results = topMatches(queryEmbedding, memories, topN);
  
  return results.map(r => `${r.content} (Recorded: ${r.timestamp.split("T")[0]})`);
}

function topMatches(
  queryEmbedding: TokenEmbedding,
  memories: Memory[],
  topN: number = 3,
  minScore: number = 0.45
) {
  const scored = memories.map(mem => ({
    ...mem,
    score: semanticSearch(queryEmbedding, mem.embedding)
  })).filter(item => item.score >= minScore);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}