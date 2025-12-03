import { TokenEmbedding, Tool } from "../Semantic/types.ts";
import { semanticSearch } from "../Semantic/semanticSearch.ts";
import { loadTools } from "../Semantic/loadTools.ts";

export async function toolSearch(queryEmbedding:TokenEmbedding) {

    const toolEmbeddings = await loadTools();

    if(!toolEmbeddings){
        return [];
    }

const results = topMatches(queryEmbedding, toolEmbeddings, 3);
return results;

}

export function topMatches(
  queryEmbedding: TokenEmbedding,
  tools: Tool[],
  topN: number = 3,
  minScore: number = 0.45
) {
  const scored = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    relativePath: tool.relativePath,
    score: semanticSearch(queryEmbedding, tool.embedding)
  })).filter(item => item.score >= minScore);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}
