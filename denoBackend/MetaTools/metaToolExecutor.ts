import { MetaToolCall } from "../LLM/LLMtypes.ts";
import { toolRead } from "./toolRead.ts";
import { toolSearch } from "./toolSearch.ts";

export async function executeMetaTools(tools: MetaToolCall[]): Promise<string[]> {
  const results: string[] = [];
  
  for (const tool of tools) {
    if (tool.name === "tool_search") {
      const foundTools = await toolSearch(tool.args.query);
      results.push(JSON.stringify(foundTools));
    }
    
    if (tool.name === "tool_read") {
      try {
        const content = await toolRead(tool.args.path)
        results.push(content);
      // deno-lint-ignore no-explicit-any
      } catch (err:any) {
        results.push(`Error reading ${tool.args.path}: ${err.message}`);
      }
    }
  }
  console.log("results from meta tools: ", results)
  return results;
}