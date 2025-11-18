import { findLLMChoice } from "./LLM/LLMChoices.ts";
import { AppSettings } from "../src/types.ts";
import { LLMMessage, LLMProvider, LLMResponse } from "./LLM/LLMtypes.ts";
import { createProvider } from "./LLM/ProviderChooser.ts";
import { SYSTEM_PROMPT } from "./LLM/SystemPrompt.ts";
import { executeMetaTools } from "./MetaTools/metaToolExecutor.ts";
import { getFilePath } from "./filePath.ts";
import { loadTools } from "./Semantic/loadTools.ts";
import { createToolValues } from "./Semantic/createToolValues.ts";
import { executeAICode } from "./LLM/LLMCodeExecutor.ts";
import { getToolsInfo } from "./Semantic/getToolsInfo.ts";

(async () => {
  const tools = await loadTools();

  if (!tools || tools.length === 0) {
    console.log("Tool embeddings missing, generating...");

const tools = await getToolsInfo()
console.log("TOOLS INFO:", tools)
    await createToolValues(tools);
    console.log("Tool embeddings generated ✅");
  } else {
    console.log("Tool embeddings loaded ✅");
  }
})();

const SETTINGS_PATH = getFilePath();

  const headers = {
    "Access-Control-Allow-Origin": "*",   
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

Deno.serve({ port: 3000 }, async (req) => {
  const url = new URL(req.url);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (url.pathname === "/chat" && req.method === "POST") {

const body: { history: LLMMessage[] } = await req.json();
    const  settings: AppSettings = await loadSettings();

    const llmChoice = validateSettings(settings);

    if (!llmChoice) {
  return Response.json({ error: "No valid LLM configured" }, { headers, status: 400 });
    }

    console.log("📨 Received:", body);

const provider = createProvider(settings.llmApiKey ,llmChoice);
const messages: LLMMessage[] = [
  { role: "system", content: SYSTEM_PROMPT, images: undefined },
  ...body.history
];

const res = await agentLoop(provider, messages)

if (res.code){
await executeAICode(res.code)
}

    return Response.json({
      content: res.content
    }, {headers});
  }
  
  if (url.pathname === "/health") {
    return Response.json({ status: "ok" }, {headers});
  }
  
  return new Response("Not Found", { status: 404, headers });
});

async function agentLoop(provider: LLMProvider, messages: LLMMessage[]) {
  let maxIterations = 10; 
  
  while (maxIterations-- > 0) {
    const response:LLMResponse = await provider.call(messages);
    console.log("LLM RESPONSE IS: ",response)
    if (response.metaToolCalls) {
     const results = await executeMetaTools(response.metaToolCalls);
      
      messages.push({
        role: "assistant",
        content: JSON.stringify(response.metaToolCalls),
        images:undefined
      });
      messages.push({
        role: "user",
        content: `[TOOL RESULTS]: ${JSON.stringify(results)}`,
        images: undefined
      });
      
      continue;
    }
    
    if (response.code || response.content) {
      return { content: response.content, code: response.code };
    }
    
    throw new Error("LLM returned neither tools nor response");
  }
  
  throw new Error("Max iterations reached");
}

async function loadSettings() {
  let settings: AppSettings;

      try {
      const raw = await Deno.readTextFile(`${SETTINGS_PATH}/settings.json`);
      settings = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to read settings:", err);
      return {} as AppSettings;
    }
    return settings;
}

function validateSettings(settings: AppSettings) {
  if (!settings.llmChoice || !settings.llmApiKey) return null;

  const choice = findLLMChoice(settings.llmChoice);
  return choice || null;
}
