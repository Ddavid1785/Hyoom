import { getFilePath } from "../filePath.ts";
import { executeAICode } from "../LLM/LLMCodeExecutor.ts";
import { LLMProvider, LLMResponse } from "../LLM/LLMtypes.ts";
import { executeMetaTools } from "../MetaTools/metaToolExecutor.ts";
import { AppSettings, LLMMessage } from "../shared/sharedTypes.ts";
import { StreamUpdate } from "./utilTypes.ts";

const SETTINGS_PATH = getFilePath();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loadSettings() {
  let settings: AppSettings;
  try {
    const raw = await Deno.readTextFile(`${SETTINGS_PATH}/settings.json`);
    settings = JSON.parse(raw);
  } catch (err) {
    //console.error("Failed to read settings:", err);
    return {} as AppSettings;
  }
  return settings;
}

export async function agentLoop(
  provider: LLMProvider, 
  contextMessages: LLMMessage[],
  globalMessages: LLMMessage[],  
  send: (update: StreamUpdate) => void,
  turnLimit?: number 
) {
  let maxIterations = turnLimit ?? 10;
  while (maxIterations-- > 0) {
   // console.log(`🔄 Turn ${10 - maxIterations}`);
    
    send({ type: "status", message: "Thinking..." });

    const response: LLMResponse = await provider.call(contextMessages);
    //console.log(response)
    if (response.metaToolCalls && response.metaToolCalls.length > 0) {
      const toolName = response.metaToolCalls[0].name === "tool_search" ? "Searching for tools..." : "Executing tool...";
      send({ type: "status", message: toolName });

        await sleep(800);

      const results = await executeMetaTools(response.metaToolCalls);
      
    const assistantMsg: LLMMessage = { role: "assistant", content: JSON.stringify({ metaToolCalls: response.metaToolCalls }) };
    const toolMsg: LLMMessage = { role: "user", content: `[TOOL SEARCH RESULTS]:\n${JSON.stringify(results)}` };

      contextMessages.push(assistantMsg, toolMsg);
      globalMessages.push(assistantMsg, toolMsg);
    }
    
    if (response.code) {
      send({ type: "status", message: "Writing and executing code..." });

    await sleep(1000); 

      const executionResult = await executeAICode(response.code);
      const safeOutput = JSON.stringify(executionResult);

     const assistantMsg: LLMMessage = { role: "assistant", content: JSON.stringify({ content: response.content, code: response.code }) };
      const codeMsg: LLMMessage = { role: "user", content: `[CODE EXECUTION OUTPUT]:\n${safeOutput}` };

      contextMessages.push(assistantMsg, codeMsg);
      globalMessages.push(assistantMsg, codeMsg);
      continue;
    }
    
if (response.done) {
  if (!response.content) {
    send({
      type: "error",
      error: "Agent signaled done without any message"
    });
    continue;
  }

  await sleep(500);
globalMessages.push({ role: "assistant", content: response.content });

  send({ type: "content", text: response.content });
  return;
}
  }
  
  send({ type: "error", error: "Max iterations reached" });
}