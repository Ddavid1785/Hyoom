import { MetaToolCall } from "../LLM/LLMtypes.ts";
import { toolSearch } from "./toolSearch.ts";
import { searchMemories } from "../Memory/searchMemories.ts";
import { join } from "std/path/mod.ts";
import { addMemory } from "./addMemory.ts";
import { TokenEmbedding } from "../Semantic/types.ts";
import { getEmbedder } from "../Semantic/embedder.ts";

export async function executeMetaTools(tools: MetaToolCall[]): Promise<string[]> {
  const results: string[] = [];
  
  for (const tool of tools) {
    
    if (tool.name === "tool_search") {
      const query = tool.args.query;
      //console.log(`🔎 Searching Tools & Memory for: "${query}"`);
      
    const embedder = await getEmbedder();
    const queryEmbedding: TokenEmbedding = new Float32Array(await embedder.embed(query));

//console.log(`🔎 Searching Tools & Memory for: "${query}"`);
      const [foundTools, foundMemories] = await Promise.all([

        toolSearch(queryEmbedding),
        searchMemories(queryEmbedding, 3) 
      ]);

 //const toolsLog = foundTools
        //.map(t => `${t.name} (${t.score.toFixed(2)})`)
       // .join(", ");
        
      //console.log(`results for "${query}"\n tools: [${toolsLog}]\n memories: [${foundMemories}]`);

      // deno-lint-ignore no-explicit-any
      const outputObj: any = {
        tools: [],
        relevant_memories: []
      };

      for (const t of foundTools) {
        try {
          const cleanInternalPath = t.relativePath
            .replace(/^(\.\.[\/\\])?Tools[\/\\]/, "")
            .replace(/\\/g, "/");

          const absolutePath = join(Deno.cwd(), "Tools", cleanInternalPath);
          const content = await Deno.readTextFile(absolutePath);
          
          outputObj.tools.push({
            name: t.name,
            description: t.description,
            path: t.relativePath,
            sourceCode: content
          });
        // deno-lint-ignore no-explicit-any
        } catch (err: any) {
         // console.error(`Failed to read ${t.name}:`, err);
        }
      }

      if (foundMemories.length > 0) {
        outputObj.relevant_memories = foundMemories;
      }

      results.push(JSON.stringify(outputObj, null, 2));
    }
    
    else if (tool.name === "add_memory") {
       try {
            const result = await addMemory(tool.args.content);
            results.push(result);
        // deno-lint-ignore no-explicit-any
        } catch (err: any) {
            results.push(`Error: ${err.message}`);
        }
    }else if (tool.name === "search_memory") {
      const query = tool.args.query;
      //console.log(`🧠 Explicit Memory Search for: "${query}"`);

      try {
        const embedder = await getEmbedder();
        const queryEmbedding: TokenEmbedding = new Float32Array(await embedder.embed(query));
        
        const foundMemories = await searchMemories(queryEmbedding, 5);
        
        results.push(JSON.stringify({ found_memories: foundMemories }, null, 2));
      // deno-lint-ignore no-explicit-any
      } catch (err: any) {
        //console.error("Memory search failed:", err);
        results.push(`Error searching memory: ${err.message}`);
      }
    }
  }
  
  return results;
}