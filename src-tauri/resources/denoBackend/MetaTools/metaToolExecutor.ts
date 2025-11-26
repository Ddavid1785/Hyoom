import { MetaToolCall } from "../LLM/LLMtypes.ts";
import { toolSearch } from "./toolSearch.ts";
import { join } from "std/path/mod.ts";

export async function executeMetaTools(tools: MetaToolCall[]): Promise<string[]> {
  const results: string[] = [];
  
  for (const tool of tools) {
    if (tool.name === "tool_search") {
      console.log(`🔎 Searching for: ${tool.args.query}`);
      
      const foundTools = await toolSearch(tool.args.query);

      const enrichedResults = [];

      for (const t of foundTools) {
        try {
          const cleanInternalPath = t.relativePath
            .replace(/^(\.\.[\/\\])?Tools[\/\\]/, "")
            .replace(/\\/g, "/");

          const absolutePath = join(Deno.cwd(), "Tools", cleanInternalPath);
          
          const content = await Deno.readTextFile(absolutePath);
          
          enrichedResults.push({
            name: t.name,
            description: t.description,
            path: t.relativePath,
            sourceCode: content
          });
        // deno-lint-ignore no-explicit-any
        } catch (err: any) {
          console.error(`Failed to auto-read ${t.name}:`, err);
          enrichedResults.push({
            ...t,
            sourceCode: `Error reading file: ${err.message}`
          }); 
        }
      }

      results.push(JSON.stringify(enrichedResults));
    }
      }
  
  return results;
}